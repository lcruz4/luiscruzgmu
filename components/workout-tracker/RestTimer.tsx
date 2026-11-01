import * as Dialog from '@radix-ui/react-dialog';
import { Pause, Play, RotateCcw, Timer, X } from 'lucide-react';
import { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useRestTimer } from './useRestTimer';

const ADJUSTMENTS = [
  { delta: -60_000, label: '−1m', name: 'Remove 1 minute' },
  { delta: -5_000, label: '−5s', name: 'Remove 5 seconds' },
  { delta: 5_000, label: '+5s', name: 'Add 5 seconds' },
  { delta: 60_000, label: '+1m', name: 'Add 1 minute' },
];

const clock = (ms: number) => {
  const seconds = Math.ceil(ms / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
};

// Keeps the screen on after the timer ends so the chime plays
const WAKE_LOCK_HOLD = 10_000;

// The browser drops the lock when the tab is hidden, so it's re-requested
// when the tab is visible again
const useWakeLock = (active: boolean) => {
  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) return;
    let lock: WakeLockSentinel | undefined;
    let done = false;
    const request = () => {
      if (document.visibilityState !== 'visible') return;
      if (lock && !lock.released) return;
      navigator.wakeLock
        .request('screen')
        .then((next) => {
          lock = next;
          if (done) lock.release().catch(() => {});
        })
        .catch(() => {});
    };
    request();
    document.addEventListener('visibilitychange', request);
    return () => {
      document.removeEventListener('visibilitychange', request);
      setTimeout(() => {
        done = true;
        lock?.release().catch(() => {});
      }, WAKE_LOCK_HOLD);
    };
  }, [active]);
};

// Floating button above the tab bar; opens the timer as a bottom sheet.
// Sticky, so its own space keeps it clear of the last card.
export const RestTimer = () => {
  const timer = useRestTimer();
  const running = timer.endsAt !== null;
  const progress = timer.total ? timer.left / timer.total : 0;
  useWakeLock(running);

  return (
    <Dialog.Root open={timer.open} onOpenChange={timer.setOpen}>
      <div className='sticky bottom-[calc(96px+env(safe-area-inset-bottom))] z-10 mr-4 mb-4 self-end'>
        <Dialog.Trigger
          aria-label={
            running ? `Rest timer, ${clock(timer.left)} left` : 'Rest timer'
          }
          className={cn(
            'flex h-14 min-w-14 cursor-pointer items-center justify-center gap-1.5 rounded-full px-4 shadow-lg',
            running
              ? 'bg-mist-pink text-mist-raised'
              : 'border border-mist-line bg-mist-surface text-mist-cyan-text',
          )}
        >
          <Timer size={22} strokeWidth={2.25} aria-hidden />
          {running && (
            <span className='font-num text-base font-bold tabular-nums'>
              {clock(timer.left)}
            </span>
          )}
        </Dialog.Trigger>
      </div>
      {/* No portal: the layout's font variables wouldn't reach it */}
      <Dialog.Overlay className='fixed inset-0 z-50 bg-mist-ink/40' />
      <Dialog.Content
        aria-describedby={undefined}
        className='fixed inset-x-0 bottom-0 z-50 mx-auto flex sm:max-w-md flex-col items-center gap-5 rounded-t-2xl bg-mist-surface px-4 pt-4 pb-[max(20px,env(safe-area-inset-bottom))] text-mist-text'
      >
        <div className='flex w-full items-center justify-between'>
          <Dialog.Title className='m-0 text-lg font-extrabold'>
            Rest timer
          </Dialog.Title>
          <Dialog.Close
            aria-label='Close'
            className='-mr-2 flex size-11 cursor-pointer items-center justify-center text-mist-muted'
          >
            <X size={20} strokeWidth={2.25} aria-hidden />
          </Dialog.Close>
        </div>
        <div className='relative size-56'>
          <svg viewBox='0 0 100 100' className='size-full -rotate-90'>
            <circle
              cx='50'
              cy='50'
              r='45'
              fill='none'
              strokeWidth='6'
              className='stroke-mist-line'
            />
            <circle
              cx='50'
              cy='50'
              r='45'
              fill='none'
              strokeWidth='6'
              strokeLinecap='round'
              pathLength={100}
              strokeDasharray={100}
              strokeDashoffset={100 * (1 - progress)}
              className={cn(
                'stroke-mist-pink transition-[stroke-dashoffset] duration-100 ease-linear',
                timer.left === 0 && 'opacity-0',
              )}
            />
          </svg>
          <span
            role='timer'
            className='absolute inset-0 flex items-center justify-center font-num text-5xl font-bold tabular-nums'
          >
            {clock(timer.left)}
          </span>
        </div>
        <div className='grid w-full grid-cols-4 gap-2'>
          {ADJUSTMENTS.map(({ delta, label, name }) => (
            <button
              key={delta}
              type='button'
              aria-label={name}
              disabled={delta < 0 && timer.left === 0}
              onClick={() => timer.adjust(delta)}
              className='h-12 cursor-pointer rounded-[12px] border border-mist-line bg-mist-raised font-num text-base font-bold disabled:cursor-default disabled:opacity-50'
            >
              {label}
            </button>
          ))}
        </div>
        <div className='grid w-full grid-cols-[auto_1fr] gap-2'>
          <button
            type='button'
            aria-label='Reset'
            onClick={timer.reset}
            className='flex size-12 cursor-pointer items-center justify-center rounded-[12px] border border-mist-line text-mist-muted'
          >
            <RotateCcw size={20} strokeWidth={2.25} aria-hidden />
          </button>
          <button
            type='button'
            onClick={running ? timer.pause : timer.start}
            className='flex h-12 cursor-pointer items-center justify-center gap-2 rounded-[12px] bg-mist-cyan text-[15px] font-extrabold text-mist-ink'
          >
            {running ? (
              <Pause size={18} strokeWidth={3} aria-hidden />
            ) : (
              <Play size={18} strokeWidth={3} aria-hidden />
            )}
            {running ? 'Pause' : timer.left === 0 ? 'Restart' : 'Start'}
          </button>
        </div>
      </Dialog.Content>
    </Dialog.Root>
  );
};
