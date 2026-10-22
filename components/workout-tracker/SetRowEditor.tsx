import { MessageSquare, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DraftSet } from '@/lib/workout/sets';
import { isPounds } from './format';

interface SetRowEditorProps {
  setNumber: number;
  set: DraftSet;
  /** Matches the saved set at this position */
  saved: boolean;
  isTimed: boolean;
  planWeight: string | null;
  noteOpen: boolean;
  onToggleNote: () => void;
  onChange: (set: DraftSet) => void;
  onSave: () => void;
  onRemove: () => void;
}

export const SET_GRID = 'grid grid-cols-[32px_minmax(0,1fr)_88px_44px] gap-2';

const inputClass =
  'box-border h-[52px] w-full rounded-[12px] border border-mist-line bg-mist-raised font-num text-[22px] font-bold text-mist-text placeholder:font-medium placeholder:text-mist-muted';

export const SetRowEditor = ({
  setNumber,
  set,
  saved,
  isTimed,
  planWeight,
  noteOpen,
  onToggleNote,
  onChange,
  onSave,
  onRemove,
}: SetRowEditorProps) => {
  const repsLabel = isTimed ? 'seconds' : 'reps';
  return (
    <div className='flex flex-col gap-2'>
      <div className={cn(SET_GRID, 'items-center')}>
        <button
          type='button'
          aria-label={
            saved ? `Set ${setNumber}, saved` : `Save set ${setNumber}`
          }
          // Rows without reps aren't stored
          disabled={saved || set.reps === ''}
          onClick={onSave}
          className={cn(
            // before: widens the tap target to 44px
            'relative flex size-8 cursor-pointer items-center justify-center rounded-full font-num text-sm font-bold before:absolute before:-inset-1.5 disabled:cursor-default',
            saved
              ? 'bg-mist-cyan text-mist-ink'
              : 'border-2 border-mist-line text-mist-muted',
          )}
        >
          {setNumber}
        </button>
        <div className='relative'>
          <input
            aria-label={`Set ${setNumber} weight`}
            value={set.weight}
            placeholder='BW'
            // Free text (bands, BW); the number pad only when the plan weight is lb
            inputMode={planWeight && isPounds(planWeight) ? 'decimal' : 'text'}
            maxLength={50}
            onChange={(event) =>
              onChange({ ...set, weight: event.target.value })
            }
            className={cn(
              inputClass,
              'pl-3.5',
              isPounds(set.weight) ? 'pr-[34px]' : 'pr-3.5',
            )}
          />
          {isPounds(set.weight) && (
            <span className='pointer-events-none absolute top-[17px] right-3 text-[13px] font-semibold text-mist-muted'>
              lb
            </span>
          )}
        </div>
        <input
          aria-label={`Set ${setNumber} ${repsLabel}`}
          value={set.reps}
          // A row with no reps isn't saved
          placeholder='–'
          inputMode='numeric'
          pattern='[0-9]*'
          maxLength={4}
          onChange={(event) =>
            onChange({ ...set, reps: event.target.value.replace(/\D/g, '') })
          }
          className={cn(inputClass, 'text-center')}
        />
        <button
          type='button'
          aria-label={`${
            noteOpen ? 'Hide' : 'Show'
          } set ${setNumber} note and options`}
          aria-expanded={noteOpen}
          onClick={onToggleNote}
          className={cn(
            'flex size-11 cursor-pointer items-center justify-center rounded-[12px]',
            noteOpen && 'bg-mist-raised',
            noteOpen || set.notes ? 'text-mist-cyan-text' : 'text-mist-muted',
          )}
        >
          <MessageSquare size={20} strokeWidth={2} aria-hidden />
        </button>
      </div>
      {noteOpen && (
        <div className='flex items-center gap-2 pl-10'>
          <input
            aria-label={`Set ${setNumber} note`}
            value={set.notes}
            placeholder='Set note'
            maxLength={1000}
            onChange={(event) =>
              onChange({ ...set, notes: event.target.value })
            }
            className='box-border h-11 min-w-0 flex-1 rounded-[10px] border border-mist-line bg-mist-raised px-3 text-base font-medium text-mist-text placeholder:text-mist-muted'
          />
          <button
            type='button'
            aria-label={`Remove set ${setNumber}`}
            onClick={onRemove}
            className='flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-[10px] border border-mist-line text-mist-warn-text'
          >
            <Trash2 size={18} strokeWidth={2} aria-hidden />
          </button>
        </div>
      )}
    </div>
  );
};
