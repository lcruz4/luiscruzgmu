import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DAY_TITLES, longDate } from './format';

interface DayHeaderProps {
  date: string;
  today: string | undefined;
  week: number;
  day: number;
}

export const DayHeader = ({ date, today, week, day }: DayHeaderProps) => (
  <header
    className={cn(
      'flex items-end justify-between gap-3 border-b-2 bg-mist-header px-4 pt-5 pb-4',
      week === 2 ? 'border-mist-pink' : 'border-mist-cyan-line',
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
      <div className='text-[15px] font-semibold text-mist-muted'>
        {DAY_TITLES[day - 1]}
      </div>
    </div>
    {/* Week/day picker comes in 4c */}
    <button
      type='button'
      disabled
      className='inline-flex h-11 shrink-0 items-center gap-1.5 rounded-[12px] border border-mist-line bg-mist-raised pr-3 pl-3.5 text-[15px] font-bold text-mist-text disabled:opacity-50'
    >
      Change
      <ChevronDown size={18} strokeWidth={2.25} aria-hidden />
    </button>
  </header>
);
