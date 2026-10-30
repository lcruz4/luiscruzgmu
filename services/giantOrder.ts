import type { GetServerSideProps } from 'next';
import { getAuthenticatedEmail, requireLogin } from './auth';

// It places real orders on one Giant account, so only its owner gets in.
// Unset → nobody does.
export const isGiantOwner = (email: string | null) =>
  !!email && email === process.env.GIANT_ORDER_EMAIL;

export const giantOwnerEmail = async (cookie: string | undefined) => {
  const email = await getAuthenticatedEmail(cookie);
  return isGiantOwner(email) ? email : null;
};

// Signed out → sign-in; signed in as anyone else → 404
export const requireGiantOwner: GetServerSideProps<{
  email: string;
}> = async (context) => {
  const result = await requireLogin(context);
  if (!('props' in result)) return result;
  const props = await result.props;
  if (!isGiantOwner(props.email)) return { notFound: true };
  return { props };
};
