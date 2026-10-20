import { Check, X } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { PASS_FAIL_WEEK } from '@/lib/workout/schedule';
import type { DayExercise } from '@/types/workout';
import { SaveStatus } from './SaveStatus';
import { type LogFields, useLogMutations } from './useLogMutations';

const labelClass =
  'text-[11px] font-bold tracking-[0.08em] text-mist-muted uppercase';

interface ExerciseLogFieldsProps {
  exercise: DayExercise;
  date: string;
  week: number;
}

// Exercise note + the Week 2 pass/fail check (D15). Both go in one PUT log,
// so each save sends the current value of the other.
export const ExerciseLogFields = ({
  exercise,
  date,
  week,
}: ExerciseLogFieldsProps) => {
  const { saveLog } = useLogMutations(exercise.id, date);
  const savedNotes = exercise.log?.notes ?? null;
  const savedPassed = exercise.log?.passed ?? null;
  const [notes, setNotes] = useState(savedNotes ?? '');
  const [passed, setPassed] = useState(savedPassed);

  const save = (fields: LogFields) => {
    if (fields.notes === savedNotes && fields.passed === savedPassed) return;
    saveLog.mutate(fields);
  };
  const notesValue = notes.trim() || null;

  const check = (value: boolean) => {
    const next = passed === value ? null : value;
    setPassed(next);
    save({ passed: next, notes: notesValue });
  };

  const checkButton = (value: boolean) => {
    const pressed = passed === value;
    return (
      <button
        type='button'
        aria-pressed={pressed}
        onClick={() => check(value)}
        className={cn(
          'flex h-12 cursor-pointer items-center justify-center gap-2 rounded-[12px] border text-[15px] font-bold',
          !pressed && 'border-mist-line bg-mist-raised text-mist-text',
          pressed && value && 'border-mist-cyan bg-mist-cyan text-mist-ink',
          pressed && !value && 'border-mist-pink bg-mist-pink text-mist-ink',
        )}
      >
        {value ? (
          <Check size={18} strokeWidth={3} aria-hidden />
        ) : (
          <X size={18} strokeWidth={3} aria-hidden />
        )}
        {value ? 'Pass' : 'Fail'}
      </button>
    );
  };

  return (
    <>
      <div className='mr-1 flex flex-col gap-1.5'>
        <label htmlFor={`note-${exercise.id}`} className={labelClass}>
          Exercise note
        </label>
        <input
          id={`note-${exercise.id}`}
          value={notes}
          placeholder='Optional'
          maxLength={1000}
          onChange={(event) => setNotes(event.target.value)}
          onBlur={() => save({ passed, notes: notesValue })}
          onKeyDown={(event) => {
            if (event.key === 'Enter') event.currentTarget.blur();
          }}
          className='box-border h-12 w-full rounded-[12px] border border-mist-line bg-mist-raised px-3.5 text-base font-medium text-mist-text placeholder:text-mist-muted'
        />
      </div>
      {week === PASS_FAIL_WEEK && (
        <fieldset className='m-0 mr-1 flex flex-col gap-1.5 border-0 p-0'>
          <legend className={cn(labelClass, 'mb-1.5 p-0')}>
            Week {PASS_FAIL_WEEK} check
          </legend>
          <div className='grid grid-cols-2 gap-2'>
            {checkButton(true)}
            {checkButton(false)}
          </div>
        </fieldset>
      )}
      <SaveStatus
        error={saveLog.error}
        paused={saveLog.isPaused}
        onRetry={() => saveLog.mutate({ passed, notes: notesValue })}
      />
    </>
  );
};
