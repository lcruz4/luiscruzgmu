import { LogIn } from 'lucide-react';
import type { GetServerSideProps } from 'next';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { WorkoutLayout } from '@/components/workout-tracker/WorkoutLayout';
import { authLoginUrl, safeReturnPath } from '@/lib/auth';
import { getAuthenticatedEmail } from '@/services/auth';

const GoogleIcon = () => (
  <svg viewBox='0 0 48 48' className='size-5' aria-hidden>
    <path
      fill='#FFC107'
      d='M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z'
    />
    <path
      fill='#FF3D00'
      d='M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z'
    />
    <path
      fill='#4CAF50'
      d='M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z'
    />
    <path
      fill='#1976D2'
      d='M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z'
    />
  </svg>
);

const logIn = (returnTo: string | null) => {
  window.location.href = authLoginUrl(
    `${window.location.origin}${safeReturnPath(returnTo)}`,
    window.location.hostname,
  );
};

const SignInPage = () => {
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('returnTo');

  return (
    <WorkoutLayout tabBar={false}>
      <main className='flex flex-1 flex-col items-center justify-center gap-6 px-6 py-8 text-center'>
        <div className='flex size-[72px] items-center justify-center rounded-full border-2 border-dashed border-mist-dashed text-mist-muted'>
          <LogIn size={32} strokeWidth={2} aria-hidden />
        </div>
        <div className='flex flex-col gap-2'>
          <h1 className='m-0 text-[26px] leading-8 font-extrabold'>Sign In</h1>
          <p className='m-0 text-base leading-6 font-medium text-mist-muted'>
            Sign in to log your workouts! 💪
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
        <Link href='/' className='text-sm font-bold text-mist-cyan-text'>
          Back to lcruz.dev
        </Link>
      </main>
    </WorkoutLayout>
  );
};

// Already signed in → skip straight to where they were going
export const getServerSideProps: GetServerSideProps = async ({
  req,
  query,
}) => {
  const email = await getAuthenticatedEmail(req.headers.cookie);
  if (!email) return { props: {} };
  return {
    redirect: { destination: safeReturnPath(query.returnTo), permanent: false },
  };
};

export default SignInPage;
