import type { GetServerSideProps } from 'next';
import { authLoginUrl } from '@/lib/auth';
import { getAuthenticatedEmail } from './auth';

// Signed out → straight to the auth service's login, which sets the session
// cookie on `domain` and comes back here.
export const requireGiantLogin: GetServerSideProps<{ email: string }> = async ({
  req,
  resolvedUrl,
}) => {
  const email = await getAuthenticatedEmail(req, 'giant-order-tool');
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
