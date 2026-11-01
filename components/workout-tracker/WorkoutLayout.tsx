import { JetBrains_Mono, Raleway } from 'next/font/google';
import Head from 'next/head';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { RestTimer } from './RestTimer';
import { TabBar } from './TabBar';

const raleway = Raleway({ subsets: ['latin'], variable: '--font-raleway' });
const jetBrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
});

export const WorkoutLayout = ({
  children,
  tabBar = true,
}: {
  children: ReactNode;
  tabBar?: boolean;
}) => (
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
      <link rel='manifest' href='/manifests/workout-tracker.webmanifest' />
      <link
        rel='apple-touch-icon'
        href='/images/pwa/workout-tracker-apple-touch.png'
      />
      <meta name='apple-mobile-web-app-title' content='Workouts' />
      <meta name='theme-color' content='#cdeaed' />
      {/* _app's body is black; this colours the overscroll area instead */}
      <style>{'html { background: var(--color-mist-ground); }'}</style>
    </Head>
    <div className='mx-auto flex min-h-dvh w-full sm:max-w-md flex-col'>
      {children}
      {tabBar && (
        <>
          <RestTimer />
          <TabBar />
        </>
      )}
    </div>
  </div>
);
