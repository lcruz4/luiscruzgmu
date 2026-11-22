import { randomInt } from 'node:crypto';
import { Pool, PoolClient } from 'pg';
import {
  applyAction,
  initialState,
  opponent,
  RuleError,
} from '@/lib/remorse/engine';
import type {
  Action,
  Color,
  GameEvent,
  GameMode,
  GameResponse,
  GameState,
  GameStep,
  GameSummary,
  PlayerStats,
  Trauma,
} from '@/types/remorse';
import { HttpError } from './api';

export const remorsePool = new Pool({
  connectionString: process.env.REMORSE_DB_URL,
});

const withTransaction = async <T>(
  run: (client: PoolClient) => Promise<T>,
): Promise<T> => {
  const client = await remorsePool.connect();
  try {
    await client.query('BEGIN');
    const result = await run(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

interface GameRow {
  id: number;
  mode: GameMode;
  created_by: string;
  white_email: string | null;
  black_email: string | null;
  initial_state: GameState;
  state: GameState;
  version: number;
}

interface StepRow {
  step: number;
  color: Color;
  events: GameEvent[];
  created_at: Date;
}

// Colors this email plays; a local game's owner plays both
const seatsOf = (game: GameRow, email: string): Color[] => {
  const seats: Color[] = [];
  if (game.white_email === email) seats.push('w');
  if (game.black_email === email) seats.push('b');
  return seats;
};

// Undo is the opponent's call: only the other side can take back a step.
// A local game's owner sits on both sides, so they always can.
const canUndoStep = (
  game: GameRow,
  email: string,
  lastColor: Color | undefined,
) =>
  lastColor !== undefined && seatsOf(game, email).includes(opponent(lastColor));

export const listGames = async (email: string): Promise<GameSummary[]> => {
  const { rows } = await remorsePool.query<
    GameRow & { updated_at: Date; archived: boolean; rematch_id: number | null }
  >(
    `SELECT g.id, g.mode, g.white_email, g.black_email, g.state, g.updated_at,
            a.game_id IS NOT NULL AS archived, r.id AS rematch_id
     FROM games g
     LEFT JOIN game_archives a ON a.game_id = g.id AND a.email = $1
     LEFT JOIN games r ON r.rematch_of = g.id
     WHERE g.white_email = $1 OR g.black_email = $1
     ORDER BY g.updated_at DESC
     LIMIT 50`,
    [email],
  );
  return rows.map((row) => ({
    id: row.id,
    mode: row.mode,
    whiteEmail: row.white_email,
    blackEmail: row.black_email,
    turn: row.state.turn,
    winner: row.state.winner,
    pieces: row.state.pieces.map(({ color, type, square }) => ({
      color,
      type,
      square,
    })),
    archived: row.archived,
    rematchId: row.rematch_id,
    updatedAt: row.updated_at.toISOString(),
  }));
};

export const playerStats = async (email: string): Promise<PlayerStats> => {
  const record = await remorsePool.query<{
    wins: number;
    losses: number;
    draws: number;
  }>(
    `SELECT
       count(*) FILTER (WHERE (state->>'winner' = 'w' AND white_email = $1)
                           OR (state->>'winner' = 'b' AND black_email = $1))::int AS wins,
       count(*) FILTER (WHERE (state->>'winner' = 'w' AND black_email = $1)
                           OR (state->>'winner' = 'b' AND white_email = $1))::int AS losses,
       count(*) FILTER (WHERE state->>'winner' = 'draw')::int AS draws
     FROM games
     WHERE mode = 'online'
       AND (white_email = $1 OR black_email = $1)
       AND white_email <> black_email`,
    [email],
  );
  const rolls = await remorsePool.query<{ trauma: Trauma; count: number }>(
    `SELECT e->>'trauma' AS trauma, count(*)::int AS count
     FROM game_steps s
     CROSS JOIN LATERAL jsonb_array_elements(s.events) e
     WHERE s.email = $1 AND e->>'type' = 'roll'
     GROUP BY 1`,
    [email],
  );
  const traumas = { devastated: 0, guilt: 0, unaffected: 0, psychopath: 0 };
  for (const { trauma, count } of rolls.rows) traumas[trauma] = count;
  return { ...record.rows[0], traumas };
};

export const createGame = async (
  email: string,
  mode: GameMode,
  color: Color,
) => {
  const state = initialState();
  const white = mode === 'local' || color === 'w' ? email : null;
  const black = mode === 'local' || color === 'b' ? email : null;
  const { rows } = await remorsePool.query<{ id: number }>(
    `INSERT INTO games (mode, created_by, white_email, black_email, initial_state, state)
     VALUES ($1, $2, $3, $4, $5, $5)
     RETURNING id`,
    [mode, email, white, black, JSON.stringify(state)],
  );
  return rows[0].id;
};

// Same players, colors swapped. Both players asking land in one game: the
// old game's row lock orders them and the second finds the first's rematch.
export const createRematch = async (id: number, email: string) =>
  withTransaction(async (client) => {
    const game = await lockGame(client, id);
    const seats = seatsOf(game, email);
    if (!seats.length) throw new HttpError(403, "You didn't play this game");
    if (!game.state.winner) {
      throw new HttpError(400, "This game isn't over yet");
    }
    const color = game.mode === 'local' ? 'w' : opponent(seats[0]);
    const existing = await client.query<{ id: number }>(
      `SELECT id
       FROM games
       WHERE rematch_of = $1`,
      [id],
    );
    if (existing.rows[0]) return { id: existing.rows[0].id, color };
    const state = JSON.stringify(initialState());
    const { rows } = await client.query<{ id: number }>(
      `INSERT INTO games (mode, created_by, white_email, black_email, initial_state, state, rematch_of)
       VALUES ($1, $2, $3, $4, $5, $5, $6)
       RETURNING id`,
      [game.mode, email, game.black_email, game.white_email, state, id],
    );
    return { id: rows[0].id, color };
  });

export const setArchived = async (
  id: number,
  email: string,
  archived: boolean,
) => {
  if (archived) {
    await remorsePool.query(
      `INSERT INTO game_archives (game_id, email)
       SELECT id, $2
       FROM games
       WHERE id = $1 AND (white_email = $2 OR black_email = $2)
       ON CONFLICT DO NOTHING`,
      [id, email],
    );
  } else {
    await remorsePool.query(
      `DELETE FROM game_archives
       WHERE game_id = $1 AND email = $2`,
      [id, email],
    );
  }
};

const lockGame = async (client: PoolClient, id: number) => {
  const { rows } = await client.query<GameRow>(
    `SELECT id, mode, created_by, white_email, black_email, initial_state, state, version
     FROM games
     WHERE id = $1
     FOR UPDATE`,
    [id],
  );
  if (!rows[0]) throw new HttpError(404, 'Game not found');
  return rows[0];
};

const lastStep = async (client: PoolClient | Pool, id: number) => {
  const { rows } = await client.query<{ step: number; color: Color }>(
    `SELECT step, color
     FROM game_steps
     WHERE game_id = $1
     ORDER BY step DESC
     LIMIT 1`,
    [id],
  );
  return rows[0];
};

// Cheap check before a full getGame; undefined when the game doesn't exist
export const gameVersion = async (id: number) => {
  const { rows } = await remorsePool.query<{ version: number }>(
    `SELECT version
     FROM games
     WHERE id = $1`,
    [id],
  );
  return rows[0]?.version;
};

export const getGame = async (
  id: number,
  email: string,
): Promise<GameResponse> => {
  const { rows } = await remorsePool.query<GameRow>(
    `SELECT id, mode, created_by, white_email, black_email, initial_state, state, version
     FROM games
     WHERE id = $1`,
    [id],
  );
  const game = rows[0];
  if (!game) throw new HttpError(404, 'Game not found');
  const steps = await remorsePool.query<StepRow>(
    `SELECT step, color, events, created_at
     FROM game_steps
     WHERE game_id = $1
     ORDER BY step`,
    [id],
  );
  const rematch = await remorsePool.query<{ id: number }>(
    `SELECT id
     FROM games
     WHERE rematch_of = $1`,
    [id],
  );
  const last = steps.rows.at(-1);
  return {
    id: game.id,
    mode: game.mode,
    whiteEmail: game.white_email,
    blackEmail: game.black_email,
    state: game.state,
    version: game.version,
    steps: steps.rows.map(
      (row): GameStep => ({
        step: row.step,
        color: row.color,
        events: row.events,
        createdAt: row.created_at.toISOString(),
      }),
    ),
    you: seatsOf(game, email),
    canUndo: canUndoStep(game, email, last?.color),
    rematchId: rematch.rows[0]?.id ?? null,
  };
};

const assertVersion = (game: GameRow, version: number) => {
  if (game.version !== version) {
    throw new HttpError(409, 'The game changed. Showing the latest board.');
  }
};

export const playAction = async (
  id: number,
  email: string,
  version: number,
  action: Action,
) =>
  withTransaction(async (client) => {
    const game = await lockGame(client, id);
    assertVersion(game, version);
    const color = game.state.turn;
    if (!seatsOf(game, email).includes(color)) {
      throw new HttpError(403, "It's not your turn");
    }

    const rolls: number[] = [];
    let result: { state: GameState; events: GameEvent[] };
    try {
      result = applyAction(game.state, action, () => {
        const roll = randomInt(1, 7);
        rolls.push(roll);
        return roll;
      });
    } catch (error) {
      if (error instanceof RuleError) throw new HttpError(400, error.message);
      throw error;
    }

    const step = ((await lastStep(client, id))?.step ?? 0) + 1;
    await client.query(
      `INSERT INTO game_steps (game_id, step, color, email, action, rolls, events, state_after)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        id,
        step,
        color,
        email,
        JSON.stringify(action),
        rolls,
        JSON.stringify(result.events),
        JSON.stringify(result.state),
      ],
    );
    await client.query(
      `UPDATE games
       SET state = $2, version = version + 1
       WHERE id = $1`,
      [id, JSON.stringify(result.state)],
    );
  });

export const undoStep = async (id: number, email: string, version: number) =>
  withTransaction(async (client) => {
    const game = await lockGame(client, id);
    assertVersion(game, version);
    const last = await lastStep(client, id);
    if (!last) throw new HttpError(400, 'Nothing to undo');
    if (!canUndoStep(game, email, last.color)) {
      throw new HttpError(403, 'Only your opponent can undo your move');
    }

    await client.query(
      `DELETE FROM game_steps
       WHERE game_id = $1 AND step = $2`,
      [id, last.step],
    );
    const { rows } = await client.query<{ state_after: GameState }>(
      `SELECT state_after
       FROM game_steps
       WHERE game_id = $1
       ORDER BY step DESC
       LIMIT 1`,
      [id],
    );
    const state = rows[0]?.state_after ?? game.initial_state;
    await client.query(
      `UPDATE games
       SET state = $2, version = version + 1
       WHERE id = $1`,
      [id, JSON.stringify(state)],
    );
  });

export const joinGame = async (id: number, email: string) =>
  withTransaction(async (client) => {
    const game = await lockGame(client, id);
    if (game.mode !== 'online')
      throw new HttpError(400, 'This is a local game');
    if (seatsOf(game, email).length) return;
    if (game.white_email && game.black_email) {
      throw new HttpError(409, 'Both seats are taken');
    }
    await client.query(
      `UPDATE games
       SET white_email = COALESCE(white_email, $2),
           black_email = COALESCE(black_email, $2),
           version = version + 1
       WHERE id = $1`,
      [id, email],
    );
  });
