import Head from 'next/head';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { REMORSE_LANDING_PATH } from '@/lib/auth';
import { Wordmark } from './Wordmark';

const RulesLink = () => (
  <Link href={REMORSE_LANDING_PATH} className='text-sm text-[#a29e96]'>
    Rules
  </Link>
);

// `actions` sits at the right of the header; defaults to a link to the rules
export const RemorseLayout = ({
  children,
  actions = <RulesLink />,
}: {
  children: ReactNode;
  actions?: ReactNode;
}) => (
  <div className='min-h-dvh bg-[#161512] font-sans text-[#e8e6e1]'>
    <Head>
      <title>Remorse Chess</title>
      <link
        key='icon'
        rel='icon'
        href='/images/remorse-chess.svg'
        type='image/svg+xml'
      />
      <link rel='manifest' href='/manifests/remorse-chess.webmanifest' />
      <link
        rel='apple-touch-icon'
        href='/images/pwa/remorse-chess-apple-touch.png'
      />
      <meta name='apple-mobile-web-app-title' content='Remorse' />
      <meta name='theme-color' content='#161512' />
      {/* Installed on iOS the page runs under the status bar, so the
          header pads itself clear of it */}
      <meta
        name='apple-mobile-web-app-status-bar-style'
        content='black-translucent'
      />
      <meta
        name='viewport'
        content='width=device-width, initial-scale=1, viewport-fit=cover'
      />
    </Head>
    <header className='flex items-center justify-between px-4 pt-[max(12px,env(safe-area-inset-top))] pb-3'>
      <Link href='/projects/remorse-chess' className='flex'>
        <Wordmark size='header' />
      </Link>
      {actions}
    </header>
    <main className='px-4 pb-8'>{children}</main>
  </div>
);
