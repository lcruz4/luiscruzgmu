import { Raleway } from 'next/font/google';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

const raleway = Raleway({ subsets: ['latin'], variable: '--font-raleway' });

const TABS = [
  { href: '/projects/giant-order-tool', label: 'Order' },
  { href: '/projects/giant-order-tool/defaults', label: 'Defaults' },
];

const Tabs = () => {
  const { pathname } = useRouter();
  return (
    <nav className='flex gap-1 rounded-[14px] bg-mist-header p-1'>
      {TABS.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          aria-current={pathname === href ? 'page' : undefined}
          className={cn(
            'flex h-9 flex-1 items-center justify-center rounded-[10px] text-sm font-bold text-mist-muted no-underline',
            pathname === href &&
              'bg-mist-surface text-mist-text shadow-mist-card',
          )}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
};

export const GiantLayout = ({ children }: { children: ReactNode }) => (
  <div
    className={cn(
      raleway.variable,
      'min-h-dvh bg-mist-ground font-ui text-mist-text lining-nums',
    )}
  >
    <Head>
      <title>Giant Order</title>
      <link
        rel='icon'
        href='/images/giant-order-tool.svg'
        type='image/svg+xml'
      />
      <link rel='manifest' href='/manifests/giant-order-tool.webmanifest' />
      <link
        rel='apple-touch-icon'
        href='/images/pwa/giant-order-tool-apple-touch.png'
      />
      <meta name='theme-color' content='#e2eff1' />
      {/* _app's body is black; this colours the overscroll area instead */}
      <style>{'html { background: var(--color-mist-ground); }'}</style>
    </Head>
    <div className='mx-auto flex min-h-dvh w-full sm:max-w-md flex-col gap-4 px-4 py-5'>
      <Tabs />
      {children}
    </div>
  </div>
);
