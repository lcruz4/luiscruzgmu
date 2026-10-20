import { DayHeader } from '@/components/workout-tracker/DayHeader';
import { ExerciseList } from '@/components/workout-tracker/ExerciseList';
import { LoadError } from '@/components/workout-tracker/LoadError';
import { LogSkeleton } from '@/components/workout-tracker/LogSkeleton';
import { NoPlan } from '@/components/workout-tracker/NoPlan';
import { useDay, useToday } from '@/components/workout-tracker/useDay';
import { WorkoutLayout } from '@/components/workout-tracker/WorkoutLayout';
import { requireLogin } from '@/services/auth';

interface LogPageProps {
  email: string;
}

const LogContent = ({ email }: LogPageProps) => {
  const today = useToday();
  const { data, isError } = useDay(today);

  if (data === null) return <NoPlan email={email} />;
  if (data) {
    return (
      <>
        <DayHeader
          date={data.date}
          today={today}
          week={data.week}
          day={data.day}
        />
        <ExerciseList
          exercises={data.exercises}
          date={data.date}
          week={data.week}
        />
      </>
    );
  }
  if (isError) return <LoadError />;
  return <LogSkeleton />;
};

const LogPage = ({ email }: LogPageProps) => (
  <WorkoutLayout>
    <LogContent email={email} />
  </WorkoutLayout>
);

export const getServerSideProps = requireLogin;

export default LogPage;
