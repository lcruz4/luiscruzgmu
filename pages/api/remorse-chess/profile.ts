import { isPlayerIcon } from '@/lib/remorse/icons';
import { isPieceSet } from '@/lib/remorse/pieceSets';
import { bodyOf, HttpError } from '@/services/api';
import { remorseRoute } from '@/services/remorseApi';
import {
  getProfile,
  keepDefaultUsername,
  setIcon,
  setPieceSet,
  setUsername,
} from '@/services/remorseDb';

// Body: any of { username, icon, pieceSet }; username null keeps the default name
export default remorseRoute({
  GET: (_req, email) => getProfile(email),
  PUT: async (req, email) => {
    const body = bodyOf(req);
    if (body.icon !== undefined) {
      if (!isPlayerIcon(body.icon)) throw new HttpError(400, 'Unknown icon');
      await setIcon(email, body.icon);
    }
    if (body.pieceSet !== undefined) {
      if (!isPieceSet(body.pieceSet)) {
        throw new HttpError(400, 'Unknown piece set');
      }
      await setPieceSet(email, body.pieceSet);
    }
    if (body.username === null) {
      await keepDefaultUsername(email);
    } else if (typeof body.username === 'string') {
      await setUsername(email, body.username.trim());
    } else if (body.username !== undefined) {
      throw new HttpError(400, 'username must be text or null');
    }
    return getProfile(email);
  },
});
