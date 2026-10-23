import { JetBrains_Mono, Raleway } from 'next/font/google';
import Head from 'next/head';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { TabBar } from './TabBar';

const raleway = Raleway({ subsets: ['latin'], variable: '--font-raleway' });
const jetBrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
});

export const WorkoutLayout = ({ children }: { children: ReactNode }) => (
  <div
    className={cn(
      raleway.variable,
      jetBrainsMono.variable,
      'min-h-dvh bg-mist-ground font-ui text-mist-text',
    )}
  >
    <Head>
      <title>Workout Tracker</title>
      <link
        rel='icon'
        href='/images/workout-tracker.svg'
        type='image/svg+xml'
      />
      {/* _app's body is black; this colours the overscroll area instead */}
      <style>{'html { background: var(--color-mist-ground); }'}</style>
    </Head>
    <div className='mx-auto flex min-h-dvh w-full max-w-md flex-col'>
      {children}
      <TabBar />
    </div>
  </div>
);
