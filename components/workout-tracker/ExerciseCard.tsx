import { Check, ChevronDown, ChevronUp, Save, Timer } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  allSetsSaved,
  detailsChanged,
  type ExerciseDraft,
  expectedLog,
  initialDraft,
  savedRows,
  withDetails,
  withSavedSet,
} from '@/lib/workout/sets';
import type { DayExercise } from '@/types/workout';
import { PassFail } from './EntryDetails';
import { ExerciseLogFields } from './ExerciseLogFields';
import { setsText, shortDate, targetText } from './format';
import { SaveStatus } from './SaveStatus';
import { SetList } from './SetList';
import { accentBorder, badgeClass, cardClass, labelClass } from './styles';
import { useSaveLog } from './useSaveLog';

interface ExerciseCardProps {
  exercise: DayExercise;
  date: string;
  week: number;
  open: boolean;
  /** Unsaved inputs, if any were changed since the last save */
  draft: ExerciseDraft | undefined;
  onDraftChange: (draft: ExerciseDraft | null) => void;
  /** A set's save button was tapped (not on Retry) */
  onSetSave: (lastSet: boolean) => void;
  onToggle: () => void;
  /** Collapse this card and open the next one */
  onComplete: () => void;
}

export const ExerciseCard = ({
  exercise,
  date,
  week,
  open,
  draft,
  onDraftChange,
  onSetSave,
  onToggle,
  onComplete,
}: ExerciseCardProps) => {
  const { name, position, isTimed, last, log } = exercise;
  const saveLog = useSaveLog(exercise.id, date);
  // Row of the last set save, so Retry repeats it; undefined → Save
  const [retrySet, setRetrySet] = useState<number>();
  const unsaved = draft !== undefined;

  if (!open) {
    return (
      <section className={cardClass}>
        <button
          type='button'
          aria-expanded={false}
          onClick={onToggle}
          className='flex w-full cursor-pointer items-center gap-3 py-3.5 pr-3 pl-4 text-left'
        >
          {allSetsSaved(log, draft) ? (
            <span
              aria-label='Logged'
              className='flex size-7 shrink-0 items-center justify-center rounded-full bg-mist-cyan text-mist-ink'
            >
              <Check size={16} strokeWidth={3} aria-hidden />
            </span>
          ) : (
            <span className={badgeClass()}>{position}</span>
          )}
          <span className='flex min-w-0 flex-1 flex-col gap-0.5'>
            <span className='text-base leading-[22px] font-bold'>{name}</span>
            {log ? (
              <span className='flex items-center gap-2'>
                <span className='font-num text-sm font-bold text-mist-cyan-text'>
                  {setsText(log.sets, isTimed)}
                </span>
                <PassFail passed={log.passed} />
              </span>
            ) : (
              <span className='font-num text-sm font-medium text-mist-muted'>
                {targetText(exercise)}
              </span>
            )}
            {unsaved && (
              <span className='self-start rounded-full border border-mist-warn-line bg-mist-warn-banner px-2 py-px text-xs font-bold text-mist-warn-text'>
                Not saved
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

  const current = draft ?? initialDraft(exercise);
  const update = (patch: Partial<ExerciseDraft>) =>
    onDraftChange({ ...current, ...patch });

  // Shows as saved right away; a failed save puts the draft back so Retry
  // has it.
  const save = (saving: ExerciseDraft) => {
    const unchanged =
      JSON.stringify(current) ===
      JSON.stringify(
        initialDraft({ ...exercise, log: expectedLog(log, saving) }),
      );
    onDraftChange(unchanged ? null : current);
    saveLog.mutate(saving, { onError: () => onDraftChange(current) });
  };

  // Saves one row; the rest of the card stays a draft. The last row with the
  // rest saved saves the whole card and closes it.
  const saveSet = (index: number) => {
    setRetrySet(index);
    const completes =
      index === current.sets.length - 1 &&
      savedRows(log, current.sets).every((saved, i) => saved || i === index);
    save(completes ? current : withSavedSet(log, current.sets, index));
    if (completes) onComplete();
  };

  // Notes and pass/fail; rows not saved yet stay a draft
  const saveDetails = () => {
    setRetrySet(undefined);
    save(withDetails(log, current));
  };

  return (
    <section
      aria-label={name}
      className={cn(
        cardClass,
        'flex flex-col gap-3 pt-3.5 pr-3 pb-4 pl-4',
        accentBorder(week),
      )}
    >
      <div className='flex items-center gap-3'>
        <span className={badgeClass(week)}>{position}</span>
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
      <SetList
        exercise={exercise}
        sets={current.sets}
        saved={savedRows(log, current.sets)}
        onChange={(sets) => update({ sets })}
        onSave={(index) => {
          saveSet(index);
          onSetSave(index === current.sets.length - 1);
        }}
      />
      <ExerciseLogFields
        planExerciseId={exercise.id}
        notes={current.notes}
        passed={current.passed}
        onChange={update}
      />
      {draft && detailsChanged(log, draft) && (
        <button
          type='button'
          onClick={saveDetails}
          className='mr-1 flex h-12 cursor-pointer items-center justify-center gap-2 rounded-[12px] bg-mist-cyan text-[15px] font-extrabold text-mist-ink'
        >
          <Save size={18} strokeWidth={2.5} aria-hidden />
          Save
        </button>
      )}
      <SaveStatus
        error={saveLog.error}
        paused={saveLog.isPaused}
        onRetry={() =>
          retrySet === undefined ? saveDetails() : saveSet(retrySet)
        }
      />
    </section>
  );
};
