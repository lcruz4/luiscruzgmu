import type { NextApiRequest } from 'next';
import { bodyOf, HttpError } from '@/services/api';
import { remorseRoute } from '@/services/remorseApi';
import { createGame, listGames } from '@/services/remorseDb';

// Body: { mode: 'online' | 'local', color: 'w' | 'b' } (color = your seat online)
const postGame = async (req: NextApiRequest, email: string) => {
  const body = bodyOf(req);
  if (body.mode !== 'online' && body.mode !== 'local') {
    throw new HttpError(400, "mode must be 'online' or 'local'");
  }
  if (body.color !== 'w' && body.color !== 'b') {
    throw new HttpError(400, "color must be 'w' or 'b'");
  }
  return { id: await createGame(email, body.mode, body.color) };
};

export default remorseRoute({
  GET: (_req, email) => listGames(email),
  POST: postGame,
});
