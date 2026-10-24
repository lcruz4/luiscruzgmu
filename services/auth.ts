import type { GetServerSideProps } from 'next';
import { authLoginUrl } from '@/lib/auth';
import { logger } from './logger';

export const getAuthenticatedEmail = async (
  cookie: string | undefined,
): Promise<string | null> => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_AUTH_DOMAIN}/auth/authorize`,
      { headers: { cookie: cookie || '' } },
    );
    return response.headers.get('x-authenticated-email') || null;
  } catch (error) {
    logger.error('Auth check failed:', error);
    return null;
  }
};

// Page login check. Signed out → the auth service's login, which sets the
// session cookie on `domain` and sends the browser back to `redirectTo` (D22).
export const requireLogin: GetServerSideProps<{ email: string }> = async ({
  req,
  resolvedUrl,
}) => {
  const email = await getAuthenticatedEmail(req.headers.cookie);
  if (email) return { props: { email } };

  const host = req.headers.host ?? '';
  const domain = host.split(':')[0];
  const protocol = domain === 'localhost' ? 'http' : 'https';
  return {
    redirect: {
      destination: authLoginUrl(`${protocol}://${host}${resolvedUrl}`, domain),
      permanent: false,
    },
  };
};
