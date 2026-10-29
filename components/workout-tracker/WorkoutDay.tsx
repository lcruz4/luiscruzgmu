import { type ReactNode, useState } from 'react';
import { allSetsSaved } from '@/lib/workout/sets';
import type { DayResponse } from '@/types/workout';
import { Celebration, type CelebrationPhase } from './Celebration';
import { DayHeader } from './DayHeader';
import { ExerciseList } from './ExerciseList';
import { useDrafts } from './useDrafts';

// The clock starts at the first save, so the first set itself isn't counted
const FIRST_SET_ALLOWANCE = 60_000;

const workoutDuration = (data: DayResponse) => {
  const starts = data.exercises.flatMap((exercise) =>
    exercise.log ? [Date.parse(exercise.log.createdAt)] : [],
  );
  return Date.now() - Math.min(...starts) + FIRST_SET_ALLOWANCE;
};

interface WorkoutDayProps {
  data: DayResponse;
  today: string | undefined;
  /** A set's save button was tapped, except the workout's last set */
  onSetSave: () => void;
  /** The Change button */
  children: ReactNode;
}

// Header and cards for one day. Keyed by day, so it celebrates at most once
// per visit, and only when the day goes from unfinished to done.
export const WorkoutDay = ({
  data,
  today,
  onSetSave,
  children,
}: WorkoutDayProps) => {
  const { drafts, setDraft } = useDrafts(data.date);
  const done = data.exercises.every((exercise) =>
    allSetsSaved(exercise.log, drafts[exercise.id]),
  );
  const [celebrated, setCelebrated] = useState(done);
  const [phase, setPhase] = useState<CelebrationPhase>();
  const [duration, setDuration] = useState(0);

  // During render, not in an effect, so the Done badge doesn't flash first
  if (done && !celebrated) {
    setCelebrated(true);
    setDuration(workoutDuration(data));
    setPhase('trophy');
  }

  return (
    <>
      <DayHeader
        date={data.date}
        today={today}
        week={data.week}
        day={data.day}
        done={done && phase !== 'trophy'}
      >
        {children}
      </DayHeader>
      <ExerciseList
        exercises={data.exercises}
        date={data.date}
        week={data.week}
        drafts={drafts}
        setDraft={setDraft}
        onSetSave={onSetSave}
      />
      {phase && (
        <Celebration
          phase={phase}
          duration={duration}
          onNext={() => setPhase('summary')}
          onClose={() => setPhase(undefined)}
        />
      )}
    </>
  );
};
