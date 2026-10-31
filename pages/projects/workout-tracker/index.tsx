import { DayPicker } from '@/components/workout-tracker/DayPicker';
import { LoadError } from '@/components/workout-tracker/LoadError';
import { LogSkeleton } from '@/components/workout-tracker/LogSkeleton';
import { NoPlan } from '@/components/workout-tracker/NoPlan';
import { getToday, useDay } from '@/components/workout-tracker/useDay';
import { useRestTimer } from '@/components/workout-tracker/useRestTimer';
import { useSelection } from '@/components/workout-tracker/useSelection';
import { WorkoutDay } from '@/components/workout-tracker/WorkoutDay';
import { WorkoutLayout } from '@/components/workout-tracker/WorkoutLayout';
import { requireLogin } from '@/services/auth';

interface LogPageProps {
  email: string;
}

const LogContent = ({ email }: LogPageProps) => {
  const today = getToday();
  const { selection, select } = useSelection();
  const { data, isError } = useDay(selection.date ?? today, selection.weekDay);
  const restartTimer = useRestTimer((state) => state.restart);

  if (data === null) return <NoPlan email={email} />;
  if (data) {
    return (
      <WorkoutDay
        key={`${data.date} W${data.week}D${data.day}`}
        data={data}
        today={today}
        onSetSave={restartTimer}
      >
        <DayPicker shown={data} today={today} onPick={select} />
      </WorkoutDay>
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

export const getServerSideProps = requireLogin('workout-tracker');

export default LogPage;
