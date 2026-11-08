import { Check, ChevronDown, ChevronUp, X } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { labelClass } from './styles';

interface ExerciseLogFieldsProps {
  planExerciseId: number;
  notes: string;
  passed: boolean | null;
  /** Opens the panel when the card opens */
  defaultOpen: boolean;
  onNotesChange: (notes: string) => void;
  /** Saves right away */
  onPassedChange: (passed: boolean | null) => void;
}

// Exercise note + pass/fail check, behind a toggle
export const ExerciseLogFields = ({
  planExerciseId,
  notes,
  passed,
  defaultOpen,
  onNotesChange,
  onPassedChange,
}: ExerciseLogFieldsProps) => {
  const [open, setOpen] = useState(defaultOpen);
  const checkButton = (value: boolean) => {
    const pressed = passed === value;
    return (
      <button
        type='button'
        aria-pressed={pressed}
        // Tapping the pressed one clears it
        onClick={() => onPassedChange(pressed ? null : value)}
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

  if (!open) {
    return (
      <button
        type='button'
        aria-expanded={false}
        onClick={() => setOpen(true)}
        className='mr-1 flex h-11 cursor-pointer items-center justify-between rounded-[12px] border border-dashed border-mist-line px-3 text-[13px] font-bold text-mist-muted'
      >
        Pass/fail · Note
        <ChevronDown size={16} strokeWidth={2.5} aria-hidden />
      </button>
    );
  }

  return (
    <div className='mr-1 flex flex-col gap-3 rounded-[12px] border border-dashed border-mist-line p-3'>
      <button
        type='button'
        aria-expanded
        onClick={() => setOpen(false)}
        className='flex cursor-pointer items-center justify-between text-[13px] font-bold text-mist-muted'
      >
        Pass/fail · Note
        <ChevronUp size={16} strokeWidth={2.5} aria-hidden />
      </button>
      <div className='flex flex-col gap-1.5'>
        <label htmlFor={`note-${planExerciseId}`} className={labelClass}>
          Exercise note
        </label>
        <input
          id={`note-${planExerciseId}`}
          value={notes}
          placeholder='Optional'
          maxLength={1000}
          onChange={(event) => onNotesChange(event.target.value)}
          className='box-border h-12 w-full rounded-[12px] border border-mist-line bg-mist-raised px-3.5 text-base font-medium text-mist-text placeholder:text-mist-muted'
        />
      </div>
      <fieldset className='m-0 flex flex-col gap-1.5 border-0 p-0'>
        <div className='relative grid h-12 grid-cols-2 rounded-[12px] border border-mist-line bg-mist-raised p-1'>
          <span
            aria-hidden
            className='absolute inset-y-3 left-1/2 w-px -translate-x-1/2 bg-mist-line'
          />
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
    </div>
  );
};
