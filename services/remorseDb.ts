import { randomInt, randomUUID } from 'node:crypto';
import { DatabaseError, Pool, PoolClient } from 'pg';
import {
  applyAction,
  initialState,
  opponent,
  RuleError,
} from '@/lib/remorse/engine';
import type {
  Action,
  Challenge,
  Color,
  GameEvent,
  GameMode,
  GameResponse,
  GameState,
  GameStep,
  GameSummary,
  PlayerPage,
  PlayerRef,
  PlayerStats,
  Trauma,
} from '@/types/remorse';
import type { PlayerIcon } from '@/lib/remorse/icons';
import type { BoardThemeId } from '@/lib/remorse/boardThemes';
import type { PieceSetId } from '@/lib/remorse/pieceSets';
import { isTutorialKey, type TutorialKey } from '@/lib/remorse/tutorial';
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
  invite_token: string | null;
  matchmaking: boolean;
  challenged_email: string | null;
}

// null while the seat is empty
interface NameColumns {
  white_id: number | null;
  black_id: number | null;
  white_name: string | null;
  black_name: string | null;
  white_icon: PlayerIcon | null;
  black_icon: PlayerIcon | null;
}

// null when there's no challenge waiting
interface ChallengeColumns {
  challenged_email: string | null;
  challenged_id: number | null;
  challenged_name: string | null;
  challenged_icon: PlayerIcon | null;
}

const challengeOf = (row: ChallengeColumns, email: string): Challenge | null =>
  row.challenged_id !== null && row.challenged_name !== null
    ? {
        playerId: row.challenged_id,
        name: row.challenged_name,
        icon: row.challenged_icon,
        you: row.challenged_email === email,
      }
    : null;

// A player row gives them an id for their page
const ensurePlayer = async (client: PoolClient | Pool, email: string) => {
  await client.query(
    `INSERT INTO players (email)
     VALUES ($1)
     ON CONFLICT DO NOTHING`,
    [email],
  );
};

