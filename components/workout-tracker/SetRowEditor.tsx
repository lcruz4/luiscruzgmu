import { MessageSquare, Trash2 } from 'lucide-react';
import { type KeyboardEvent, useState } from 'react';
import { cn } from '@/lib/utils';
import type { SetRow } from '@/lib/workout/sets';
import { isPounds } from './format';
import { SaveStatus } from './SaveStatus';
import { useLogMutations } from './useLogMutations';

interface SetRowEditorProps {
  row: SetRow;
  planExerciseId: number;
  date: string;
  planReps: number;
  planWeight: string | null;
  isTimed: boolean;
  /** Drafts can only be removed from the end, beyond the plan's sets */
  canRemoveDraft: boolean;
  /** renumbered: a saved set was deleted, so later sets moved up one */
  onRemoved: (renumbered: boolean) => void;
}

export const SET_GRID = 'grid grid-cols-[32px_minmax(0,1fr)_88px_44px] gap-2';

const inputClass =
  'box-border h-[52px] w-full rounded-[12px] border border-mist-line bg-mist-raised font-num text-[22px] font-bold text-mist-text placeholder:font-medium placeholder:text-mist-muted';

const blurOnEnter = (event: KeyboardEvent<HTMLInputElement>) => {
  if (event.key === 'Enter') event.currentTarget.blur();
};

export const SetRowEditor = ({
  row,
  planExerciseId,
  date,
  planReps,
  planWeight,
  isTimed,
  canRemoveDraft,
  onRemoved,
}: SetRowEditorProps) => {
  const { setNumber } = row;
  const { saveSet, deleteSet } = useLogMutations(planExerciseId, date);
  const [weight, setWeight] = useState(row.weight ?? '');
  const [reps, setReps] = useState(row.reps === null ? '' : String(row.reps));
  const [notes, setNotes] = useState(row.notes ?? '');
  const [noteOpen, setNoteOpen] = useState(false);

  const saved = row.id !== null;
  const values = {
    setNumber,
    weight: weight.trim() || null,
    reps: reps === '' ? null : Number(reps),
    notes: notes.trim() || null,
  };

  // A draft saves once reps are entered (D44); a saved set saves any change
  const commit = () => {
    const unchanged =
      values.weight === row.weight &&
      values.reps === row.reps &&
      values.notes === row.notes;
    if (saved ? unchanged : values.reps === null) return;
    saveSet.mutate(values);
  };

  const remove = () => {
    if (saved) {
      deleteSet.mutate(setNumber, { onSuccess: () => onRemoved(true) });
    } else {
      onRemoved(false);
    }
  };

  const repsLabel = isTimed ? 'seconds' : 'reps';

  return (
    <div className='flex flex-col gap-2'>
      <div className={cn(SET_GRID, 'items-center')}>
        <span
          aria-label={`Set ${setNumber}, ${saved ? 'saved' : 'not logged yet'}`}
          className={cn(
            'flex size-8 items-center justify-center rounded-full font-num text-sm font-bold',
            saved
              ? 'bg-mist-cyan text-mist-ink'
              : 'border-2 border-mist-line text-mist-muted',
          )}
        >
          {setNumber}
        </span>
        <div className='relative'>
          <input
            aria-label={`Set ${setNumber} weight`}
            value={weight}
            placeholder='BW'
            // Free text (bands, BW); the number pad only when the plan weight is lb
            inputMode={planWeight && isPounds(planWeight) ? 'decimal' : 'text'}
            maxLength={50}
            onChange={(event) => setWeight(event.target.value)}
            onBlur={commit}
            onKeyDown={blurOnEnter}
            className={cn(
              inputClass,
              'pl-3.5',
              isPounds(weight) ? 'pr-[34px]' : 'pr-3.5',
            )}
          />
          {isPounds(weight) && (
            <span className='pointer-events-none absolute top-[17px] right-3 text-[13px] font-semibold text-mist-muted'>
              lb
            </span>
          )}
        </div>
        <input
          aria-label={`Set ${setNumber} ${repsLabel}`}
          value={reps}
          // A saved set with its reps cleared is stored without reps
          placeholder={saved ? '–' : String(planReps)}
          inputMode='numeric'
          pattern='[0-9]*'
          maxLength={4}
          onChange={(event) => setReps(event.target.value.replace(/\D/g, ''))}
          onBlur={commit}
          onKeyDown={blurOnEnter}
          className={cn(inputClass, 'text-center')}
        />
        <button
          type='button'
          aria-label={`${
            noteOpen ? 'Hide' : 'Show'
          } set ${setNumber} note and options`}
          aria-expanded={noteOpen}
          onClick={() => setNoteOpen(!noteOpen)}
          className={cn(
            'flex size-11 cursor-pointer items-center justify-center rounded-[12px]',
            noteOpen && 'bg-mist-raised',
            noteOpen || notes ? 'text-mist-cyan-text' : 'text-mist-muted',
          )}
        >
          <MessageSquare size={20} strokeWidth={2} aria-hidden />
        </button>
      </div>
      {noteOpen && (
        <div className='flex items-center gap-2 pl-10'>
          <input
            aria-label={`Set ${setNumber} note`}
            value={notes}
            placeholder='Set note'
            maxLength={1000}
            onChange={(event) => setNotes(event.target.value)}
            onBlur={commit}
            onKeyDown={blurOnEnter}
            className='box-border h-11 min-w-0 flex-1 rounded-[10px] border border-mist-line bg-mist-raised px-3 text-base font-medium text-mist-text placeholder:text-mist-muted'
          />
          {(saved || canRemoveDraft) && (
            <button
              type='button'
              aria-label={`Remove set ${setNumber}`}
              onClick={remove}
              className='flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-[10px] border border-mist-line text-mist-warn-text'
            >
              <Trash2 size={18} strokeWidth={2} aria-hidden />
            </button>
          )}
        </div>
      )}
      <SaveStatus
        error={saveSet.error ?? deleteSet.error}
        paused={saveSet.isPaused || deleteSet.isPaused}
        onRetry={saveSet.isError ? commit : remove}
        className='pl-10'
      />
    </div>
  );
};
