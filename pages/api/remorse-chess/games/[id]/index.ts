import type { NextApiRequest } from 'next';
import { bodyOf, HttpError, idField, intField } from '@/services/api';
import { remorseRoute } from '@/services/remorseApi';
import { getGame, joinGame, playAction, undoStep } from '@/services/remorseDb';

const squareField = (value: unknown, name: string) => {
  if (typeof value !== 'string' || !/^[a-h][1-8]$/.test(value)) {
    throw new HttpError(400, `${name} must be a square like e4`);
  }
  return value;
};

// Body: { type, version, ... }
//   move: { from, to } · selfHeal: { pieceId } · skipExtraMove · undo · join
const postAction = async (req: NextApiRequest, email: string) => {
  const id = idField(req.query.id, 'id');
  const body = bodyOf(req);
  const version = () => intField(body.version, 'version', 0, 2147483647);

  if (body.type === 'move') {
    await playAction(id, email, version(), {
      type: 'move',
      from: squareField(body.from, 'from'),
      to: squareField(body.to, 'to'),
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
  } else if (body.type === 'join') {
    await joinGame(id, email);
  } else {
    throw new HttpError(
      400,
      "type must be 'move', 'selfHeal', 'skipExtraMove', 'undo' or 'join'",
    );
  }
  return getGame(id, email);
};

export default remorseRoute({
  GET: (req, email) => getGame(idField(req.query.id, 'id'), email),
  POST: postAction,
});
