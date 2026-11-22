import { randomInt } from 'node:crypto';
import type { NextApiRequest } from 'next';
import { bodyOf, HttpError } from '@/services/api';
import { remorseRoute } from '@/services/remorseApi';
import { createGame, listGames } from '@/services/remorseDb';
import type { Color } from '@/types/remorse';

// Body: { mode: 'online' | 'local' }. Online, the creator's seat is random
// and returned as `color`.
const postGame = async (req: NextApiRequest, email: string) => {
  const body = bodyOf(req);
  if (body.mode !== 'online' && body.mode !== 'local') {
    throw new HttpError(400, "mode must be 'online' or 'local'");
  }
  const color: Color = randomInt(2) ? 'b' : 'w';
  return { id: await createGame(email, body.mode, color), color };
};

export default remorseRoute({
  GET: (_req, email) => listGames(email),
  POST: postGame,
});
