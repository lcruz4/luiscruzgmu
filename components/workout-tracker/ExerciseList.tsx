import { useState } from 'react';
import type { DayExercise } from '@/types/workout';
import { ExerciseCard } from './ExerciseCard';

interface ExerciseListProps {
  exercises: DayExercise[];
  week: number;
}

// Accordion: one card open at a time, the first one to start with
export const ExerciseList = ({ exercises, week }: ExerciseListProps) => {
  const [openId, setOpenId] = useState(exercises.at(0)?.id);
  return (
    <main className='flex flex-1 flex-col gap-3 p-4'>
      {exercises.map((exercise) => (
        <ExerciseCard
          key={exercise.id}
          exercise={exercise}
          week={week}
          open={exercise.id === openId}
          onToggle={() =>
            setOpenId(exercise.id === openId ? undefined : exercise.id)
          }
        />
      ))}
    </main>
  );
};
