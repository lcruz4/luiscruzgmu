import { remorseRoute } from '@/services/remorseApi';
import { listMutuals } from '@/services/remorseDb';

// The players you can challenge: you follow each other
export default remorseRoute({
  GET: (_req, email) => listMutuals(email),
});
