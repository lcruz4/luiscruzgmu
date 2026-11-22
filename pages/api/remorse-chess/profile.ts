import { bodyOf, HttpError } from '@/services/api';
import { remorseRoute } from '@/services/remorseApi';
import {
  getProfile,
  keepDefaultUsername,
  setUsername,
} from '@/services/remorseDb';

// Body: { username }, or { username: null } to keep the default name
export default remorseRoute({
  GET: (_req, email) => getProfile(email),
  PUT: async (req, email) => {
    const { username } = bodyOf(req);
    if (username === null) return keepDefaultUsername(email);
    if (typeof username !== 'string') {
      throw new HttpError(400, 'username must be text or null');
    }
    return setUsername(email, username.trim());
  },
});
