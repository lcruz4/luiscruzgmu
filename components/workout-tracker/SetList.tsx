import { Plus } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { type DraftSet, plannedSet } from '@/lib/workout/sets';
import type { DayExercise } from '@/types/workout';
import { SET_GRID, SetRowEditor } from './SetRowEditor';
import { labelClass } from './styles';

// PUT log accepts up to 20 sets
const MAX_SETS = 20;

interface SetListProps {
  exercise: DayExercise;
  sets: DraftSet[];
  saved: boolean;
  onChange: (sets: DraftSet[]) => void;
}

export const SetList = ({ exercise, sets, saved, onChange }: SetListProps) => {
  // One set's note panel open at a time, by row index
  const [openNote, setOpenNote] = useState<number>();

  return (
    <>
      <div className='flex flex-col gap-2'>
        <div aria-hidden className={cn(SET_GRID, labelClass)}>
          <span className='text-center'>Set</span>
          <span>Weight</span>
          <span className='text-center'>
            {exercise.isTimed ? 'Sec' : 'Reps'}
          </span>
          <span />
        </div>
        {sets.map((set, index) => (
          <SetRowEditor
            // Rows have no ids until saved; removing one closes the note panel
            key={index}
            setNumber={index + 1}
            set={set}
            saved={saved}
            isTimed={exercise.isTimed}
            planWeight={exercise.weight}
            noteOpen={openNote === index}
            onToggleNote={() =>
              setOpenNote(openNote === index ? undefined : index)
            }
            onChange={(changed) =>
              onChange(sets.map((row, i) => (i === index ? changed : row)))
            }
            onRemove={() => {
              setOpenNote(undefined);
              onChange(sets.filter((_row, i) => i !== index));
            }}
          />
        ))}
      </div>
      {sets.length < MAX_SETS && (
        <button
          type='button'
          onClick={() => onChange([...sets, plannedSet(exercise)])}
          className='mr-1 flex h-11 cursor-pointer items-center justify-center gap-1.5 rounded-[12px] border border-dashed border-mist-dashed text-[15px] font-bold text-mist-cyan-text'
        >
          <Plus size={18} strokeWidth={2.5} aria-hidden />
          Add set
        </button>
      )}
    </>
  );
};
