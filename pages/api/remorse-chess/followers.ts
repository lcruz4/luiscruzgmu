import { bodyOf, idField, NO_CONTENT } from '@/services/api';
import { remorseRoute } from '@/services/remorseApi';
import { listNewFollowers, markFollowSeen } from '@/services/remorseDb';

// GET: who followed you since you last looked. POST { playerId }: dismiss one
export default remorseRoute({
  GET: (_req, email) => listNewFollowers(email),
  POST: async (req, email) => {
    await markFollowSeen(email, idField(bodyOf(req).playerId, 'playerId'));
    return NO_CONTENT;
  },
});
