import { LogIn } from 'lucide-react';
import type { GetServerSideProps } from 'next';
import { Raleway } from 'next/font/google';
import Head from 'next/head';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { GoogleIcon } from '@/components/GoogleIcon';
import { RequestPlan } from '@/components/workout-tracker/RequestPlan';
import { authLoginUrl, REMORSE_LANDING_PATH, safeReturnPath } from '@/lib/auth';
import { cn } from '@/lib/utils';
import { appForPath, getAuthenticatedEmail } from '@/services/auth';

const raleway = Raleway({ subsets: ['latin'], variable: '--font-raleway' });

const logIn = (returnTo: string | null) => {
  window.location.href = authLoginUrl(
    `${window.location.origin}${safeReturnPath(returnTo)}`,
    window.location.hostname,
  );
};

type Props = { workout: boolean };

const SignInPage = ({ workout }: Props) => {
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('returnTo');

  return (
    <div
      className={cn(
        raleway.variable,
        'flex min-h-dvh bg-mist-ground font-ui text-mist-text',
      )}
    >
      <Head>
        <title>Sign In | lcruz.dev</title>
        <meta name='theme-color' content='#e2eff1' />
        {/* _app's body is black; this colours the overscroll area instead */}
        <style>{'html { background: var(--color-mist-ground); }'}</style>
      </Head>
      <main className='mx-auto flex w-full sm:max-w-md flex-1 flex-col items-center justify-center gap-6 px-6 py-8 text-center'>
        <div className='flex size-[72px] items-center justify-center rounded-full border-2 border-dashed border-mist-dashed text-mist-muted'>
          <LogIn size={32} strokeWidth={2} aria-hidden />
        </div>
        <div className='flex flex-col gap-2'>
          <h1 className='m-0 text-[26px] leading-8 font-extrabold'>Sign In</h1>
          <p className='m-0 text-base leading-6 font-medium text-mist-muted'>
            {workout
              ? 'Sign in to log your workouts! 💪'
              : 'Sign in to continue.'}
          </p>
        </div>
        <button
          type='button'
          onClick={() => logIn(returnTo)}
          className='flex cursor-pointer items-center gap-3 self-stretch justify-center rounded-[14px] border border-mist-line bg-mist-surface px-4 py-3.5 text-[15px] font-bold shadow-mist-card'
        >
          <GoogleIcon />
          Log in with Google
        </button>
        {workout && <RequestPlan />}
        <Link href='/' className='text-sm font-bold text-mist-cyan-text'>
          Back to lcruz.dev
        </Link>
      </main>
    </div>
  );
};

// Already signed in to the app being returned to → skip straight there
export const getServerSideProps: GetServerSideProps<Props> = async ({
  req,
  query,
}) => {
  const returnTo = safeReturnPath(query.returnTo);
  const app = appForPath(returnTo);
  if (app === 'remorse-chess') {
    return {
      redirect: {
        destination: `${REMORSE_LANDING_PATH}?${new URLSearchParams({
          returnTo,
        })}`,
        permanent: false,
      },
    };
  }
  const email = await getAuthenticatedEmail(req, app);
  if (!email) return { props: { workout: app === 'workout-tracker' } };
  return { redirect: { destination: returnTo, permanent: false } };
};

export default SignInPage;
