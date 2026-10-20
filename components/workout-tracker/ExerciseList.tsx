import { useState } from 'react';
import type { DayExercise } from '@/types/workout';
import { ExerciseCard } from './ExerciseCard';

interface ExerciseListProps {
  exercises: DayExercise[];
  date: string;
  week: number;
}

// Accordion: one card open at a time, starting with the first one not logged
// yet. Finish exercise opens the next card; finishing the last closes it.
export const ExerciseList = ({ exercises, date, week }: ExerciseListProps) => {
  const [openId, setOpenId] = useState(
    (exercises.find((exercise) => !exercise.log) ?? exercises.at(0))?.id,
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
          onToggle={() =>
            setOpenId(exercise.id === openId ? undefined : exercise.id)
          }
          onFinish={() => setOpenId(exercises.at(index + 1)?.id)}
        />
      ))}
    </main>
  );
};
