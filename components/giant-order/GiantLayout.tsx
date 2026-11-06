import { ShoppingCart, SlidersHorizontal } from 'lucide-react';
import { Raleway } from 'next/font/google';
import Head from 'next/head';
import type { ReactNode } from 'react';
import { TabBar } from '@/components/mist/TabBar';
import { cn } from '@/lib/utils';

const raleway = Raleway({ subsets: ['latin'], variable: '--font-raleway' });

const HOME = '/projects/giant-order-tool';

const TABS = [
  { href: HOME, label: 'Order', Icon: ShoppingCart },
  { href: `${HOME}/defaults`, label: 'Defaults', Icon: SlidersHorizontal },
];

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
        key='icon'
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
    <div className='mx-auto flex min-h-dvh w-full sm:max-w-md flex-col'>
      <main className='flex flex-1 flex-col gap-4 px-4 py-5'>{children}</main>
      <TabBar label='Giant order' tabs={TABS} home={HOME} />
    </div>
  </div>
);
