import { bodyOf, HttpError, idField, NO_CONTENT } from '@/services/api';
import { logger } from '@/services/logger';
import { remorseRoute } from '@/services/remorseApi';
import {
  answerBalanceSuggestion,
  getPlayer,
  getProfile,
  setFollowing,
} from '@/services/remorseDb';
import { notifyFollow } from '@/services/remorsePush';

// GET: the player's page. POST { type: 'follow' | 'unfollow' }; a new
// follow sends them a push. POST { type: 'balanceSuggestion', accepted }:
// answers the suggestion to play them balanced, so it isn't shown again.
export default remorseRoute({
  GET: (req, email) => getPlayer(idField(req.query.id, 'id'), email),
  POST: async (req, email) => {
    const id = idField(req.query.id, 'id');
    const body = bodyOf(req);
    if (body.type === 'balanceSuggestion') {
      if (typeof body.accepted !== 'boolean') {
        throw new HttpError(400, 'accepted must be true or false');
      }
      await answerBalanceSuggestion(email, id, body.accepted);
      return NO_CONTENT;
    }
    if (body.type !== 'follow' && body.type !== 'unfollow') {
      throw new HttpError(
        400,
        "type must be 'follow', 'unfollow' or 'balanceSuggestion'",
      );
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
