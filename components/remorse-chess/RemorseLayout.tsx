import Head from 'next/head';
import Link from 'next/link';
import type { ReactNode } from 'react';

export const RemorseLayout = ({ children }: { children: ReactNode }) => (
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
    </Head>
    <header className='flex items-center justify-between px-4 py-3'>
      <Link
        href='/projects/remorse-chess'
        className='text-lg font-medium text-white'
      >
        Remorse Chess
      </Link>
    </header>
    <main className='px-4 pb-8'>{children}</main>
  </div>
);
