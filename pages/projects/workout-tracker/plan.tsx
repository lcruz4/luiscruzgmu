import { LoadError } from '@/components/workout-tracker/LoadError';
import { NoPlan } from '@/components/workout-tracker/NoPlan';
import { PlanEditor } from '@/components/workout-tracker/PlanEditor';
import { PlanSkeleton } from '@/components/workout-tracker/PlanSkeleton';
import { usePlan } from '@/components/workout-tracker/usePlan';
import { WorkoutLayout } from '@/components/workout-tracker/WorkoutLayout';
import { requireLogin } from '@/services/auth';

interface PlanPageProps {
  email: string;
}

const PlanContent = ({ email }: PlanPageProps) => {
  const { data, isError } = usePlan();

  if (data === null) return <NoPlan email={email} />;
  if (data) return <PlanEditor plan={data.plan} rows={data.rows} />;
  if (isError) return <LoadError subject='the plan' />;
  return <PlanSkeleton />;
};

const PlanPage = ({ email }: PlanPageProps) => (
  <WorkoutLayout>
    <PlanContent email={email} />
  </WorkoutLayout>
);

export const getServerSideProps = requireLogin;

export default PlanPage;
