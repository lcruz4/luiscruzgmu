import { remorseRoute } from '@/services/remorseApi';
import { listFollowing } from '@/services/remorseDb';

// The players you follow
export default remorseRoute({
  GET: (_req, email) => listFollowing(email),
});
