import { getAuthenticatedEmail } from './auth';
import { HttpError, route } from './api';

export const remorseRoute = route(async (req) => {
  const email = await getAuthenticatedEmail(req, 'remorse-chess');
  if (!email) throw new HttpError(401, 'Unauthorized');
  return email;
});
