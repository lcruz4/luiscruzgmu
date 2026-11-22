import type { IncomingHttpHeaders } from 'http';
import type { GetServerSideProps } from 'next';
import { REMORSE_LANDING_PATH, SIGN_IN_PATH } from '@/lib/auth';
import { logger } from './logger';

// lcruz_auth app names; a user needs a role for the app to get through
export type AuthApp =
  | 'workout-tracker'
  | 'giant-order-tool'
  | 'remorse-chess'
  | 'admin';

// The app whose login a page needs, by its path namespace
export const appForPath = (path: string): AuthApp => {
  if (path.startsWith('/projects/workout-tracker')) return 'workout-tracker';
  if (path.startsWith('/projects/giant-order-tool')) return 'giant-order-tool';
  if (path.startsWith('/projects/remorse-chess')) return 'remorse-chess';
  return 'admin';
};

export type AuthRequest = { headers: IncomingHttpHeaders };

const authorize = async (req: AuthRequest, app: AuthApp) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_AUTH_DOMAIN}/auth/authorize`,
      { headers: { cookie: req.headers.cookie || '', 'X-Auth-App': app } },
    );
    return response.headers;
  } catch (error) {
    logger.error('Auth check failed:', error);
    return null;
  }
};

// nginx runs the auth check on the paths it protects and forwards the email
// plus the app it checked; it strips both headers everywhere else. The email is
// trusted only when that app is the one this handler needs, since nginx matches
// on the decoded path but Next.js routes on the raw one. Otherwise (local dev,
// a path nginx doesn't check, or a different app) ask the auth service directly.
export const getAuthenticatedEmail = async (
  req: AuthRequest,
  app: AuthApp,
): Promise<string | null> => {
  const forwarded = req.headers['x-authenticated-email'];
  const checkedApp = req.headers['x-authenticated-app'];
  if (typeof forwarded === 'string' && forwarded && checkedApp === app) {
    return forwarded;
  }

  return (await authorize(req, app))?.get('x-authenticated-email') || null;
};

// The user's email and roles for the app; null when signed out. Always asks
// the auth service so a client-sent roles header is never trusted.
export const getAuthenticatedRoles = async (
  req: AuthRequest,
  app: AuthApp,
): Promise<{ email: string; roles: string[] } | null> => {
  const headers = await authorize(req, app);
  const email = headers?.get('x-authenticated-email');
  if (!headers || !email) return null;
  const roles = headers.get('x-authenticated-roles') ?? '';
  return { email, roles: roles.split(',').filter(Boolean) };
};

// Page login check. Signed out → the sign-in page, which comes back to this
// page after login.
export const requireLogin =
  (app: AuthApp): GetServerSideProps<{ email: string }> =>
  async ({ req, resolvedUrl }) => {
    const email = await getAuthenticatedEmail(req, app);
    if (email) return { props: { email } };

    return {
      redirect: {
        destination: `${
          app === 'remorse-chess' ? REMORSE_LANDING_PATH : SIGN_IN_PATH
        }?${new URLSearchParams({
          returnTo: resolvedUrl,
        })}`,
        permanent: false,
      },
    };
  };
