import { bodyOf, HttpError } from '@/services/api';
import { remorseRoute } from '@/services/remorseApi';
import { getUsername, setUsername } from '@/services/remorseDb';

// Body: { username }
export default remorseRoute({
  GET: async (_req, email) => ({ username: await getUsername(email) }),
  PUT: async (req, email) => {
    const { username } = bodyOf(req);
    if (typeof username !== 'string') {
      throw new HttpError(400, 'username must be text');
    }
    return { username: await setUsername(email, username.trim()) };
  },
});
