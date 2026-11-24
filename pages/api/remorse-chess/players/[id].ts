import { bodyOf, HttpError, idField, NO_CONTENT } from '@/services/api';
import { logger } from '@/services/logger';
import { remorseRoute } from '@/services/remorseApi';
import { getPlayer, getProfile, setFollowing } from '@/services/remorseDb';
import { notifyFollow } from '@/services/remorsePush';

// GET: the player's page. POST { type: 'follow' | 'unfollow' }; a new
// follow sends them a push
export default remorseRoute({
  GET: (req, email) => getPlayer(idField(req.query.id, 'id'), email),
  POST: async (req, email) => {
    const id = idField(req.query.id, 'id');
    const body = bodyOf(req);
    if (body.type !== 'follow' && body.type !== 'unfollow') {
      throw new HttpError(400, "type must be 'follow' or 'unfollow'");
    }
    const { created, followee, mutual } = await setFollowing(
      email,
      id,
      body.type === 'follow',
    );
    if (created) {
      const me = await getProfile(email);
      notifyFollow(followee, { id: me.id, name: me.username }, mutual).catch(
        (error) => logger.error('Remorse notify failed:', error),
      );
    }
    return NO_CONTENT;
  },
});
