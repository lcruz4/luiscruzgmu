import Head from 'next/head';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import {
  authLogoutUrl,
  REMORSE_INSTALL_PATH,
  REMORSE_LANDING_PATH,
} from '@/lib/auth';
import type { TutorialKey } from '@/lib/remorse/tutorial';
import { RulesDialog } from './RulesDialog';
import { Wordmark } from './Wordmark';

const navItem = 'cursor-pointer text-left hover:text-white';

// Get the app stays in the header; rules, profile and log out fold into a
// menu on narrow screens
export const DefaultActions = () => {
  const [rulesSlide, setRulesSlide] = useState<TutorialKey | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: PointerEvent) => {
      if (e.target instanceof Node && !menuRef.current?.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  const items = (
    <>
      <button
        type='button'
        className={navItem}
        onClick={() => {
          setMenuOpen(false);
          setRulesSlide('intro');
        }}
      >
        Rules
      </button>
      <Link
        href='/projects/remorse-chess/profile'
        className={navItem}
        onClick={() => setMenuOpen(false)}
      >
        Profile
      </Link>
      <button
        type='button'
        className={navItem}
        onClick={() => {
          window.location.href = authLogoutUrl(
            `${window.location.origin}${REMORSE_LANDING_PATH}`,
          );
        }}
      >
        Log out
      </button>
    </>
  );

  return (
    <nav className='flex items-center gap-4 text-sm whitespace-nowrap text-[#a29e96]'>
      <Link href={REMORSE_INSTALL_PATH} className='hover:text-white'>
        Get the app
      </Link>
      <div className='hidden items-center gap-4 sm:flex'>{items}</div>
      <div ref={menuRef} className='relative sm:hidden'>
        <button
          type='button'
          aria-label='Menu'
          aria-expanded={menuOpen}
          className='flex size-9 cursor-pointer items-center justify-center rounded-lg hover:text-white'
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        {menuOpen && (
          <div className='absolute top-full right-0 z-50 mt-1 flex min-w-40 flex-col gap-1 rounded-xl border border-[#3a3733] bg-[#262421] p-2 text-[15px] shadow-xl *:rounded-lg *:px-3 *:py-2 *:hover:bg-[#3a3733]'>
            {items}
          </div>
        )}
      </div>
      <RulesDialog
        slide={rulesSlide}
        onSlide={setRulesSlide}
        onClose={() => setRulesSlide(null)}
      />
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
      <meta name='apple-mobile-web-app-title' content='Remorse Chess' />
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
