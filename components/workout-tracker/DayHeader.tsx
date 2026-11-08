import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { longDate, weekDayText } from './format';
import { accentBorder } from './styles';

interface DayHeaderProps {
  date: string;
  today: string | undefined;
  week: number;
  day: number;
  /** Weeks in the plan */
  weeks: number;
  /** The plan's title for the day; '' = none */
  title: string;
  /** Every exercise is logged */
  done: boolean;
  /** The header buttons */
  children: ReactNode;
}

export const DayHeader = ({
  date,
  today,
  week,
  day,
  weeks,
  title,
  done,
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
        {done && (
          <span className='rounded-full bg-mist-pink px-2 py-0.5 tracking-[0.04em] text-mist-ink motion-safe:animate-[celebrate-pop_0.4s_cubic-bezier(0.3,1.6,0.5,1)_both]'>
            Done
          </span>
        )}
      </div>
      <h1 className='m-0 text-[26px] leading-8 font-extrabold'>
        {weekDayText(week, day, weeks)}
      </h1>
      {title && (
        <div className='flex flex-wrap items-center gap-x-2 gap-y-1 text-[15px] font-semibold text-mist-muted'>
          <span>{title}</span>
        </div>
      )}
    </div>
    {children}
  </header>
);
