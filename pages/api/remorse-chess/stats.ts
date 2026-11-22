import { remorseRoute } from '@/services/remorseApi';
import { playerStats } from '@/services/remorseDb';

export default remorseRoute({
  GET: (_req, email) => playerStats(email),
});
