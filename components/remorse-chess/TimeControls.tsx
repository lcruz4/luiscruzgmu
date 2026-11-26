import { useEffect, useState } from 'react';
import {
  CATEGORY_NAMES,
  DEFAULT_TIME_CONTROL,
  isTimeControl,
  TIME_CATEGORIES,
  TIME_CONTROLS,
  type TimeCategory,
  timeControlOf,
} from '@/lib/remorse/timeControls';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { buttonMd, goldButton } from './buttons';

const OUT = '#120d0b';
const SUN_RAYS =
  'M12 1.8v2.6M12 19.6v2.6M1.8 12h2.6M19.6 12h2.6M4.8 4.8l1.8 1.8M17.4 17.4l1.8 1.8M4.8 19.2l1.8-1.8M17.4 6.6l1.8-1.8';

// Small category marks, drawn like the rest of the Remorse icons
export const CategoryIcon = ({
  category,
  className = 'block size-5 flex-none',
}: {
  category: TimeCategory;
  className?: string;
}) => (
  <svg
    viewBox='0 0 24 24'
    className={className}
    aria-hidden='true'
    strokeLinejoin='round'
    strokeLinecap='round'
  >
    {category === 'bullet' && (
      <g transform='rotate(45 12 12)'>
        <path
          d='M9.3 21v-8.5h5.4V21z'
          fill='#c98a1c'
          stroke={OUT}
          strokeWidth='1.5'
        />
        <path
          d='M9.3 12.5C9.3 7.5 12 3 12 3s2.7 4.5 2.7 9.5z'
          fill='#d98a5a'
          stroke={OUT}
          strokeWidth='1.5'
        />
        <path d='M9.3 18.5h5.4' stroke={OUT} strokeWidth='1.2' />
        <path
          d='M11 6.5c-.4 1.2-.6 2.6-.6 4'
          fill='none'
          stroke='#f3c19d'
          strokeWidth='1'
        />
      </g>
    )}
    {category === 'blitz' && (
      <>
        <path
          d='M14.5 2 5 14h6.2L9 22l10-12.5h-6.3z'
          fill='#ffd27a'
          stroke={OUT}
          strokeWidth='1.5'
        />
        <path d='M13 5.5 8.2 12' stroke='#fff3cc' strokeWidth='1.1' />
      </>
    )}
    {category === 'rapid' && (
      <>
        <circle
          cx='12'
          cy='13.5'
          r='7.8'
          fill='#8fd16a'
          stroke={OUT}
          strokeWidth='1.5'
        />
        <circle
          cx='12'
          cy='13.5'
          r='5.3'
          fill='#f2ecdc'
          stroke={OUT}
          strokeWidth='1'
        />
        <path
          d='M12 13.5V10M12 13.5l2.2 1.4M10 3h4M12 3v2.7M18.3 6.8l1.4-1.4'
          fill='none'
          stroke={OUT}
          strokeWidth='1.5'
        />
      </>
    )}
    {category === 'daily' && (
      <>
        {/* rays drawn twice: a dark outline under the gold */}
        <path d={SUN_RAYS} stroke={OUT} strokeWidth='3.2' />
        <path d={SUN_RAYS} stroke='#ffd27a' strokeWidth='1.7' />
        <circle
          cx='12'
          cy='12'
          r='5.4'
          fill='#ffd27a'
          stroke={OUT}
          strokeWidth='1.5'
        />
        <path
          d='M9.6 10.5a2.8 2.8 0 0 1 2.4-1.6'
          fill='none'
          stroke='#fff3cc'
          strokeWidth='1.1'
        />
      </>
    )}
  </svg>
);

// A game's time control beside its other details
export const TimeControlTag = ({ id }: { id: string | null }) => {
  const control = timeControlOf(id);
  if (!control) return null;
  return (
    <span className='inline-flex flex-none items-center gap-1 text-[13px] text-[#a29e96]'>
      <CategoryIcon category={control.category} className='block size-4' />
      {control.label}
    </span>
  );
};

const KEY = 'remorse-chess:time-control';

// The lobby's time control, remembered on this device
export const useTimeControlSetting = () => {
  const [timeControl, setTimeControl] = useState(DEFAULT_TIME_CONTROL);
  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY);
      if (isTimeControl(saved)) setTimeControl(saved);
    } catch {
      // storage blocked: the default it is
    }
  }, []);
  const set = (value: string) => {
    setTimeControl(value);
    try {
      localStorage.setItem(KEY, value);
    } catch {
      // storage blocked: remembered for this visit only
    }
  };
  return [timeControl, set] as const;
};

// The chips the lobby always shows; the rest are a tap on … away
const FEATURED = ['2+1', '5+0', '10+0', '3d'];

const chip =
  'flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border-2 bg-[#262421] px-2 py-1.5 text-[15px] font-semibold whitespace-nowrap text-[#e8e4dc] hover:bg-[#302d29]';

