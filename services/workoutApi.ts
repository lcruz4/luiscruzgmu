import { getAuthenticatedEmail, getAuthenticatedRoles } from './auth';
import { HttpError, route } from './api';

export const workoutRoute = route(async (req) => {
  const email = await getAuthenticatedEmail(req, 'workout-tracker');
  if (!email) throw new HttpError(401, 'Unauthorized');
  return email;
});

// Needs the admin role for workout-tracker
export const workoutAdminRoute = route(async (req) => {
  const auth = await getAuthenticatedRoles(req, 'workout-tracker');
  if (!auth) throw new HttpError(401, 'Unauthorized');
  if (!auth.roles.includes('admin')) throw new HttpError(403, 'Forbidden');
  return auth.email;
});
