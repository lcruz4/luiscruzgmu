import { bodyOf, HttpError, idField, NO_CONTENT } from '@/services/api';
import { remorseRoute } from '@/services/remorseApi';
import { getPlayer, setFollowing } from '@/services/remorseDb';

// GET: the player's page. POST { type: 'follow' | 'unfollow' }
export default remorseRoute({
  GET: (req, email) => getPlayer(idField(req.query.id, 'id'), email),
  POST: async (req, email) => {
    const body = bodyOf(req);
    if (body.type !== 'follow' && body.type !== 'unfollow') {
      throw new HttpError(400, "type must be 'follow' or 'unfollow'");
    }
    await setFollowing(
      email,
      idField(req.query.id, 'id'),
      body.type === 'follow',
    );
    return NO_CONTENT;
  },
});
