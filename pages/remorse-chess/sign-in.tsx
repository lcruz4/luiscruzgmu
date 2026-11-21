import type { GetServerSideProps } from 'next';
import Head from 'next/head';
import { useSearchParams } from 'next/navigation';
import { GoogleIcon } from '@/components/GoogleIcon';
import { Marker } from '@/components/remorse-chess/Marker';
import { RemorseLayout } from '@/components/remorse-chess/RemorseLayout';
import { authLoginUrl, safeRemorsePath } from '@/lib/auth';
import { cn } from '@/lib/utils';
import { getAuthenticatedEmail } from '@/services/auth';
import type { Trauma } from '@/types/remorse';

const FATES: { trauma: Trauma; name: string; effect: string }[] = [
  { trauma: 'guilt', name: 'Guilt', effect: "won't capture" },
  { trauma: 'devastated', name: 'Devastated', effect: '3 turns to live' },
  { trauma: 'psychopath', name: 'Psychopath', effect: 'wants more' },
  { trauma: 'unaffected', name: 'Unaffected', effect: 'shrugs it off' },
];

// lcruz_auth makes the account on a first Google login, so sign up and sign
// in are the same request
const logIn = (returnTo: string | null) => {
  window.location.href = authLoginUrl(
    `${window.location.origin}${safeRemorsePath(returnTo)}`,
    window.location.hostname,
  );
};

const button =
  'flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-[10px] border-2 px-3.5 py-3 text-[15px] font-semibold';
const primary = cn(
  button,
  'border-[#120d0b] bg-linear-to-b from-[#ffd27a] to-[#c98a1c] text-[#1a1209] shadow-[inset_0_1px_0_rgba(255,255,255,.5),0_2px_0_#120d0b] hover:brightness-105',
);
const ghost = cn(
  button,
  'border-[#514d47] bg-[#302d29] text-[#e8e4dc] hover:bg-[#3a3733]',
);

const GoogleDisc = () => (
  <span className='grid size-[22px] flex-none place-items-center rounded-full bg-white'>
    <GoogleIcon className='size-[15px]' />
  </span>
);

const SignInPage = () => {
  const returnTo = useSearchParams().get('returnTo');

  return (
    <RemorseLayout>
      <Head>
        <title>Sign up | Remorse Chess</title>
      </Head>
      <div className='mx-auto flex max-w-sm flex-col gap-4 pt-2 md:max-w-4xl md:flex-row md:items-center md:gap-10 md:pt-16'>
        <div className='flex min-w-0 flex-col gap-4 md:flex-1'>
          <span className='self-center rounded-full border border-[#c98a1c]/45 bg-[#c98a1c]/15 px-2.5 py-0.5 text-xs font-semibold text-[#ffd27a] md:self-start'>
            ✦ Open to everyone
          </span>
          <h1 className='text-center text-[23px] leading-tight font-bold text-white md:text-left md:text-4xl'>
            Chess where pieces feel it
          </h1>
          <div className='flex flex-col gap-3 rounded-[14px] bg-[#262421] p-3.5 md:bg-transparent md:p-0'>
            <div className='grid grid-cols-4 gap-1.5'>
              {FATES.map(({ trauma, name, effect }) => (
                <figure
                  key={trauma}
                  className='flex flex-col items-center gap-1 text-center text-[10.5px] leading-tight text-[#a29e96] md:text-xs'
                >
                  <Marker
                    trauma={trauma}
                    healed={false}
                    turnsLeft={3}
                    kills={1}
                    className='block h-[55px] w-[52px] md:h-[76px] md:w-[72px]'
                  />
                  <figcaption>
                    {name}
                    <span className='hidden md:block'>{effect}</span>
                  </figcaption>
                </figure>
              ))}
            </div>
            <p className='text-xs text-[#a29e96] md:text-sm'>
              Capture a piece and a die decides how it copes.
            </p>
          </div>
        </div>
        <div className='flex flex-col gap-3 md:w-[300px] md:flex-none md:rounded-[14px] md:bg-[#262421] md:p-5'>
          <div className='hidden md:block'>
            <h2 className='text-base font-bold text-white'>
              Make your account
            </h2>
            <p className='text-xs text-[#a29e96]'>
              Free. Takes one tap with Google.
            </p>
          </div>
          <button
            type='button'
            className={primary}
            onClick={() => logIn(returnTo)}
          >
            <GoogleDisc />
            Create free account
          </button>
          <button
            type='button'
            className={ghost}
            onClick={() => logIn(returnTo)}
          >
            <GoogleDisc />I already have an account
          </button>
          <p className='text-center text-xs text-[#a29e96]'>
            Both use Google. No password.
          </p>
        </div>
      </div>
    </RemorseLayout>
  );
};

// Already signed in → straight back into the game
export const getServerSideProps: GetServerSideProps = async ({
  req,
  query,
}) => {
  const email = await getAuthenticatedEmail(req, 'remorse-chess');
  if (!email) return { props: {} };
  return {
    redirect: {
      destination: safeRemorsePath(query.returnTo),
      permanent: false,
    },
  };
};

export default SignInPage;
