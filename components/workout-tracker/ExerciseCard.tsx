import { ChevronDown, ChevronUp, Timer } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DayExercise } from '@/types/workout';
import { setsText, shortDate, targetText } from './format';

interface ExerciseCardProps {
  exercise: DayExercise;
  week: number;
  open: boolean;
  onToggle: () => void;
}

const cardClass = 'rounded-2xl border bg-mist-surface shadow-mist-card';
const badgeClass =
  'flex size-7 shrink-0 items-center justify-center rounded-full border-2 font-num text-[13px] font-bold';
const labelClass =
  'text-[11px] font-bold tracking-[0.08em] text-mist-muted uppercase';

export const ExerciseCard = ({
  exercise,
  week,
  open,
  onToggle,
}: ExerciseCardProps) => {
  const { name, position, isTimed, last } = exercise;

  if (!open) {
    return (
      <section className={cn(cardClass, 'border-mist-line')}>
        <button
          type='button'
          aria-expanded={false}
          onClick={onToggle}
          className='flex w-full cursor-pointer items-center gap-3 py-3.5 pr-3 pl-4 text-left'
        >
          <span className={cn(badgeClass, 'border-mist-line text-mist-muted')}>
            {position}
          </span>
          <span className='flex min-w-0 flex-1 flex-col gap-0.5'>
            <span className='text-base leading-[22px] font-bold'>{name}</span>
            <span className='font-num text-sm font-medium text-mist-muted'>
              {targetText(exercise)}
            </span>
          </span>
          <span className='flex size-8 items-center justify-center text-mist-muted'>
            <ChevronDown size={20} strokeWidth={2.25} aria-hidden />
          </span>
        </button>
      </section>
    );
  }

  const week2 = week === 2;
  return (
    <section
      aria-label={name}
      className={cn(
        cardClass,
        'flex flex-col gap-3 pt-3.5 pr-3 pb-4 pl-4',
        week2 ? 'border-mist-pink' : 'border-mist-cyan-line',
      )}
    >
      <div className='flex items-center gap-3'>
        <span
          className={cn(
            badgeClass,
            week2
              ? 'border-mist-pink text-mist-pink-text'
              : 'border-mist-cyan-line text-mist-cyan-text',
          )}
        >
          {position}
        </span>
        <h2 className='m-0 flex-1 text-lg leading-6 font-extrabold'>{name}</h2>
        {isTimed && (
          <span className='inline-flex items-center gap-1 rounded-full border border-mist-line px-2 py-0.5 text-xs font-bold text-mist-muted'>
            <Timer size={14} strokeWidth={2.25} aria-hidden />
            Timed
          </span>
        )}
        <button
          type='button'
          aria-label={`Collapse ${name}`}
          aria-expanded
          onClick={onToggle}
          className='-my-2 -mr-1.5 flex size-11 cursor-pointer items-center justify-center text-mist-muted'
        >
          <ChevronUp size={20} strokeWidth={2.25} aria-hidden />
        </button>
      </div>
      <dl className='m-0 grid grid-cols-[56px_minmax(0,1fr)_auto] items-baseline gap-x-2 gap-y-1.5 pr-1'>
        <dt className={labelClass}>Target</dt>
        <dd className='m-0 font-num text-[15px] font-bold'>
          {targetText(exercise)}
        </dd>
        <dd className='m-0' />
        <dt className={labelClass}>Last</dt>
        <dd className='m-0 font-num text-[15px] font-medium'>
          {last ? setsText(last.sets, isTimed) : 'None yet'}
        </dd>
        <dd className='m-0 text-[13px] font-semibold text-mist-muted'>
          {last && shortDate(last.date)}
        </dd>
      </dl>
    </section>
  );
};
