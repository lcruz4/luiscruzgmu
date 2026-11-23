import type { GetServerSideProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { type FormEvent, type ReactNode, useEffect, useState } from 'react';
import {
  buttonMd,
  buttonSm,
  ghostButton,
  goldButton,
} from '@/components/remorse-chess/buttons';
import { GoogleIcon } from '@/components/GoogleIcon';
import { HeroScene } from '@/components/remorse-chess/HeroScene';
import { RemorseLayout } from '@/components/remorse-chess/RemorseLayout';
import { authLoginUrl, REMORSE_HOME, REMORSE_LANDING_PATH } from '@/lib/auth';
import { FEEDBACK_TOPICS, type FeedbackTopic } from '@/lib/remorse/feedback';
import { pieceSrc } from '@/lib/remorse/pieceSets';
import { cn } from '@/lib/utils';
import { getAuthenticatedEmail } from '@/services/auth';
import type { Color, PieceType } from '@/types/remorse';
import { appStorePledges } from '@/services/remorseDb';

const INSTALL_PATH = '/projects/remorse-chess/install';
const PLEDGE_GOAL = 100;
const ICON = '/images/pwa/remorse-chess-192.png';

type Props = {
  email: string | null;
  pledgeCount: number;
  pledged: boolean;
};

type Platform = 'ios' | 'android';

const section = 'border-t border-[#3a3733] py-9';
const h2 = 'mb-1.5 text-2xl font-bold text-balance text-white';
const kicker = 'mb-5 max-w-[62ch] text-[#a29e96]';
const card = 'rounded-xl bg-[#262421] p-4';

const shareUrl = () => `${window.location.origin}${REMORSE_LANDING_PATH}`;

// Copies the landing page link; says so for a moment after
const useCopyLink = () => {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);
  const copy = async () => {
    await navigator.clipboard.writeText(shareUrl());
    setCopied(true);
  };
  return { copied, copy };
};

// A small phone drawing for an install step
const Phone = ({
  className,
  children,
}: {
  className: string;
  children: ReactNode;
}) => (
  <div
    className={cn(
      'relative h-[128px] w-[104px] flex-none overflow-hidden rounded-[14px] border-[3px] border-[#0b0a09]',
      className,
    )}
    aria-hidden
  >
    {children}
  </div>
);

const HomeScreen = ({
  round,
  className,
}: {
  round: boolean;
  className: string;
}) => (
  <Phone
    className={cn(
      'grid grid-cols-3 content-start gap-2 px-2.5 py-3.5',
      className,
    )}
  >
    {[0, 1, 2, 3].map((i) => (
      <span
        key={i}
        className={cn(
          'aspect-square',
          round ? 'rounded-full' : 'rounded-md',
          i % 2 ? 'bg-white/45' : 'bg-white/25',
        )}
      />
    ))}
    <img
      src={ICON}
      alt=''
      className={cn(
        'w-full outline-2 outline-offset-2 outline-[#ffd27a]',
        round ? 'rounded-full' : 'rounded-md',
      )}
    />
  </Phone>
);

const IOS_STEPS = [
  {
    title: 'Tap Share in Safari',
    text: 'The square with the arrow, at the bottom of the screen. Use Safari, not Chrome.',
    art: (
      <Phone className='bg-[#f2f1ee]'>
        <span className='absolute inset-x-2 top-2.5 h-2.5 rounded-full bg-[#dcdad5]' />
        <span className='absolute inset-x-2 top-7 bottom-[30px] rounded-md bg-[#161512]' />
        <span className='absolute inset-x-0 bottom-0 flex h-[26px] items-center justify-around bg-[#e7e5e0]'>
          <span className='size-2 rounded-sm bg-[#b9b6af]' />
          <span className='grid size-[22px] place-items-center rounded-full bg-[#0a84ff]'>
            <svg
              viewBox='0 0 24 24'
              className='size-3'
              fill='none'
              stroke='#fff'
              strokeWidth='2.4'
              strokeLinecap='round'
              strokeLinejoin='round'
            >
              <path d='M12 3v12M7 8l5-5 5 5M5 13v7h14v-7' />
            </svg>
          </span>
          <span className='size-2 rounded-sm bg-[#b9b6af]' />
        </span>
      </Phone>
    ),
  },
  {
    title: 'Add to Home Screen',
    text: 'Scroll the share sheet until you see it, then tap Add.',
    art: (
      <Phone className='bg-[#3a3a3c]'>
        <span className='absolute inset-x-0 top-[30px] bottom-0 flex flex-col gap-[5px] rounded-t-[10px] bg-[#f2f1ee] px-1.5 py-2'>
          <span className='h-3.5 rounded bg-[#e2e0db]' />
          <span className='h-3.5 rounded bg-[#e2e0db]' />
          <span className='flex h-[18px] items-center gap-1 rounded border-2 border-[#0a84ff] bg-white px-1 text-[7.5px] font-bold text-[#1c1c1e]'>
            <span className='size-2 rounded-[2px] border-[1.5px] border-[#1c1c1e]' />
            Add to Home Screen
          </span>
          <span className='h-3.5 rounded bg-[#e2e0db]' />
        </span>
      </Phone>
    ),
  },
  {
    title: 'Open it from your home screen',
    text: 'Always start Remorse from the icon. That’s the version that can send notifications.',
    art: <HomeScreen round={false} className='bg-[#2c3e50]' />,
  },
];

