import type { NextApiRequest } from 'next';
import {
  bodyOf,
  HttpError,
  idField,
  intField,
  NO_CONTENT,
} from '@/services/api';
import { remorseRoute } from '@/services/remorseApi';
import {
  cancelGame,
  gameVersion,
  getGame,
  joinGame,
  playAction,
  resignGame,
  setArchived,
  undoStep,
} from '@/services/remorseDb';
import { logger } from '@/services/logger';
import { notifyOpponent } from '@/services/remorsePush';

const squareField = (value: unknown, name: string) => {
  if (typeof value !== 'string' || !/^[a-h][1-8]$/.test(value)) {
    throw new HttpError(400, `${name} must be a square like e4`);
  }
  return value;
};

const promotionField = (value: unknown) => {
  if (value === undefined || value === null) return undefined;
  if (value === 'q' || value === 'r' || value === 'b' || value === 'n')
    return value;
  throw new HttpError(400, "promotion must be 'q', 'r', 'b' or 'n'");
};

// Body: { type, version, ... }
//   move: { from, to, promotion? } · selfHeal: { pieceId } · skipExtraMove · undo · resign · join
//   archive / unarchive: hide the game from your lobby or bring it back
const postAction = async (req: NextApiRequest, email: string) => {
  const id = idField(req.query.id, 'id');
  const body = bodyOf(req);
  const version = () => intField(body.version, 'version', 0, 2147483647);

  if (body.type === 'move') {
    await playAction(id, email, version(), {
      type: 'move',
      from: squareField(body.from, 'from'),
      to: squareField(body.to, 'to'),
      promotion: promotionField(body.promotion),
    });
  } else if (body.type === 'selfHeal') {
    if (typeof body.pieceId !== 'string') {
      throw new HttpError(400, 'pieceId must be text');
    }
    await playAction(id, email, version(), {
      type: 'selfHeal',
      pieceId: body.pieceId,
    });
  } else if (body.type === 'skipExtraMove') {
    await playAction(id, email, version(), { type: 'skipExtraMove' });
  } else if (body.type === 'undo') {
    await undoStep(id, email, version());
  } else if (body.type === 'resign') {
    await resignGame(id, email, version());
  } else if (body.type === 'join') {
    await joinGame(id, email);
  } else if (body.type === 'archive' || body.type === 'unarchive') {
    await setArchived(id, email, body.type === 'archive');
    return getGame(id, email);
  } else {
    throw new HttpError(
      400,
      "type must be 'move', 'selfHeal', 'skipExtraMove', 'undo', 'resign', 'join', 'archive' or 'unarchive'",
    );
  }
  const game = await getGame(id, email);
  // Not awaited: the mover shouldn't wait on push services
  notifyOpponent(
    game,
    email,
    body.type === 'undo' || body.type === 'join' ? body.type : 'other',
  ).catch((error) => logger.error('Remorse notify failed:', error));
  return game;
};

// ?since=<version the client has>: 204 while that's still current, so a poll
// that finds nothing new skips loading and sending the whole game
const getAction = async (req: NextApiRequest, email: string) => {
  const id = idField(req.query.id, 'id');
  if (req.query.since !== undefined) {
    const since = intField(req.query.since, 'since', 0, 2147483647);
    if ((await gameVersion(id)) === since) return NO_CONTENT;
  }
  return getGame(id, email);
};

// Cancels an online game nobody has joined yet
const deleteGame = async (req: NextApiRequest, email: string) => {
  await cancelGame(idField(req.query.id, 'id'), email);
  return NO_CONTENT;
};

export default remorseRoute({
  GET: getAction,
  POST: postAction,
  DELETE: deleteGame,
});
