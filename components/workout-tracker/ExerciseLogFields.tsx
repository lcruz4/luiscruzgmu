import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
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
          'relative z-10 flex cursor-pointer items-center justify-center gap-2 text-[15px] font-bold transition-colors',
          pressed ? 'text-mist-ink' : 'text-mist-muted',
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
      <fieldset className='m-0 mr-1 flex flex-col gap-1.5 border-0 p-0'>
        <div className='relative grid h-12 grid-cols-2 rounded-[12px] border border-mist-line bg-mist-raised p-1'>
          <span
            aria-hidden
            className={cn(
              'absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-[9px] transition-[translate,background-color,opacity] duration-200',
              passed === null && 'opacity-0',
              passed === true && 'bg-mist-cyan',
              passed === false && 'translate-x-full bg-mist-pink',
            )}
          />
          {checkButton(true)}
          {checkButton(false)}
        </div>
      </fieldset>
    </>
  );
};
