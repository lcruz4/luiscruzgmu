import type { GetServerSideProps } from 'next';
import { authLoginUrl } from '@/lib/auth';
import { getAuthenticatedEmail } from './auth';

// It places real orders on one Giant account, so only its owner gets in.
// Unset → nobody does.
export const isGiantOwner = (email: string | null) =>
  !!email && email === process.env.GIANT_ORDER_EMAIL;

export const giantOwnerEmail = async (cookie: string | undefined) => {
  const email = await getAuthenticatedEmail(cookie);
  return isGiantOwner(email) ? email : null;
};

// Signed out → straight to the auth service's login, which sets the session
// cookie on `domain` and comes back here. Signed in as anyone else → 404.
export const requireGiantOwner: GetServerSideProps<{ email: string }> = async ({
  req,
  resolvedUrl,
}) => {
  const email = await getAuthenticatedEmail(req.headers.cookie);
  if (!email) {
    const host = req.headers.host ?? '';
    const domain = host.split(':')[0];
    const protocol = domain === 'localhost' ? 'http' : 'https';
    return {
      redirect: {
        destination: authLoginUrl(
          `${protocol}://${host}${resolvedUrl}`,
          domain,
        ),
        permanent: false,
      },
    };
  }
  if (!isGiantOwner(email)) return { notFound: true };
  return { props: { email } };
};
