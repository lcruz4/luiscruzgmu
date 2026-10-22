import { useState } from 'react';
import { cn } from '@/lib/utils';
import { type DraftSet } from '@/lib/workout/sets';
import type { DayExercise } from '@/types/workout';
import { SET_GRID, SetRowEditor } from './SetRowEditor';
import { labelClass } from './styles';
interface SetListProps {
  exercise: DayExercise;
  sets: DraftSet[];
  /** Per row: matches the saved log */
  saved: boolean[];
  onChange: (sets: DraftSet[]) => void;
  onSave: (index: number) => void;
}

export const SetList = ({
  exercise,
  sets,
  saved,
  onChange,
  onSave,
}: SetListProps) => {
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
            saved={saved[index]}
            isTimed={exercise.isTimed}
            planWeight={exercise.weight}
            noteOpen={openNote === index}
            onToggleNote={() =>
              setOpenNote(openNote === index ? undefined : index)
            }
            onChange={(changed) =>
              onChange(sets.map((row, i) => (i === index ? changed : row)))
            }
            onSave={() => onSave(index)}
            onRemove={() => {
              setOpenNote(undefined);
              onChange(sets.filter((_row, i) => i !== index));
            }}
          />
        ))}
      </div>
    </>
  );
};
