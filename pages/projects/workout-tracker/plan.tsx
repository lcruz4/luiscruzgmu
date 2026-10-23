import { LoadError } from '@/components/workout-tracker/LoadError';
import { NoPlan } from '@/components/workout-tracker/NoPlan';
import { PlanEditor } from '@/components/workout-tracker/PlanEditor';
import { PlanSkeleton } from '@/components/workout-tracker/PlanSkeleton';
import { getToday, useDay } from '@/components/workout-tracker/useDay';
import { usePlan } from '@/components/workout-tracker/usePlan';
import { WorkoutLayout } from '@/components/workout-tracker/WorkoutLayout';
import { requireLogin } from '@/services/auth';

interface PlanPageProps {
  email: string;
}

const PlanContent = ({ email }: PlanPageProps) => {
  const today = getToday();
  const dayResponse = useDay(today);
  const planResponse = usePlan();

  if (dayResponse.isLoading) {
    return <PlanSkeleton />;
  }
  if (planResponse.data === null) {
    return <NoPlan email={email} />;
  }
  if (planResponse.data) {
    return (
      <PlanEditor
        plan={planResponse.data.plan}
        rows={planResponse.data.rows}
        dayData={dayResponse.data}
      />
    );
  }
  if (planResponse.isError) {
    return <LoadError subject='the plan' />;
  }
  return <PlanSkeleton />;
};

const PlanPage = ({ email }: PlanPageProps) => (
  <WorkoutLayout>
    <PlanContent email={email} />
  </WorkoutLayout>
);

export const getServerSideProps = requireLogin;

export default PlanPage;
