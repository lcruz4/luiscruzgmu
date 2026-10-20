import { Check, ChevronDown, ChevronUp, Timer } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PASS_FAIL_WEEK } from '@/lib/workout/schedule';
import type { DayExercise } from '@/types/workout';
import { ExerciseLogFields } from './ExerciseLogFields';
import { setsText, shortDate, targetText } from './format';
import { SetList } from './SetList';

interface ExerciseCardProps {
  exercise: DayExercise;
  date: string;
  week: number;
  open: boolean;
  onToggle: () => void;
  /** Collapse this card and open the next one (D44, UI-only) */
  onFinish: () => void;
}

const cardClass = 'rounded-2xl border bg-mist-surface shadow-mist-card';
const badgeClass =
  'flex size-7 shrink-0 items-center justify-center rounded-full border-2 font-num text-[13px] font-bold';
const labelClass =
  'text-[11px] font-bold tracking-[0.08em] text-mist-muted uppercase';

const pillClass =
  'rounded-full px-2 py-0.5 text-[11px] font-extrabold tracking-[0.06em] text-mist-ink uppercase';

export const ExerciseCard = ({
  exercise,
  date,
  week,
  open,
  onToggle,
  onFinish,
}: ExerciseCardProps) => {
  const { name, position, isTimed, last, log } = exercise;

  if (!open) {
    return (
      <section className={cn(cardClass, 'border-mist-line')}>
        <button
          type='button'
          aria-expanded={false}
          onClick={onToggle}
          className='flex w-full cursor-pointer items-center gap-3 py-3.5 pr-3 pl-4 text-left'
        >
          {log ? (
            <span
              aria-label='Logged'
              className='flex size-7 shrink-0 items-center justify-center rounded-full bg-mist-cyan text-mist-ink'
            >
              <Check size={16} strokeWidth={3} aria-hidden />
            </span>
          ) : (
            <span
              className={cn(badgeClass, 'border-mist-line text-mist-muted')}
            >
              {position}
            </span>
          )}
          <span className='flex min-w-0 flex-1 flex-col gap-0.5'>
            <span className='text-base leading-[22px] font-bold'>{name}</span>
            {log ? (
              <span className='flex items-center gap-2'>
                <span className='font-num text-sm font-bold text-mist-cyan-text'>
                  {setsText(log.sets, isTimed)}
                </span>
                {log.passed !== null && (
                  <span
                    className={cn(
                      pillClass,
                      log.passed ? 'bg-mist-cyan' : 'bg-mist-pink',
                    )}
                  >
                    {log.passed ? 'Pass' : 'Fail'}
                  </span>
                )}
              </span>
            ) : (
              <span className='font-num text-sm font-medium text-mist-muted'>
                {targetText(exercise)}
              </span>
            )}
          </span>
          <span className='flex size-8 items-center justify-center text-mist-muted'>
            <ChevronDown size={20} strokeWidth={2.25} aria-hidden />
          </span>
        </button>
      </section>
    );
  }

  const week2 = week === PASS_FAIL_WEEK;
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
      <div className='mr-1 h-px bg-mist-line' />
      <SetList exercise={exercise} date={date} />
      <ExerciseLogFields exercise={exercise} date={date} week={week} />
      <button
        type='button'
        onClick={onFinish}
        className='mr-1 flex h-12 cursor-pointer items-center justify-center gap-2 rounded-[12px] bg-mist-cyan text-[15px] font-extrabold text-mist-ink'
      >
        <Check size={18} strokeWidth={3} aria-hidden />
        Finish exercise
      </button>
    </section>
  );
};
