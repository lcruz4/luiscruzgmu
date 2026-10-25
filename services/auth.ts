import type { GetServerSideProps } from 'next';
import { SIGN_IN_PATH } from '@/lib/auth';
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

// Page login check. Signed out → the sign-in page, which comes back to this
// page after login.
export const requireLogin: GetServerSideProps<{ email: string }> = async ({
  req,
  resolvedUrl,
}) => {
  const email = await getAuthenticatedEmail(req.headers.cookie);
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
