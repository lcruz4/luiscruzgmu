import { useEffect, useState } from 'react';
import { allSetsSaved } from '@/lib/workout/sets';
import type { DayExercise } from '@/types/workout';
import { ExerciseCard } from './ExerciseCard';
import { LAST_OPEN_EXERCISE_KEY } from './lastOpenExercise';
import { useDrafts } from './useDrafts';

interface ExerciseListProps {
  exercises: DayExercise[];
  date: string;
  week: number;
  /** A set's save button was tapped, except the workout's last set */
  onSetSave: () => void;
}

// Accordion: one card open at a time, starting with the first one with sets
// not saved yet. Finish exercise saves the card and opens the next; the last
// just closes.
export const ExerciseList = ({
  exercises,
  date,
  week,
  onSetSave,
}: ExerciseListProps) => {
  const { drafts, setDraft } = useDrafts(date);
  const [openId, setOpenId] = useState(
    exercises.find(
      (exercise) => !allSetsSaved(exercise.log, drafts[exercise.id]),
    )?.id ?? undefined,
  );

  useEffect(() => {
    localStorage.setItem(
      LAST_OPEN_EXERCISE_KEY,
      exercises
        .find((exercise) => exercise.id === openId)
        ?.exerciseId.toString() ?? 'null',
    );
  }, [openId]);

  return (
    <main className='flex flex-1 flex-col gap-3 p-4'>
      {exercises.map((exercise, index) => (
        <ExerciseCard
          key={exercise.id}
          exercise={exercise}
          date={date}
          week={week}
          open={exercise.id === openId}
          draft={drafts[exercise.id]}
          onDraftChange={(draft) => setDraft(exercise.id, draft)}
          onSetSave={(lastSet) => {
            if (!lastSet || index < exercises.length - 1) onSetSave();
          }}
          onToggle={() =>
            setOpenId(exercise.id === openId ? undefined : exercise.id)
          }
          onFinish={() => setOpenId(exercises.at(index + 1)?.id)}
        />
      ))}
    </main>
  );
};
