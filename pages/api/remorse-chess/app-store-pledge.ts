import { remorseRoute } from '@/services/remorseApi';
import { setAppStorePledge } from '@/services/remorseDb';

// POST adds the player to the App Store interest list, DELETE takes them off;
// both answer with the new { count, pledged }
export default remorseRoute({
  POST: (_req, email) => setAppStorePledge(email, true),
  DELETE: (_req, email) => setAppStorePledge(email, false),
});
