import Head from 'next/head';
import Link from 'next/link';
import { type ReactNode, useState } from 'react';
import {
  authLogoutUrl,
  REMORSE_INSTALL_PATH,
  REMORSE_LANDING_PATH,
} from '@/lib/auth';
import type { TutorialKey } from '@/lib/remorse/tutorial';
import { RulesDialog } from './RulesDialog';
import { Wordmark } from './Wordmark';

// getApp: a link to the install page, for the lobby
export const DefaultActions = ({ getApp = false }: { getApp?: boolean }) => {
  const [rulesSlide, setRulesSlide] = useState<TutorialKey | null>(null);
  return (
    <nav className='flex items-center gap-4 text-sm text-[#a29e96]'>
      {getApp && (
        <Link href={REMORSE_INSTALL_PATH} className='hover:text-white'>
          Get the app
        </Link>
      )}
      <button
        type='button'
        className='cursor-pointer hover:text-white'
        onClick={() => setRulesSlide('intro')}
      >
        Rules
      </button>
      <RulesDialog
        slide={rulesSlide}
        onSlide={setRulesSlide}
        onClose={() => setRulesSlide(null)}
      />
      <Link href='/projects/remorse-chess/profile'>Profile</Link>
      <button
        type='button'
        className='cursor-pointer hover:text-white'
        onClick={() => {
          window.location.href = authLogoutUrl(
            `${window.location.origin}${REMORSE_LANDING_PATH}`,
          );
        }}
      >
        Log out
      </button>
    </nav>
  );
};

// `actions` sits at the right of the header; defaults to rules, profile and
// log out
export const RemorseLayout = ({
  children,
  actions = <DefaultActions />,
  title = 'Remorse Chess',
}: {
  children: ReactNode;
  actions?: ReactNode;
  title?: string;
}) => (
  <div className='min-h-dvh bg-[#161512] font-sans text-[#e8e6e1]'>
    <Head>
      <title>{title}</title>
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
