import { randomInt } from 'node:crypto';
import type { NextApiRequest } from 'next';
import { bodyOf, HttpError, idField } from '@/services/api';
import { logger } from '@/services/logger';
import { remorseRoute } from '@/services/remorseApi';
import {
  createGame,
  createRematch,
  findMatch,
  getGame,
  listGames,
} from '@/services/remorseDb';
import { publishGameChange } from '@/services/remorseLive';
import { notifyOpponent } from '@/services/remorsePush';
import type { Color } from '@/types/remorse';

// Seats the player against the next one looking, or leaves them waiting.
// A match tells the waiting player right away.
const playRandom = async (email: string) => {
  const { id, color, matched } = await findMatch(email);
  if (matched) {
    const game = await getGame(id, email);
    publishGameChange(id, game.version);
    notifyOpponent(game, email, 'join').catch((error) =>
      logger.error('Remorse notify failed:', error),
    );
  }
  return { id, color };
};

// Body: { mode: 'online' | 'local' | 'random' } or { rematchOf: <finished game id> }.
// Online, the creator's seat is random (swapped for a rematch) and returned
// as `color`, with the invite link's `inviteToken`.
const postGame = async (req: NextApiRequest, email: string) => {
  const body = bodyOf(req);
  if (body.rematchOf !== undefined) {
    return createRematch(idField(body.rematchOf, 'rematchOf'), email);
  }
  if (body.mode === 'random') return playRandom(email);
  if (body.mode !== 'online' && body.mode !== 'local') {
    throw new HttpError(400, "mode must be 'online', 'local' or 'random'");
  }
  const color: Color = randomInt(2) ? 'b' : 'w';
  return createGame(email, body.mode, color);
};

export default remorseRoute({
  GET: (_req, email) => listGames(email),
  POST: postGame,
});
