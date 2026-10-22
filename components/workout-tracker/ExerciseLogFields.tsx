import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PASS_FAIL_WEEK } from '@/lib/workout/schedule';
import type { ExerciseDraft } from '@/lib/workout/sets';
import { labelClass } from './styles';

interface ExerciseLogFieldsProps {
  planExerciseId: number;
  week: number;
  notes: string;
  passed: boolean | null;
  onChange: (patch: Partial<ExerciseDraft>) => void;
}

// Exercise note + the Week 2 pass/fail check (D15)
export const ExerciseLogFields = ({
  planExerciseId,
  week,
  notes,
  passed,
  onChange,
}: ExerciseLogFieldsProps) => {
  const checkButton = (value: boolean) => {
    const pressed = passed === value;
    return (
      <button
        type='button'
        aria-pressed={pressed}
        // Tapping the pressed one clears it
        onClick={() => onChange({ passed: pressed ? null : value })}
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
        <label htmlFor={`note-${planExerciseId}`} className={labelClass}>
          Exercise note
        </label>
        <input
          id={`note-${planExerciseId}`}
          value={notes}
          placeholder='Optional'
          maxLength={1000}
          onChange={(event) => onChange({ notes: event.target.value })}
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
    </>
  );
};