const ANDROID_STEPS = [
  {
    title: 'Open the Chrome menu',
    text: 'The three dots, top right. Chrome may also offer an Install banner on its own.',
    art: (
      <Phone className='bg-[#f2f1ee]'>
        <span className='absolute top-2 right-[26px] left-1.5 h-3.5 rounded-full bg-[#dcdad5]' />
        <span className='absolute top-1.5 right-1.5 flex h-5 w-[18px] flex-col items-center justify-center gap-0.5 rounded-md bg-[#1a73e8]'>
          {[0, 1, 2].map((i) => (
            <span key={i} className='size-[3px] rounded-full bg-white' />
          ))}
        </span>
        <span className='absolute inset-x-1.5 top-[30px] bottom-1.5 rounded-md bg-[#161512]' />
      </Phone>
    ),
  },
  {
    title: 'Tap Install app',
    text: 'Some phones call it Add to Home screen. Then tap Install.',
    art: (
      <Phone className='bg-[#161512]'>
        <span className='absolute top-1.5 right-1 flex w-[74px] flex-col gap-1 rounded-md bg-white px-1 py-1.5'>
          <span className='h-2.5 rounded-sm bg-[#e2e0db]' />
          <span className='h-2.5 rounded-sm bg-[#e2e0db]' />
          <span className='flex h-4 items-center rounded-sm border-2 border-[#1a73e8] px-1 text-[7.5px] font-bold text-[#202124]'>
            Install app
          </span>
          <span className='h-2.5 rounded-sm bg-[#e2e0db]' />
          <span className='h-2.5 rounded-sm bg-[#e2e0db]' />
        </span>
      </Phone>
    ),
  },
  {
    title: 'Find it with your apps',
    text: 'Remorse lands on your home screen and in the app drawer.',
    art: <HomeScreen round className='bg-[#1e3a2f]' />,
  },
];

const FAQS = [
  [
    'Is it free?',
    'Yes. No ads, no paid tiers. You only need a Google account so your games are saved.',
  ],
  [
    'Why isn’t it in the App Store?',
    'Store apps cost money every year and take time to keep approved. If enough people want one, I’ll make it.',
  ],
  [
    'Do I have to install it?',
    'No, it works in any browser. Installing makes it full screen and lets it tell you when it’s your move.',
  ],
  [
    'How do I turn notifications off?',
    'In your phone’s settings under Remorse Chess. Removing the app from your home screen stops them too.',
  ],
  [
    'Does it work on a computer?',
    'Yes. Chrome and Edge can install it too, from the install icon in the address bar.',
  ],
  [
    'Who came up with the rules?',
    'Bardelo Bardalini, from a series of chess variant videos on TikTok. I built the app.',
  ],
];

