import type { GetServerSideProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { type ReactNode, useId } from 'react';
import { GoogleIcon } from '@/components/GoogleIcon';
import {
  healSvg,
  SCENE_MARKER,
  sceneSvg,
} from '@/components/remorse-chess/landingArt';
import { Marker } from '@/components/remorse-chess/Marker';
import type { MarkerProps } from '@/components/remorse-chess/markerSvg';
import { RemorseLayout } from '@/components/remorse-chess/RemorseLayout';
import { authLoginUrl, REMORSE_HOME, safeRemorsePath } from '@/lib/auth';
import { cn } from '@/lib/utils';
import { getAuthenticatedEmail } from '@/services/auth';

const TIKTOK = 'https://www.tiktok.com/@bardelo_bardalini';

type Props = { signedIn: boolean; returnTo: string };

// lcruz_auth makes the account on a first Google login, so sign up and sign
// in are the same request
const logIn = (returnTo: string) => {
  window.location.href = authLoginUrl(
    `${window.location.origin}${returnTo}`,
    window.location.hostname,
  );
};

const btn =
  'inline-flex cursor-pointer items-center justify-center gap-2.5 rounded-[10px] border-2 font-semibold';
const primary = cn(
  btn,
  'border-[#120d0b] bg-linear-to-b from-[#ffd27a] to-[#c98a1c] text-[#1a1209] shadow-[inset_0_1px_0_rgba(255,255,255,.5),0_2px_0_#120d0b] hover:brightness-105',
);
const ghost = cn(
  btn,
  'border-[#514d47] bg-[#302d29] text-[#e8e4dc] hover:bg-[#3a3733]',
);
const big = 'px-4 py-2.5 text-[15px]';

const GoogleDisc = () => (
  <span className='grid size-[22px] flex-none place-items-center rounded-full bg-white'>
    <GoogleIcon className='size-[15px]' />
  </span>
);

// Signed out: one Google button that makes the account or signs in.
// Signed in: straight to the lobby.
const MainAction = ({
  signedIn,
  returnTo,
  className,
}: Props & { className: string }) =>
  signedIn ? (
    <Link href={REMORSE_HOME} className={cn(primary, className)}>
      Go to your games
    </Link>
  ) : (
    <button
      type='button'
      className={cn(primary, className)}
      onClick={() => logIn(returnTo)}
    >
      <GoogleDisc />
      Create free account
    </button>
  );

// Art strings come from landingArt's own constants, never user input
const Svg = ({ html, className }: { html: string; className?: string }) => (
  <span className={className} dangerouslySetInnerHTML={{ __html: html }} />
);

const STEPS = [
  ['Make a free account', 'One tap with Google. No password.'],
  [
    'Start a game, send the link',
    'Pick a color. Your friend opens the link and joins. Or play both sides on one device.',
  ],
  [
    'Live with what you capture',
    'Normal chess until the first capture. Then the die decides.',
  ],
];

const FATES: {
  marker: MarkerProps;
  roll: number[];
  name: string;
  text: string;
}[] = [
  {
    marker: { trauma: 'devastated', healed: false, turnsLeft: 3, kills: 0 },
    roll: [1],
    name: 'Devastated',
    text: "Heartbroken. Can't capture, give check or guard a square. It dies of grief after 3 of its own turns unless a bishop heals it.",
  },
  {
    marker: { trauma: 'guilt', healed: false, turnsLeft: 0, kills: 0 },
    roll: [2, 3],
    name: 'Guilt-ridden',
    text: "Still moves, but won't hurt anyone again. Can't capture, give check or guard a square until it's healed.",
  },
  {
    marker: { trauma: 'unaffected', healed: false, turnsLeft: 0, kills: 0 },
    roll: [4, 5],
    name: 'Unaffected',
    text: 'Feels nothing. Plays like a normal piece for the rest of the game.',
  },
  {
    marker: { trauma: 'psychopath', healed: false, turnsLeft: 0, kills: 0 },
    roll: [6],
    name: 'Psychopath',
    text: 'Every capture it makes earns an optional extra move with that piece. At 3 captures it falls into bloodlust.',
  },
];

const Callout = ({
  art,
  title,
  items,
}: {
  art: ReactNode;
  title: string;
  items: string[];
}) => (
  <div className='flex items-start gap-3.5 rounded-xl bg-[#262421] p-4'>
    {art}
    <div className='min-w-0'>
      <h3 className='mb-1 font-semibold text-white'>{title}</h3>
      <ul className='flex list-disc flex-col gap-1 pl-[18px] text-[13.5px] text-[#a29e96]'>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  </div>
);

const TikTokIcon = () => (
  <svg viewBox='0 0 48 48' className='size-[30px]' aria-hidden>
    {[
      ['#25F4EE', 'translate(-1.4 -1.2)'],
      ['#FE2C55', 'translate(1.4 1.2)'],
      ['#fff', undefined],
    ].map(([fill, transform]) => (
      <path
        key={fill}
        fill={fill}
        transform={transform}
        d='M33.5 5h-6.3v25.6a5.4 5.4 0 1 1-5.4-5.4c.5 0 1 .1 1.5.2v-6.4a11.7 11.7 0 1 0 10.2 11.6V17.6a14.6 14.6 0 0 0 8.5 2.7v-6.3A8.5 8.5 0 0 1 33.5 5z'
      />
    ))}
  </svg>
);

const section = 'border-t border-[#3a3733] py-9';
const h2 = 'mb-1.5 text-2xl font-bold text-balance text-white';
const kicker = 'mb-5 max-w-[62ch] text-[#a29e96]';

const LandingPage = (props: Props) => {
  const id = `l${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const { signedIn, returnTo } = props;

  return (
    <RemorseLayout
      actions={
        <nav className='flex items-center gap-4 text-sm'>
          <a href='#rules' className='hidden text-[#a29e96] sm:inline'>
            Rules
          </a>
          <a href='#how' className='hidden text-[#a29e96] sm:inline'>
            How to play
          </a>
          {signedIn ? (
            <Link
              href={REMORSE_HOME}
              className={cn(primary, 'px-3 py-1.5 text-[13px]')}
            >
              Your games
            </Link>
          ) : (
            <button
              type='button'
              className={cn(primary, 'px-3 py-1.5 text-[13px]')}
              onClick={() => logIn(returnTo)}
            >
              Sign in
            </button>
          )}
        </nav>
      }
    >
      <Head>
        <title>Remorse Chess</title>
        <meta
          name='description'
          content='Chess where every capture leaves a mark. Free to play online.'
        />
      </Head>
      <div className='mx-auto max-w-[1040px] text-[15px] leading-relaxed'>
        <div className='grid items-center gap-8 pt-3 pb-10 md:grid-cols-[1.05fr_1fr] md:pt-7'>
          <div className='relative mx-auto aspect-[9/8] w-full max-w-[360px] overflow-hidden rounded-2xl border border-[#3a3733] md:order-last md:max-w-none'>
            <Svg html={sceneSvg(id)} className='block size-full' />
            <span className='absolute block' style={SCENE_MARKER}>
              <Marker
                trauma='guilt'
                healed={false}
                turnsLeft={0}
                kills={0}
                className='block aspect-[64/68]'
              />
            </span>
          </div>
          <div className='min-w-0'>
            <span className='inline-flex rounded-full border border-[#c98a1c]/45 bg-[#c98a1c]/15 px-2.5 py-0.5 text-xs font-semibold text-[#ffd27a]'>
              ✦ Free to play, open to everyone
            </span>
            <h1 className='mt-3.5 mb-3 text-[clamp(32px,5vw,48px)] leading-[1.08] font-bold tracking-tight text-balance text-white'>
              Chess where every capture leaves a mark
            </h1>
            <p className='mb-5 max-w-[46ch] text-[17px] text-[#a29e96]'>
              The first time a piece takes another, it rolls a die. Some pieces
              are crushed by guilt. Some shrug. Some start to enjoy it.
            </p>
            <div className='flex flex-wrap gap-2.5'>
              <MainAction {...props} className={big} />
              <a href='#rules' className={cn(ghost, big)}>
                Read the rules
              </a>
            </div>
            <p className='mt-4 text-[13px] text-[#a29e96]'>
              A chess variant by Bardelo Bardalini.{' '}
              <a
                href={TIKTOK}
                target='_blank'
                rel='noreferrer'
                className='font-semibold text-[#ffd27a]'
              >
                Watch on TikTok →
              </a>
            </p>
          </div>
        </div>

        <section id='how' className={section}>
          <h2 className={h2}>How to play</h2>
          <p className={kicker}>
            Online with a friend, or both players on one device.
          </p>
          <ol className='grid gap-3.5 md:grid-cols-3'>
            {STEPS.map(([title, text], i) => (
              <li
                key={title}
                className='flex items-start gap-3 rounded-xl bg-[#262421] p-4'
              >
                <b className='grid size-7 flex-none place-items-center rounded-full border border-[#514d47] bg-[#302d29] text-[13px] text-[#ffd27a]'>
                  {i + 1}
                </b>
                <div>
                  <strong className='block text-white'>{title}</strong>
                  <span className='text-[13.5px] text-[#a29e96]'>{text}</span>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section id='rules' className={section}>
          <h2 className={h2}>The rules</h2>
          <p className={kicker}>
            When a piece makes its first capture, roll a d6. The result is that
            piece&apos;s trauma for the rest of the game.
          </p>
          <div className='grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4'>
            {FATES.map(({ marker, roll, name, text }) => (
              <div
                key={name}
                className='flex flex-col gap-2.5 rounded-xl bg-[#262421] p-4'
              >
                <div className='flex items-center gap-2.5'>
                  <Marker
                    {...marker}
                    className='block h-[62px] w-[58px] flex-none'
                  />
                  <div>
                    <div className='flex gap-1'>
                      {roll.map((n) => (
                        <i
                          key={n}
                          className='grid size-[22px] place-items-center rounded-[5px] border-2 border-[#120d0b] bg-[#f7f3ea] text-xs font-bold text-[#120d0b] not-italic'
                        >
                          {n}
                        </i>
                      ))}
                    </div>
                    <div className='text-xs text-[#a29e96] tabular-nums'>
                      {roll.length} in 6
                    </div>
                  </div>
                </div>
                <h3 className='font-semibold text-white'>{name}</h3>
                <p className='text-[13.5px] text-[#a29e96]'>{text}</p>
              </div>
            ))}
          </div>
          <div className='mt-3.5 grid gap-3.5 md:grid-cols-2'>
            <Callout
              art={
                <Svg html={healSvg(id)} className='block size-16 flex-none' />
              }
              title='Bishops heal'
              items={[
                'A bishop that moves next to guilt-ridden or devastated pieces of its own color heals them.',
                'A hurt bishop can spend its turn healing itself.',
                'A healed piece plays normally. If it captures again, its trauma comes back.',
              ]}
            />
            <Callout
              art={
                <Marker
                  trauma='psychopath'
                  healed={false}
                  turnsLeft={0}
                  kills={3}
                  className='block h-[68px] w-16 flex-none'
                />
              }
              title='Bloodlust'
              items={[
                'After 3 captures a psychopath can only move to capture.',
                'It will take pieces of either color, its own king included.',
                "Taking a king ends the game, whoever's it is.",
              ]}
            />
          </div>
          <p className='mt-4 text-[13.5px] text-[#a29e96]'>
            Everything else is regular chess: castling, en passant, promotion,
            check, checkmate and stalemate.
          </p>
        </section>

        <section className={section}>
          <div className='flex flex-wrap items-center gap-4 rounded-[14px] bg-[#262421] p-4'>
            <div className='grid size-16 flex-none place-items-center rounded-full border-2 border-[#514d47] bg-[#0b0a09]'>
              <TikTokIcon />
            </div>
            <div className='min-w-[200px] flex-1'>
              <strong className='text-base text-white'>
                Made by Bardelo Bardalini
              </strong>
              <p className='text-[13.5px] text-[#a29e96]'>
                Remorse Chess comes from Bardelo&apos;s chess variant videos on
                TikTok. Go watch the rest.
              </p>
            </div>
            <a
              href={TIKTOK}
              target='_blank'
              rel='noreferrer'
              className={cn(ghost, big)}
            >
              @bardelo_bardalini
            </a>
          </div>
        </section>

        <div className='flex flex-col items-center gap-2 pt-8 pb-6 text-center'>
          <h2 className='text-[28px] font-bold text-balance text-white'>
            {signedIn ? 'Back for more?' : 'Ready to feel bad about winning?'}
          </h2>
          <p className='mb-3 text-[#a29e96]'>
            {signedIn
              ? 'Your games are waiting.'
              : 'Free account, one tap with Google.'}
          </p>
          <MainAction {...props} className={big} />
        </div>
      </div>
    </RemorseLayout>
  );
};

// Sent here to sign in and already signed in → straight back into the game.
// Signed-in visitors without a returnTo just get the page.
export const getServerSideProps: GetServerSideProps<Props> = async ({
  req,
  query,
}) => {
  const returnTo = safeRemorsePath(query.returnTo);
  const signedIn = Boolean(await getAuthenticatedEmail(req, 'remorse-chess'));
  if (signedIn && query.returnTo) {
    return { redirect: { destination: returnTo, permanent: false } };
  }
  return { props: { signedIn, returnTo } };
};

export default LandingPage;
