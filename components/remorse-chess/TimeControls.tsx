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
          d='M9 20V10c0-4 3-7 3-7s3 3 3 7v10z'
          fill='#e8a33c'
          stroke={OUT}
          strokeWidth='1.6'
        />
        <path d='M9 16h6' stroke={OUT} strokeWidth='1.4' />
      </g>
    )}
    {category === 'blitz' && (
      <path
        d='M14 2L5 14h6l-2 8 9-12h-6z'
        fill='#ffd27a'
        stroke={OUT}
        strokeWidth='1.6'
      />
    )}
    {category === 'rapid' && (
      <>
        <circle
          cx='12'
          cy='13.5'
          r='8'
          fill='#8fd16a'
          stroke={OUT}
          strokeWidth='1.6'
        />
        <path
          d='M12 13.5V9M10 3h4M12 3v2.5'
          fill='none'
          stroke={OUT}
          strokeWidth='1.6'
        />
      </>
    )}
    {category === 'daily' && (
      <>
        <path
          d='M12 1.5v3M12 19.5v3M1.5 12h3M19.5 12h3M4.6 4.6l2.1 2.1M17.3 17.3l2.1 2.1M4.6 19.4l2.1-2.1M17.3 6.7l2.1-2.1'
          stroke='#ffd27a'
          strokeWidth='2'
        />
        <circle
          cx='12'
          cy='12'
          r='5.5'
          fill='#ffd27a'
          stroke={OUT}
          strokeWidth='1.6'
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