interface StepRow {
  step: number;
  color: Color;
  resigned: boolean;
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
// A resignation can't be taken back.
const canUndoStep = (
  game: GameRow,
  email: string,
  last: { color: Color; resigned: boolean } | undefined,
) =>
  last !== undefined &&
  !last.resigned &&
  seatsOf(game, email).includes(opponent(last.color));

export const listGames = async (email: string): Promise<GameSummary[]> => {
  const { rows } = await remorsePool.query<
    GameRow &
      NameColumns &
      ChallengeColumns & {
        updated_at: Date;
        archived: boolean;
        your_move: boolean;
        rematch_id: number | null;
      }
  >(
    `SELECT g.id, g.mode, g.white_email, g.black_email, g.state, g.updated_at,
            g.invite_token, g.matchmaking,
            a.game_id IS NOT NULL AS archived, r.id AS rematch_id,
            (g.mode = 'online'
              AND g.white_email IS NOT NULL
              AND g.black_email IS NOT NULL
              AND g.state->>'winner' IS NULL
              AND CASE g.state->>'turn' WHEN 'w' THEN g.white_email ELSE g.black_email END = $1
            ) AS your_move,
            COALESCE(pw.username, split_part(g.white_email, '@', 1)) AS white_name,
            COALESCE(pb.username, split_part(g.black_email, '@', 1)) AS black_name,
            pw.icon AS white_icon, pb.icon AS black_icon,
            pw.id AS white_id, pb.id AS black_id,
            g.challenged_email, pc.id AS challenged_id, pc.icon AS challenged_icon,
            COALESCE(pc.username, split_part(g.challenged_email, '@', 1)) AS challenged_name
     FROM games g
     LEFT JOIN game_archives a ON a.game_id = g.id AND a.email = $1
     LEFT JOIN games r ON r.rematch_of = g.id
     LEFT JOIN players pw ON pw.email = g.white_email
     LEFT JOIN players pb ON pb.email = g.black_email
     LEFT JOIN players pc ON pc.email = g.challenged_email
     WHERE g.white_email = $1 OR g.black_email = $1 OR g.challenged_email = $1
     ORDER BY g.updated_at DESC
     LIMIT 50`,
    [email],
  );
  return rows.map((row) => ({
    id: row.id,
    mode: row.mode,
    whiteEmail: row.white_email,
    blackEmail: row.black_email,
    whiteId: row.white_id,
    blackId: row.black_id,
    whiteName: row.white_name,
    blackName: row.black_name,
    whiteIcon: row.white_icon,
    blackIcon: row.black_icon,
    turn: row.state.turn,
    winner: row.state.winner,
    pieces: row.state.pieces.map(({ color, type, square }) => ({
      color,
      type,
      square,
    })),
    archived: row.archived,
    yourMove: row.your_move,
    rematchId: row.rematch_id,
    inviteToken: row.invite_token,
    matchmaking: row.matchmaking,
    challenge: challengeOf(row, email),
    updatedAt: row.updated_at.toISOString(),
  }));
};

// chosen: they've picked a name or kept the default when asked
export const getProfile = async (email: string) => {
  await ensurePlayer(remorsePool, email);
  const { rows } = await remorsePool.query<{
    id: number;
    username: string | null;
    icon: PlayerIcon | null;
    piece_set: PieceSetId | null;
    board_theme: BoardThemeId | null;
    name_chosen: boolean;
    tutorial_seen: string[];
  }>(
    `SELECT id, username, icon, piece_set, board_theme, name_chosen, tutorial_seen
     FROM players
     WHERE email = $1`,
    [email],
  );
  return {
    id: rows[0]?.id ?? null,
    username: rows[0]?.username ?? email.split('@')[0],
    icon: rows[0]?.icon ?? null,
    pieceSet: rows[0]?.piece_set ?? null,
    boardTheme: rows[0]?.board_theme ?? null,
    chosen: rows[0]?.name_chosen ?? false,
    tutorialSeen: (rows[0]?.tutorial_seen ?? []).filter(isTutorialKey),
  };
};

export const markTutorialSeen = async (email: string, keys: TutorialKey[]) => {
  await remorsePool.query(
    `INSERT INTO players (email, tutorial_seen)
     VALUES ($1, $2)
     ON CONFLICT (email) DO UPDATE
     SET tutorial_seen = ARRAY(
       SELECT DISTINCT unnest(players.tutorial_seen || EXCLUDED.tutorial_seen)
     )`,
    [email, keys],
  );
};

export const setIcon = async (email: string, icon: PlayerIcon) => {
  await remorsePool.query(
    `INSERT INTO players (email, icon)
     VALUES ($1, $2)
     ON CONFLICT (email) DO UPDATE SET icon = EXCLUDED.icon`,
    [email, icon],
  );
};

export const setPieceSet = async (email: string, pieceSet: PieceSetId) => {
  await remorsePool.query(
    `INSERT INTO players (email, piece_set)
     VALUES ($1, $2)
     ON CONFLICT (email) DO UPDATE SET piece_set = EXCLUDED.piece_set`,
    [email, pieceSet],
  );
};

export const setBoardTheme = async (
  email: string,
  boardTheme: BoardThemeId,
) => {
  await remorsePool.query(
    `INSERT INTO players (email, board_theme)
     VALUES ($1, $2)
     ON CONFLICT (email) DO UPDATE SET board_theme = EXCLUDED.board_theme`,
    [email, boardTheme],
  );
};

export const keepDefaultUsername = async (email: string) => {
  await remorsePool.query(
    `INSERT INTO players (email, name_chosen)
     VALUES ($1, true)
     ON CONFLICT (email) DO UPDATE SET name_chosen = true`,
    [email],
  );
};

const USERNAME = /^[A-Za-z0-9_-]{3,20}$/;

export const setUsername = async (email: string, username: string) => {
  if (!USERNAME.test(username)) {
    throw new HttpError(
      400,
      'Use 3 to 20 letters, numbers, dashes or underscores',
    );
  }
  try {
    await remorsePool.query(
      `INSERT INTO players (email, username, name_chosen)
       VALUES ($1, $2, true)
       ON CONFLICT (email) DO UPDATE
       SET username = EXCLUDED.username, name_chosen = true`,
      [email, username],
    );
  } catch (error) {
    // unique_violation on players_username
    if (error instanceof DatabaseError && error.code === '23505') {
      throw new HttpError(409, 'That username is taken');
    }
    throw error;
  }
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
  const inviteToken = mode === 'online' ? randomUUID() : null;
  await ensurePlayer(remorsePool, email);
  const { rows } = await remorsePool.query<{ id: number }>(
    `INSERT INTO games (mode, created_by, white_email, black_email, initial_state, state, invite_token)
     VALUES ($1, $2, $3, $4, $5, $5, $6)
     RETURNING id`,
    [mode, email, white, black, JSON.stringify(state), inviteToken],
  );
  return { id: rows[0].id, color, inviteToken };
};

// Seats the player in the oldest random game waiting on someone else, or
// opens one for them (reusing theirs if it's still waiting). The advisory
// lock runs one search at a time so two players asking at once meet instead
// of each opening a game. matched: they took a seat in someone's game.
export const findMatch = async (email: string) =>
  withTransaction(async (client) => {
    await client.query(
      `SELECT pg_advisory_xact_lock(hashtext('remorse-matchmaking'))`,
    );
    await ensurePlayer(client, email);
    const waiting = await client.query<{
      id: number;
      created_by: string;
      white_email: string | null;
    }>(
      `SELECT id, created_by, white_email
       FROM games
       WHERE matchmaking AND (white_email IS NULL OR black_email IS NULL)
       ORDER BY created_by = $1 DESC, created_at
       LIMIT 1`,
      [email],
    );
    const game = waiting.rows[0];
    if (game?.created_by === email) {
      const color: Color = game.white_email ? 'w' : 'b';
      return { id: game.id, color, matched: false };
    }
    if (game) {
      await client.query(
        `UPDATE games
         SET white_email = COALESCE(white_email, $2),
             black_email = COALESCE(black_email, $2),
             version = version + 1
         WHERE id = $1`,
        [game.id, email],
      );
      const color: Color = game.white_email ? 'b' : 'w';
      return { id: game.id, color, matched: true };
    }
    const color: Color = randomInt(2) ? 'b' : 'w';
    const { rows } = await client.query<{ id: number }>(
      `INSERT INTO games (mode, created_by, white_email, black_email, initial_state, state, matchmaking)
       VALUES ('online', $1, $2, $3, $4, $4, true)
       RETURNING id`,
      [
        email,
        color === 'w' ? email : null,
        color === 'b' ? email : null,
        JSON.stringify(initialState()),
      ],
    );
    return { id: rows[0].id, color, matched: false };
  });

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
    `SELECT id, mode, created_by, white_email, black_email, initial_state, state, version,
            invite_token, matchmaking, challenged_email
     FROM games
     WHERE id = $1
     FOR UPDATE`,
    [id],
  );
  if (!rows[0]) throw new HttpError(404, 'Game not found');
  return rows[0];
};

