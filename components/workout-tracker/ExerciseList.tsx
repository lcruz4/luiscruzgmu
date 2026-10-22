import { useState } from 'react';
import { allSetsSaved } from '@/lib/workout/sets';
import type { DayExercise } from '@/types/workout';
import { ExerciseCard } from './ExerciseCard';
import { useDrafts } from './useDrafts';

interface ExerciseListProps {
  exercises: DayExercise[];
  date: string;
  week: number;
}

// Accordion: one card open at a time, starting with the first one with sets
// not saved yet. Finish exercise saves the card and opens the next; the last
// just closes.
export const ExerciseList = ({ exercises, date, week }: ExerciseListProps) => {
  const { drafts, setDraft } = useDrafts(date);
  const [openId, setOpenId] = useState(
    (
      exercises.find(
        (exercise) => !allSetsSaved(exercise.log, drafts[exercise.id]),
      ) ?? exercises.at(0)
    )?.id,
  );
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
          onToggle={() =>
            setOpenId(exercise.id === openId ? undefined : exercise.id)
          }
          onFinish={() => setOpenId(exercises.at(index + 1)?.id)}
        />
      ))}
    </main>
  );
};
