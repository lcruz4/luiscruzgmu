import * as Dialog from '@radix-ui/react-dialog';
import { useQueryClient } from '@tanstack/react-query';
import { ChevronDown, X } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  autoNext,
  PASS_FAIL_WEEK,
  type WeekDay,
  WEEKS,
} from '@/lib/workout/schedule';
import type { DayResponse } from '@/types/workout';
import { DAY_TITLES, shortDate } from './format';
import { accentBorder, labelClass } from './styles';
import type { Selection } from './useSelection';

const WEEK_NUMBERS = Array.from({ length: WEEKS }, (_, index) => index + 1);

interface DayPickerProps {
  shown: DayResponse;
  today: string | undefined;
  onPick: (selection: Selection) => void;
}

// Change button + bottom sheet. A tile opens that week/day on the date it was
// last done; the Next tile, and one never done, open today.
export const DayPicker = ({ shown, today, onPick }: DayPickerProps) => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const next = today ? autoNext(shown.lastDone.at(0), today) : undefined;

  const changeOpen = (value: boolean) => {
    setOpen(value);
    // A save only patches the shown day's exercises, so lastDone may be old
    if (value) {
      queryClient.refetchQueries({
        queryKey: ['workout-tracker', 'day'],
        type: 'active',
      });
    }
  };

  const pick = (weekDay: WeekDay, lastDate: string | undefined) => {
    setOpen(false);
    if (weekDay.week === next?.week && weekDay.day === next.day) onPick({});
    else onPick({ weekDay, date: lastDate === today ? undefined : lastDate });
  };

  return (
    <Dialog.Root open={open} onOpenChange={changeOpen}>
      <Dialog.Trigger asChild>
        <button
          type='button'
          className='inline-flex h-11 shrink-0 cursor-pointer items-center gap-1.5 rounded-[12px] border border-mist-line bg-mist-raised pr-3 pl-3.5 text-[15px] font-bold text-mist-text'
        >
          Change
          <ChevronDown size={18} strokeWidth={2.25} aria-hidden />
        </button>
      </Dialog.Trigger>
      {/* No portal: the sheet stays inside the layout's font variables */}
      <Dialog.Overlay className='fixed inset-0 z-50 bg-mist-text/45' />
      <Dialog.Content
        aria-describedby={undefined}
        className='fixed inset-x-0 bottom-0 z-50 mx-auto flex max-w-md flex-col gap-4 rounded-t-[24px] border-t border-mist-line bg-mist-surface px-4 pt-2.5 pb-[max(24px,env(safe-area-inset-bottom))]'
      >
        <div
          aria-hidden
          className='h-1 w-10 self-center rounded-full bg-mist-dashed'
        />
        <div className='-mt-1 flex items-center justify-between'>
          <Dialog.Title className='m-0 text-xl font-extrabold'>
            Pick a workout
          </Dialog.Title>
          <Dialog.Close
            aria-label='Close'
            className='-mr-2 flex size-11 cursor-pointer items-center justify-center rounded-[12px] text-mist-muted'
          >
            <X size={22} strokeWidth={2.25} aria-hidden />
          </Dialog.Close>
        </div>
        {WEEK_NUMBERS.map((week) => (
          <div key={week} className='flex flex-col gap-2'>
            <div className={cn(labelClass, 'flex items-center gap-2')}>
              <span
                className={cn(
                  'size-2 rounded-full',
                  week === PASS_FAIL_WEEK ? 'bg-mist-pink' : 'bg-mist-cyan',
                )}
              />
              Week {week}
              {week === PASS_FAIL_WEEK && ' · pass/fail'}
            </div>
            <div className='grid grid-cols-4 gap-2'>
              {DAY_TITLES.map((title, index) => {
                const day = index + 1;
                const shortTitle = title.split(' · ')[0];
                const lastDate = shown.lastDone.find(
                  (done) => done.week === week && done.day === day,
                )?.date;
                const current = week === shown.week && day === shown.day;
                return (
                  <button
                    key={day}
                    type='button'
                    aria-current={current || undefined}
                    aria-label={`Week ${week} Day ${day}, ${shortTitle}, ${
                      lastDate
                        ? `last done ${shortDate(lastDate)}`
                        : 'not done yet'
                    }`}
                    onClick={() => pick({ week, day }, lastDate)}
                    className={cn(
                      'relative flex h-21 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-[14px] border border-mist-line bg-mist-raised px-1 pt-2.5 pb-2',
                      current && [
                        'border-2',
                        accentBorder(week),
                        week === PASS_FAIL_WEEK
                          ? 'bg-mist-pink/15'
                          : 'bg-mist-cyan/15',
                      ],
                    )}
                  >
                    {week === next?.week && day === next.day && (
                      <span className='absolute -top-[9px] rounded-full bg-mist-cyan px-[7px] py-px text-[10px] font-extrabold tracking-[0.06em] text-mist-ink uppercase'>
                        Next
                      </span>
                    )}
                    <span className='text-[15px] font-extrabold'>
                      Day {day}
                    </span>
                    <span className='text-xs font-semibold text-mist-muted'>
                      {shortTitle}
                    </span>
                    <span className='font-num text-xs font-medium text-mist-muted'>
                      {lastDate ? shortDate(lastDate) : '–'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </Dialog.Content>
    </Dialog.Root>
  );
};
