import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { DAY_TITLES, longDate } from './format';
import { accentBorder } from './styles';

interface DayHeaderProps {
  date: string;
  today: string | undefined;
  week: number;
  day: number;
  /** The Change button */
  children: ReactNode;
}

export const DayHeader = ({
  date,
  today,
  week,
  day,
  children,
}: DayHeaderProps) => (
  <header
    className={cn(
      'flex items-end justify-between gap-3 border-b-2 bg-mist-header px-4 pt-5 pb-4',
      accentBorder(week),
    )}
  >
    <div className='flex min-w-0 flex-col gap-1'>
      <div className='flex items-center gap-2 text-xs font-bold tracking-[0.08em] text-mist-muted uppercase'>
        <span>{longDate(date)}</span>
        {date === today && (
          <span className='rounded-full bg-mist-cyan px-2 py-0.5 tracking-[0.04em] text-mist-ink'>
            Today
          </span>
        )}
      </div>
      <h1 className='m-0 text-[26px] leading-8 font-extrabold'>
        Week {week} · Day {day}
      </h1>
      <div className='flex flex-wrap items-center gap-x-2 gap-y-1 text-[15px] font-semibold text-mist-muted'>
        <span>{DAY_TITLES[day - 1]}</span>
      </div>
    </div>
    {children}
  </header>
);