const lastStep = async (client: PoolClient | Pool, id: number) => {
  const { rows } = await client.query<{
    step: number;
    color: Color;
    resigned: boolean;
  }>(
    `SELECT step, color, action->>'type' = 'resign' AS resigned
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
  const { rows } = await remorsePool.query<
    GameRow & NameColumns & ChallengeColumns
  >(
    `SELECT g.id, g.mode, g.created_by, g.white_email, g.black_email, g.initial_state, g.state, g.version,
            g.invite_token, g.matchmaking,
            COALESCE(pw.username, split_part(g.white_email, '@', 1)) AS white_name,
            COALESCE(pb.username, split_part(g.black_email, '@', 1)) AS black_name,
            pw.icon AS white_icon, pb.icon AS black_icon,
            pw.id AS white_id, pb.id AS black_id,
            g.challenged_email, pc.id AS challenged_id, pc.icon AS challenged_icon,
            COALESCE(pc.username, split_part(g.challenged_email, '@', 1)) AS challenged_name
     FROM games g
     LEFT JOIN players pw ON pw.email = g.white_email
     LEFT JOIN players pb ON pb.email = g.black_email
     LEFT JOIN players pc ON pc.email = g.challenged_email
     WHERE g.id = $1`,
    [id],
  );
  const game = rows[0];
  if (!game) throw new HttpError(404, 'Game not found');
  const steps = await remorsePool.query<StepRow>(
    `SELECT step, color, events, created_at, action->>'type' = 'resign' AS resigned
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
  const you = seatsOf(game, email);
  return {
    id: game.id,
    mode: game.mode,
    whiteEmail: game.white_email,
    blackEmail: game.black_email,
    whiteId: game.white_id,
    blackId: game.black_id,
    whiteName: game.white_name,
    blackName: game.black_name,
    whiteIcon: game.white_icon,
    blackIcon: game.black_icon,
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
    you,
    canUndo: canUndoStep(game, email, last),
    rematchId: rematch.rows[0]?.id ?? null,
    // Only the player waiting for an opponent gets the invite link's secret
    inviteToken: you.length ? game.invite_token : null,
    matchmaking: game.matchmaking,
    challenge: challengeOf(game, email),
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

// Online, you resign your own seat on either turn; locally the side to move
// resigns
export const resignGame = async (id: number, email: string, version: number) =>
  withTransaction(async (client) => {
    const game = await lockGame(client, id);
    assertVersion(game, version);
    const seats = seatsOf(game, email);
    if (!seats.length) throw new HttpError(403, "You're not playing this game");
    if (game.state.winner) throw new HttpError(400, 'The game is already over');
    if (!game.white_email || !game.black_email) {
      throw new HttpError(400, 'Wait for your opponent to join');
    }
    const color = game.mode === 'local' ? game.state.turn : seats[0];
    const winner = opponent(color);
    const state: GameState = { ...game.state, winner, extraMovePieceId: null };
    const events: GameEvent[] = [
      { type: 'gameOver', winner, reason: 'resign' },
    ];
    const step = ((await lastStep(client, id))?.step ?? 0) + 1;
    await client.query(
      `INSERT INTO game_steps (game_id, step, color, email, action, events, state_after)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        id,
        step,
        color,
        email,
        JSON.stringify({ type: 'resign' }),
        JSON.stringify(events),
        JSON.stringify(state),
      ],
    );
    await client.query(
      `UPDATE games
       SET state = $2, version = version + 1
       WHERE id = $1`,
      [id, JSON.stringify(state)],
    );
  });

export const undoStep = async (id: number, email: string, version: number) =>
  withTransaction(async (client) => {
    const game = await lockGame(client, id);
    assertVersion(game, version);
    const last = await lastStep(client, id);
    if (!last) throw new HttpError(400, 'Nothing to undo');
    if (last.resigned)
      throw new HttpError(400, "A resignation can't be undone");
    if (!canUndoStep(game, email, last)) {
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

// Only while an online game waits for its opponent. The game is deleted, so
// its invite link stops working. The challenged player cancels to decline.
export const cancelGame = async (id: number, email: string) =>
  withTransaction(async (client) => {
    const game = await lockGame(client, id);
    if (!seatsOf(game, email).length && game.challenged_email !== email) {
      throw new HttpError(403, "You're not playing this game");
    }
    if (game.mode !== 'online' || (game.white_email && game.black_email)) {
      throw new HttpError(
        400,
        'Only a game still waiting for an opponent can be canceled',
      );
    }
    await client.query(
      `DELETE FROM games
       WHERE id = $1`,
      [id],
    );
  });

// Takes the open seat: the challenged player accepting, or anyone with the
// invite link's token. Random games fill only through findMatch.
export const joinGame = async (
  id: number,
  email: string,
  token: string | undefined,
) =>
  withTransaction(async (client) => {
    const game = await lockGame(client, id);
    if (game.mode !== 'online')
      throw new HttpError(400, 'This is a local game');
    if (seatsOf(game, email).length) return;
    if (game.white_email && game.black_email) {
      throw new HttpError(409, 'Both seats are taken');
    }
    if (game.challenged_email) {
      if (game.challenged_email !== email) {
        throw new HttpError(403, 'This challenge is for someone else');
      }
    } else if (
      game.matchmaking ||
      !game.invite_token ||
      game.invite_token !== token
    ) {
      throw new HttpError(403, 'This invite link isn’t valid');
    }
    await ensurePlayer(client, email);
    await client.query(
      `UPDATE games
       SET white_email = COALESCE(white_email, $2),
           black_email = COALESCE(black_email, $2),
           invite_token = NULL,
           challenged_email = NULL,
           version = version + 1
       WHERE id = $1`,
      [id, email],
    );
  });

const emailOfPlayer = async (client: PoolClient | Pool, id: number) => {
  const { rows } = await client.query<{ email: string }>(
    `SELECT email
     FROM players
     WHERE id = $1`,
    [id],
  );
  if (!rows[0]) throw new HttpError(404, 'Player not found');
  return rows[0].email;
};

// An online game with one seat held for `playerId`. A challenge still
// waiting between the same two players is reused; one they sent you is
// accepted.
export const createChallenge = async (email: string, playerId: number) =>
  withTransaction(async (client) => {
    const opponentEmail = await emailOfPlayer(client, playerId);
    if (opponentEmail === email) {
      throw new HttpError(400, 'You can’t challenge yourself');
    }
    await ensurePlayer(client, email);
    const theirs = await client.query<{
      id: number;
      white_email: string | null;
    }>(
      `UPDATE games
       SET white_email = COALESCE(white_email, $1),
           black_email = COALESCE(black_email, $1),
           challenged_email = NULL,
           version = version + 1
       WHERE id = (
         SELECT id
         FROM games
         WHERE created_by = $2 AND challenged_email = $1
         ORDER BY created_at
         LIMIT 1
         FOR UPDATE
       )
       RETURNING id, white_email`,
      [email, opponentEmail],
    );
    if (theirs.rows[0]) {
      const color: Color = theirs.rows[0].white_email === email ? 'w' : 'b';
      return {
        id: theirs.rows[0].id,
        color,
        opponentEmail,
        created: false,
        accepted: true,
      };
    }
    const pending = await client.query<{
      id: number;
      white_email: string | null;
    }>(
      `SELECT id, white_email
       FROM games
       WHERE created_by = $1 AND challenged_email = $2`,
      [email, opponentEmail],
    );
    if (pending.rows[0]) {
      const color: Color = pending.rows[0].white_email ? 'w' : 'b';
      return {
        id: pending.rows[0].id,
        color,
        opponentEmail,
        created: false,
        accepted: false,
      };
    }
    const color: Color = randomInt(2) ? 'b' : 'w';
    const { rows } = await client.query<{ id: number }>(
      `INSERT INTO games (mode, created_by, white_email, black_email, initial_state, state, challenged_email)
       VALUES ('online', $1, $2, $3, $4, $4, $5)
       RETURNING id`,
      [
        email,
        color === 'w' ? email : null,
        color === 'b' ? email : null,
        JSON.stringify(initialState()),
        opponentEmail,
      ],
    );
    return {
      id: rows[0].id,
      color,
      opponentEmail,
      created: true,
      accepted: false,
    };
  });

// A player's public page: who they are, their record and their online games
// against someone else, for anyone to watch
export const getPlayer = async (
  id: number,
  viewer: string,
): Promise<PlayerPage> => {
  const { rows } = await remorsePool.query<{
    email: string;
    name: string;
    icon: PlayerIcon | null;
    followers: number;
    following: boolean;
  }>(
    `SELECT p.email, COALESCE(p.username, split_part(p.email, '@', 1)) AS name, p.icon,
            (SELECT count(*)::int
             FROM follows
             WHERE followee_email = p.email) AS followers,
            EXISTS (
              SELECT 1
              FROM follows
              WHERE follower_email = $2 AND followee_email = p.email
            ) AS following
     FROM players p
     WHERE p.id = $1`,
    [id, viewer],
  );
  const player = rows[0];
  if (!player) throw new HttpError(404, 'Player not found');
  const games = await remorsePool.query<
    NameColumns & { id: number; state: GameState; updated_at: Date }
  >(
    `SELECT g.id, g.state, g.updated_at,
            COALESCE(pw.username, split_part(g.white_email, '@', 1)) AS white_name,
            COALESCE(pb.username, split_part(g.black_email, '@', 1)) AS black_name,
            pw.icon AS white_icon, pb.icon AS black_icon,
            pw.id AS white_id, pb.id AS black_id
     FROM games g
     LEFT JOIN players pw ON pw.email = g.white_email
     LEFT JOIN players pb ON pb.email = g.black_email
     WHERE g.mode = 'online'
       AND (g.white_email = $1 OR g.black_email = $1)
       AND g.white_email IS NOT NULL
       AND g.black_email IS NOT NULL
       AND g.white_email <> g.black_email
     ORDER BY g.updated_at DESC
     LIMIT 30`,
    [player.email],
  );
  return {
    id,
    name: player.name,
    icon: player.icon,
    you: player.email === viewer,
    followers: player.followers,
    following: player.following,
    stats: await playerStats(player.email),
    games: games.rows.map((row) => ({
      id: row.id,
      whiteId: row.white_id,
      blackId: row.black_id,
      whiteName: row.white_name,
      blackName: row.black_name,
      whiteIcon: row.white_icon,
      blackIcon: row.black_icon,
      turn: row.state.turn,
      winner: row.state.winner,
      pieces: row.state.pieces.map(({ color, type, square }) => ({
        color,
        type,
        square,
      })),
      updatedAt: row.updated_at.toISOString(),
    })),
  };
};

export const setFollowing = async (
  email: string,
  playerId: number,
  following: boolean,
) => {
  const followee = await emailOfPlayer(remorsePool, playerId);
  if (followee === email) throw new HttpError(400, 'You can’t follow yourself');
  if (following) {
    await remorsePool.query(
      `INSERT INTO follows (follower_email, followee_email)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [email, followee],
    );
  } else {
    await remorsePool.query(
      `DELETE FROM follows
       WHERE follower_email = $1 AND followee_email = $2`,
      [email, followee],
    );
  }
};

export const listFollowing = async (email: string): Promise<PlayerRef[]> => {
  const { rows } = await remorsePool.query<PlayerRef>(
    `SELECT p.id, COALESCE(p.username, split_part(p.email, '@', 1)) AS name, p.icon
     FROM follows f
     JOIN players p ON p.email = f.followee_email
     WHERE f.follower_email = $1
     ORDER BY lower(COALESCE(p.username, split_part(p.email, '@', 1)))`,
    [email],
  );
  return rows;
};

export const appStorePledges = async (email: string) => {
  const { rows } = await remorsePool.query<{ count: number; clicks: number }>(
    `SELECT count(*)::int AS count,
            coalesce(sum(clicks) FILTER (WHERE email = $1), 0)::int AS clicks
     FROM app_store_pledges`,
    [email],
  );
  return { count: rows[0]?.count ?? 0, clicks: rows[0]?.clicks ?? 0 };
};

export const addAppStoreClicks = async (email: string, clicks: number) => {
  await remorsePool.query(
    `INSERT INTO app_store_pledges (email, clicks)
     VALUES ($1, $2)
     ON CONFLICT (email) DO UPDATE
     SET clicks = app_store_pledges.clicks + EXCLUDED.clicks,
         last_clicked_at = now()`,
    [email, clicks],
  );
  return appStorePledges(email);
};