// A few time controls as chips, plus … for every other one. Shows your
// rating for the picked control's category.
export const TimeControlChips = ({
  value,
  onChange,
  ratings,
}: {
  value: string;
  onChange: (id: string) => void;
  ratings: Record<TimeCategory, number> | undefined;
}) => {
  const [moreOpen, setMoreOpen] = useState(false);
  const current = timeControlOf(value);
  const featured = TIME_CONTROLS.filter((control) =>
    FEATURED.includes(control.id),
  );
  // A pick from … shows on the … chip itself
  const other = current && !FEATURED.includes(current.id) ? current : null;

  return (
    <div className='mb-3.5'>
      <div className='mb-2 flex items-center gap-1.5 text-sm text-[#a29e96]'>
        Time control
        {current && (
          <span className='ml-auto flex items-center gap-1.5'>
            <CategoryIcon
              category={current.category}
              className='block size-4'
            />
            {CATEGORY_NAMES[current.category]}
            {ratings && (
              <span className='font-semibold text-[#e8e4dc] tabular-nums'>
                {ratings[current.category]}
              </span>
            )}
          </span>
        )}
      </div>
      <div className='flex gap-1.5'>
        {featured.map((control) => (
          <button
            key={control.id}
            type='button'
            aria-pressed={control.id === value}
            onClick={() => onChange(control.id)}
            className={cn(
              chip,
              control.id === value ? 'border-[#8fd16a]' : 'border-transparent',
            )}
          >
            <CategoryIcon
              category={control.category}
              className='block size-4 max-[400px]:hidden'
            />
            {control.label}
          </button>
        ))}
        <Dialog open={moreOpen} onOpenChange={setMoreOpen}>
          <DialogTrigger asChild>
            <button
              type='button'
              aria-label={
                other
                  ? `${other.label}, more time controls`
                  : 'More time controls'
              }
              title='More time controls'
              className={cn(
                chip,
                'flex-none px-3',
                other ? 'border-[#8fd16a]' : 'border-transparent',
              )}
            >
              {other?.label}…
            </button>
          </DialogTrigger>
          <DialogContent className='max-w-[calc(100%-32px)] gap-4 rounded-2xl border-[#3a3733] bg-[#262421] p-5 font-sans text-[#e8e6e1] sm:max-w-md sm:rounded-2xl [&>button]:text-[#a29e96]'>
            <DialogTitle className='text-lg font-bold text-white'>
              Time control
            </DialogTitle>
            <DialogDescription className='sr-only'>
              Pick a time control for new games.
            </DialogDescription>
            <TimeControlGrid
              value={value}
              ratings={ratings}
              onChange={(id) => {
                onChange(id);
                setMoreOpen(false);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

// Every time control by category, each with your rating when given
export const TimeControlGrid = ({
  value,
  onChange,
  ratings,
}: {
  value: string;
  onChange: (id: string) => void;
  ratings?: Record<TimeCategory, number>;
}) => (
  <div className='flex flex-col gap-3 text-left'>
    {TIME_CATEGORIES.map((category) => (
      <div key={category}>
        <div className='mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-[#e8e4dc]'>
          <CategoryIcon category={category} className='block size-4' />
          {CATEGORY_NAMES[category]}
          {ratings && (
            <span className='font-normal text-[#a29e96] tabular-nums'>
              {ratings[category]}
            </span>
          )}
        </div>
        <div className='grid grid-cols-3 gap-2'>
          {TIME_CONTROLS.filter((control) => control.category === category).map(
            (control) => (
              <button
                key={control.id}
                type='button'
                aria-pressed={control.id === value}
                onClick={() => onChange(control.id)}
                className={cn(
                  'cursor-pointer rounded-lg border-2 bg-[#302d29] py-2 text-[15px] font-semibold text-[#e8e4dc] hover:bg-[#3a3733]',
                  control.id === value
                    ? 'border-[#8fd16a]'
                    : 'border-transparent',
                )}
              >
                {control.label}
              </button>
            ),
          )}
        </div>
      </div>
    ))}
  </div>
);

// Asks for the time control before challenging someone; starts from the
// lobby's and remembers the pick
export const ChallengeDialog = ({
  open,
  onOpenChange,
  name,
  busy,
  error,
  onChallenge,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  name: string;
  busy: boolean;
  error: string | null;
  onChallenge: (timeControl: string) => void;
}) => {
  const [timeControl, setTimeControl] = useTimeControlSetting();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-[calc(100%-32px)] gap-4 rounded-2xl border-[#3a3733] bg-[#262421] p-5 font-sans text-[#e8e6e1] sm:max-w-md sm:rounded-2xl [&>button]:text-[#a29e96]'>
        <DialogTitle className='text-lg font-bold text-white'>
          Challenge {name}
        </DialogTitle>
        <DialogDescription className='sr-only'>
          Pick a time control for the game.
        </DialogDescription>
        <TimeControlGrid value={timeControl} onChange={setTimeControl} />
        {error && <p className='text-sm text-red-300'>{error}</p>}
        <div className='flex'>
          <button
            type='button'
            className={cn(goldButton, buttonMd, 'flex-1')}
            disabled={busy}
            onClick={() => onChallenge(timeControl)}
          >
            Challenge · {timeControlOf(timeControl)?.label}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