const InstallSteps = () => {
  const [platform, setPlatform] = useState<Platform>('ios');
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (/android/i.test(navigator.userAgent)) setPlatform('android');
    setInstalled(
      window.matchMedia(
        '(display-mode: fullscreen), (display-mode: standalone)',
      ).matches,
    );
  }, []);

  const steps = platform === 'ios' ? IOS_STEPS : ANDROID_STEPS;
  const tab = (value: Platform, label: string) => (
    <button
      type='button'
      aria-pressed={platform === value}
      onClick={() => setPlatform(value)}
      className={cn(
        'min-h-10 flex-1 cursor-pointer rounded-lg font-semibold',
        platform === value ? 'bg-[#514d47] text-white' : 'text-[#a29e96]',
      )}
    >
      {label}
    </button>
  );

  return (
    <section id='install' className={section}>
      <h2 className={h2}>Install in 10 seconds</h2>
      <p className={kicker}>
        Remorse is a web app, so your browser installs it. No store needed.
      </p>
      {installed && (
        <p className='mb-4 rounded-lg border border-[#3f9a5a]/60 bg-[#3f9a5a]/15 px-3 py-2 text-sm text-[#b9f0c4]'>
          You’re already using the installed app.
        </p>
      )}
      <div className='mb-3.5 flex max-w-[360px] rounded-[10px] border border-[#3a3733] bg-[#302d29] p-[3px]'>
        {tab('ios', 'iPhone and iPad')}
        {tab('android', 'Android')}
      </div>
      <ol className='grid gap-3.5 md:grid-cols-3'>
        {steps.map(({ title, text, art }, i) => (
          <li key={title} className={cn(card, 'flex items-center gap-3.5 p-3')}>
            {art}
            <div className='min-w-0'>
              <p className='text-xs font-bold tracking-wide text-[#ffd27a]'>
                STEP {i + 1}
              </p>
              <strong className='block text-white'>{title}</strong>
              <span className='text-[13.5px] text-[#a29e96]'>{text}</span>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
};

const LockScreen = () => (
  <div
    className='rounded-[22px] bg-[radial-gradient(120%_90%_at_30%_0%,#4a3b2a,#1b1713_70%)] px-4 pt-7 pb-6'
    aria-hidden
  >
    <p className='text-center text-[52px] leading-none font-light tracking-tight text-white'>
      9:41
    </p>
    <p className='mt-1 mb-5 text-center text-[13px] text-white/75'>
      Your opponent just moved
    </p>
    <div className='mx-auto flex max-w-[380px] items-start gap-2.5 rounded-2xl bg-[#f5f2ec]/90 px-3 py-2.5 text-[#1c1a17]'>
      <img src={ICON} alt='' className='size-[34px] flex-none rounded-lg' />
      <div className='min-w-0 flex-1'>
        <div className='flex justify-between text-[13px]'>
          <b>Remorse Chess</b>
          <span className='text-[#5f5b55]'>now</span>
        </div>
        <p className='text-[13.5px] leading-snug'>
          Your move. Their knight took your bishop... and they liked it 😈
        </p>
      </div>
    </div>
  </div>
);

const AppStorePledge = ({ email, pledgeCount, pledged }: Props) => {
  const [state, setState] = useState({ count: pledgeCount, pledged });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  const update = async (method: 'POST' | 'DELETE') => {
    setPending(true);
    setError('');
    try {
      const response = await fetch('/api/remorse-chess/app-store-pledge', {
        method,
      });
      if (!response.ok) throw new Error();
      setState(await response.json());
    } catch {
      setError('Couldn’t save that. Try again.');
    } finally {
      setPending(false);
    }
  };

  const signIn = () => {
    window.location.href = authLoginUrl(
      `${window.location.origin}${INSTALL_PATH}#app-store`,
      window.location.hostname,
    );
  };

  const percent = Math.min(100, (state.count / PLEDGE_GOAL) * 100);

  return (
    <div
      id='app-store'
      className='scroll-mt-4 rounded-[14px] border border-[#3a3733] bg-[#262421] p-5'
    >
      <h2 className='mb-1.5 text-xl font-bold text-white'>
        Should Remorse be in the App Store?
      </h2>
      <p className='mb-4 text-[14px] text-[#a29e96]'>
        Publishing a store app costs money every year, and I’m paying for this
        myself. If enough players want it, I’d be more than happy to do it. Add
        your name to the list below so I know you’re interested.
      </p>
      <div className='mb-1.5 flex justify-between text-[13px]'>
        <b className='text-white'>
          {state.count} {state.count === 1 ? 'player' : 'players'}
        </b>
        <span className='text-[#a29e96]'>Goal: {PLEDGE_GOAL}</span>
      </div>
      <div
        className='mb-4 h-3 overflow-hidden rounded-full border border-[#3a3733] bg-[#161512]'
        role='progressbar'
        aria-label='Players who want an App Store version'
        aria-valuenow={state.count}
        aria-valuemin={0}
        aria-valuemax={PLEDGE_GOAL}
      >
        <div
          className='h-full bg-linear-to-r from-[#c98a1c] to-[#ffd27a] transition-[width] duration-500'
          style={{ width: `${percent}%` }}
        />
      </div>
      {!email && (
        <button
          type='button'
          onClick={signIn}
          className={cn(goldButton, buttonMd)}
        >
          <span className='grid size-[22px] flex-none place-items-center rounded-full bg-white'>
            <GoogleIcon className='size-[15px]' />
          </span>
          Sign in to add your name
        </button>
      )}
      {email && !state.pledged && (
        <button
          type='button'
          onClick={() => update('POST')}
          disabled={pending}
          className={cn(goldButton, buttonMd)}
        >
          I’d download it
        </button>
      )}
      {email && state.pledged && (
        <div className='flex flex-wrap items-center gap-3'>
          <span className='inline-flex min-h-[46px] items-center rounded-[10px] border border-[#3f9a5a]/60 bg-[#3f9a5a]/15 px-4 font-semibold text-[#b9f0c4]'>
            You’re on the list. Thank you.
          </span>
          <button
            type='button'
            onClick={() => update('DELETE')}
            disabled={pending}
            className='cursor-pointer text-[13px] text-[#a29e96] underline hover:text-white'
          >
            Take my name off
          </button>
        </div>
      )}
      {error && <p className='mt-2 text-sm text-red-300'>{error}</p>}
    </div>
  );
};

const SHARE_PIECES: [Color, PieceType][] = [
  ['w', 'n'],
  ['b', 'q'],
];

const ShareCard = () => {
  const { copied, copy } = useCopyLink();
  const [canShare, setCanShare] = useState(false);
  useEffect(() => setCanShare(typeof navigator.share === 'function'), []);

  const share = () =>
    navigator
      .share({
        title: 'Remorse Chess',
        text: 'Chess where every capture leaves a mark. Play me?',
        url: shareUrl(),
      })
      .catch(() => {});

  return (
    <div className='flex flex-col rounded-[14px] bg-[#262421] p-5'>
      <div
        className='mb-4 flex h-[130px] items-end justify-center gap-5'
        aria-hidden
      >
        {SHARE_PIECES.map(([color, type], i) => (
          <div key={color + type} className='contents'>
            {i === 1 && (
              <svg
                viewBox='0 0 40 24'
                className='mb-11 w-10'
                fill='none'
                stroke='#ffd27a'
                strokeWidth='2'
                strokeLinecap='round'
                strokeDasharray='3 5'
              >
                <path d='M2 12h34M30 6l6 6-6 6' />
              </svg>
            )}
            <div className='grid h-[110px] w-[70px] place-items-center rounded-[13px] border-[3px] border-[#0b0a09] bg-[#8f7b62]'>
              <img
                src={pieceSrc('mourners', color, type)}
                alt=''
                className='w-12'
              />
            </div>
          </div>
        ))}
      </div>
      <h2 className='mb-1.5 text-xl font-bold text-white'>Bring a rival</h2>
      <p className='mb-4 text-[14px] text-[#a29e96]'>
        Remorse is better against someone you know. Every share helps a
        one-person project more than you’d think.
      </p>
      <div className='mt-auto flex flex-wrap gap-2.5'>
        {canShare && (
          <button
            type='button'
            onClick={share}
            className={cn(goldButton, buttonMd)}
          >
            Share Remorse
          </button>
        )}
        <button
          type='button'
          onClick={copy}
          className={cn(canShare ? ghostButton : goldButton, buttonMd)}
        >
          {copied ? 'Link copied' : 'Copy link'}
        </button>
      </div>
    </div>
  );
};

const FeedbackForm = ({ email }: { email: string | null }) => {
  const [topic, setTopic] = useState<FeedbackTopic>('Feature');
  const [message, setMessage] = useState('');
  const [replyTo, setReplyTo] = useState(email ?? '');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>(
    'idle',
  );
  const [error, setError] = useState('');

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!message.trim()) {
      setError('Write a message first.');
      return;
    }
    setStatus('sending');
    setError('');
    try {
      const response = await fetch('/api/remorse-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, message, email: replyTo.trim() }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error ?? 'failed');
      setStatus('sent');
      setMessage('');
    } catch (failure) {
      setStatus('error');
      setError(
        failure instanceof Error && failure.message !== 'failed'
          ? `Couldn’t send that: ${failure.message}.`
          : 'Couldn’t send that. Try again.',
      );
    }
  };

  const field =
    'w-full rounded-lg border-2 border-[#514d47] bg-[#161512] px-3 py-2 text-white outline-none focus:border-[#c98a1c]';

  return (
    <section id='contact' className={cn(section, 'grid gap-6 md:grid-cols-2')}>
      <div>
        <img
          src={pieceSrc('mourners', 'w', 'k')}
          alt=''
          className='mb-2 w-14'
          aria-hidden
        />
        <h2 className={h2}>Tell me what you think</h2>
        <p className='text-[#a29e96]'>
          A feature you want, a bug you found, or anything else. I read every
          message.
        </p>
      </div>
      <form onSubmit={submit} className={cn(card, 'flex flex-col gap-2.5')}>
        <div className='flex flex-wrap gap-2' role='group' aria-label='Topic'>
          {FEEDBACK_TOPICS.map((value) => (
            <button
              key={value}
              type='button'
              aria-pressed={topic === value}
              onClick={() => setTopic(value)}
              className={cn(
                'min-h-9 cursor-pointer rounded-full border px-3.5 text-sm',
                topic === value
                  ? 'border-[#c98a1c] bg-[#c98a1c]/20 font-semibold text-[#ffd27a]'
                  : 'border-[#514d47] bg-[#302d29] text-[#e8e4dc]',
              )}
            >
              {value}
            </button>
          ))}
        </div>
        <label
          htmlFor='feedback-message'
          className='text-[13px] text-[#a29e96]'
        >
          Message
        </label>
        <textarea
          id='feedback-message'
          rows={4}
          maxLength={5000}
          value={message}
          onChange={(event) => {
            setMessage(event.target.value);
            setError('');
            if (status !== 'sending') setStatus('idle');
          }}
          placeholder='It would be great if…'
          className={cn(field, 'resize-y')}
        />
        <label htmlFor='feedback-email' className='text-[13px] text-[#a29e96]'>
          Email, if you want a reply
        </label>
        <input
          id='feedback-email'
          type='email'
          value={replyTo}
          onChange={(event) => setReplyTo(event.target.value)}
          placeholder='you@example.com'
          autoComplete='email'
          className={field}
        />
        {error && <p className='text-sm text-red-300'>{error}</p>}
        <div className='flex items-center gap-3'>
          <button
            type='submit'
            disabled={status === 'sending'}
            className={cn(ghostButton, buttonMd)}
          >
            {status === 'sending' ? 'Sending…' : 'Send'}
          </button>
          {status === 'sent' && (
            <span className='text-sm text-[#ffd27a]'>Sent. Thank you!</span>
          )}
        </div>
      </form>
    </section>
  );
};

const AboutCard = () => {
  const { copied, copy } = useCopyLink();
  return (
    <div className={cn(card, 'flex max-w-[480px] items-start gap-3.5')}>
      <div
        className='grid size-14 flex-none place-items-center rounded-full border-2 border-[#514d47] bg-[#302d29] text-center text-[11px] leading-tight text-[#a29e96]'
        aria-hidden
      >
        LC
      </div>
      <div className='min-w-0'>
        <p className='font-semibold text-white'>
          Hi, I’m Luis Cruz{' '}
          <a
            href='https://lcruz.dev'
            target='_blank'
            rel='noreferrer'
            className='ml-1 text-sm font-semibold text-[#ffd27a] hover:text-white'
          >
            lcruz.dev →
          </a>
        </p>
        <p className='mt-1 text-[14px] text-[#a29e96]'>
          I build Remorse Chess on my own, in my evenings. Thank you for giving
          it a try. It genuinely means a lot that people are playing something I
          made. If you’re enjoying it, the best way to help is to share it with
          a friend.
        </p>
        <button
          type='button'
          onClick={copy}
          className={cn(ghostButton, buttonSm, 'mt-3')}
        >
          {copied ? 'Link copied' : 'Copy share link'}
        </button>
      </div>
    </div>
  );
};

const InstallPage = (props: Props) => (
  <RemorseLayout
    title='Get the app · Remorse Chess'
    actions={
      <nav className='flex items-center gap-4 text-sm'>
        <a href='#faq' className='hidden text-[#a29e96] sm:inline'>
          FAQ
        </a>
        <a href='#contact' className='hidden text-[#a29e96] sm:inline'>
          Contact
        </a>
        <Link
          href={props.email ? REMORSE_HOME : REMORSE_LANDING_PATH}
          className={cn(goldButton, 'px-3 py-1.5 text-[13px]')}
        >
          {props.email ? 'Your games' : 'Play'}
        </Link>
      </nav>
    }
  >
    <Head>
      <meta
        name='description'
        content='Install Remorse Chess on your iPhone or Android home screen.'
      />
      <style>
        {
          '@media (prefers-reduced-motion: no-preference) { html { scroll-behavior: smooth; } } section[id] { scroll-margin-top: 16px; }'
        }
      </style>
    </Head>
    <div className='mx-auto max-w-[1040px] text-[15px] leading-relaxed'>
      <div className='grid items-center gap-8 pt-3 pb-10 md:grid-cols-[1.05fr_1fr] md:pt-7'>
        <div className='relative mx-auto aspect-[9/8] w-full max-w-[360px] overflow-hidden rounded-2xl md:order-last md:max-w-none'>
          <HeroScene />
        </div>
        <div className='min-w-0'>
          <div className='flex items-center gap-3'>
            <img
              src={ICON}
              alt=''
              className='size-12 rounded-xl border-2 border-[#120d0b]'
            />
            <span className='inline-flex rounded-full border border-[#c98a1c]/45 bg-[#c98a1c]/15 px-2.5 py-0.5 text-xs font-semibold text-[#ffd27a]'>
              ✦ Free, no app store needed
            </span>
          </div>
          <h1 className='mt-4 mb-3 text-[clamp(30px,4.5vw,46px)] leading-[1.05] font-bold tracking-tight text-balance text-white'>
            Put Remorse on your home screen
          </h1>
          <p className='mb-5 max-w-[46ch] text-[17px] text-[#a29e96]'>
            It opens full screen like any other app, and it can tell you when
            it’s your move.
          </p>
          <AboutCard />
        </div>
      </div>

      <InstallSteps />

      <section
        className={cn(section, 'grid items-center gap-8 md:grid-cols-2')}
      >
        <LockScreen />
        <div>
          <h2 className={h2}>Know when it’s your move</h2>
          <p className='mb-3 text-[#a29e96]'>
            Once it’s installed, Remorse can send you a notification when your
            opponent moves. Only if you say yes, and you can switch it off any
            time.
          </p>
          <p className='text-[13.5px] text-[#a29e96]'>
            On iPhone this needs iOS 16.4 or newer, with the app opened from
            your home screen.
          </p>
        </div>
      </section>

      <section className={cn(section, 'grid gap-4 md:grid-cols-2')}>
        <AppStorePledge {...props} />
        <ShareCard />
      </section>

      <section id='faq' className={section}>
        <h2 className={h2}>Questions</h2>
        <div className='mt-4 grid items-start gap-3 md:grid-cols-2'>
          {FAQS.map(([question, answer]) => (
            <details key={question} className='group rounded-xl bg-[#262421]'>
              <summary className='flex min-h-[52px] cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 font-semibold text-white [&::-webkit-details-marker]:hidden'>
                {question}
                <span className='text-lg text-[#ffd27a] group-open:rotate-45 transition-transform'>
                  +
                </span>
              </summary>
              <p className='px-4 pb-4 text-[14px] text-[#a29e96]'>{answer}</p>
            </details>
          ))}
        </div>
      </section>

      <FeedbackForm email={props.email} />

      <footer className='border-t border-[#3a3733] pt-6 pb-8 text-center text-[13px] text-[#a29e96]'>
        Built by Luis Cruz ·{' '}
        <a
          href='https://lcruz.dev'
          target='_blank'
          rel='noreferrer'
          className='text-[#ffd27a]'
        >
          lcruz.dev
        </a>{' '}
        · Remorse Chess is a variant by Bardelo Bardalini
      </footer>
    </div>
  </RemorseLayout>
);

export const getServerSideProps: GetServerSideProps<Props> = async ({
  req,
}) => {
  const email = await getAuthenticatedEmail(req, 'remorse-chess');
  const { count, pledged } = await appStorePledges(email);
  return { props: { email, pledgeCount: count, pledged } };
};

export default InstallPage;
