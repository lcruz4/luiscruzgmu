import { Raleway } from 'next/font/google';
import Head from 'next/head';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

const raleway = Raleway({ subsets: ['latin'], variable: '--font-raleway' });

export const GiantLayout = ({ children }: { children: ReactNode }) => (
  <div
    className={cn(
      raleway.variable,
      'min-h-dvh bg-mist-ground font-ui text-mist-text lining-nums',
    )}
  >
    <Head>
      <title>Giant Order</title>
      {/* _app's body is black; this colours the overscroll area instead */}
      <style>{'html { background: var(--color-mist-ground); }'}</style>
    </Head>
    <div className='mx-auto flex min-h-dvh w-full max-w-md flex-col gap-4 px-4 py-5'>
      {children}
    </div>
  </div>
);
