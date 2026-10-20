import { Plus } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { buildSetRows } from '@/lib/workout/sets';
import type { DayExercise } from '@/types/workout';
import { SET_GRID, SetRowEditor } from './SetRowEditor';

// PUT sets accepts set numbers up to 20
const MAX_SETS = 20;

const headClass =
  'text-[11px] font-bold tracking-[0.08em] text-mist-muted uppercase';

interface SetListProps {
  exercise: DayExercise;
  date: string;
}

export const SetList = ({ exercise, date }: SetListProps) => {
  const [rowCount, setRowCount] = useState(0);
  // Bumped when a saved set is deleted: later sets were renumbered, so every
  // row remounts from the server's sets instead of keeping its local inputs
  const [generation, setGeneration] = useState(0);
  const rows = buildSetRows(exercise, exercise.log?.sets ?? [], rowCount);

  const onRemoved = (renumbered: boolean) => {
    setRowCount(rows.length - 1);
    if (renumbered) setGeneration(generation + 1);
  };

  return (
    <>
      <div className='flex flex-col gap-2'>
        <div aria-hidden className={cn(SET_GRID, headClass)}>
          <span className='text-center'>Set</span>
          <span>Weight</span>
          <span className='text-center'>
            {exercise.isTimed ? 'Sec' : 'Reps'}
          </span>
          <span />
        </div>
        {rows.map((row) => (
          <SetRowEditor
            key={`${generation}-${row.setNumber}`}
            row={row}
            planExerciseId={exercise.id}
            date={date}
            planReps={exercise.reps}
            planWeight={exercise.weight}
            isTimed={exercise.isTimed}
            canRemoveDraft={
              row.setNumber === rows.length && row.setNumber > exercise.sets
            }
            onRemoved={onRemoved}
          />
        ))}
      </div>
      {rows.length < MAX_SETS && (
        <button
          type='button'
          onClick={() => setRowCount(rows.length + 1)}
          className='mr-1 flex h-11 cursor-pointer items-center justify-center gap-1.5 rounded-[12px] border border-dashed border-mist-dashed text-[15px] font-bold text-mist-cyan-text'
        >
          <Plus size={18} strokeWidth={2.5} aria-hidden />
          Add set
        </button>
      )}
    </>
  );
};
