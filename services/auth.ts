import type { IncomingHttpHeaders } from 'http';
import type { GetServerSideProps } from 'next';
import { SIGN_IN_PATH } from '@/lib/auth';
import { logger } from './logger';

// lcruz_auth app names; a user needs a role for the app to get through
export type AuthApp = 'workout-tracker' | 'giant-order-tool' | 'lcruz-dev';

export type AuthRequest = { headers: IncomingHttpHeaders };

// nginx runs the auth check on the paths it protects and forwards the email;
// it strips the header everywhere else. Without it (local dev, or a path nginx
// doesn't check) ask the auth service directly.
export const getAuthenticatedEmail = async (
  req: AuthRequest,
  app: AuthApp,
): Promise<string | null> => {
  const forwarded = req.headers['x-authenticated-email'];
  if (typeof forwarded === 'string' && forwarded) return forwarded;

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_AUTH_DOMAIN}/auth/authorize`,
      { headers: { cookie: req.headers.cookie || '', 'X-Auth-App': app } },
    );
    return response.headers.get('x-authenticated-email') || null;
  } catch (error) {
    logger.error('Auth check failed:', error);
    return null;
  }
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
        destination: `${SIGN_IN_PATH}?${new URLSearchParams({
          returnTo: resolvedUrl,
        })}`,
        permanent: false,
      },
    };
  };
