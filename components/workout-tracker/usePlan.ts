import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { PlanField } from '@/lib/workout/planSync';
import type { PlanResponse, PlanRow } from '@/types/workout';

const PLAN_KEY = ['workout-tracker', 'plan'];

export type PlanEdit = Pick<PlanRow, 'id' | PlanField>;

// null = no active plan (404)
const fetchPlan = async (): Promise<PlanResponse | null> => {
  const response = await fetch('/api/workout-tracker/plan');
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`GET plan failed: ${response.status}`);
  return response.json();
};

const putPlan = async (edit: PlanEdit): Promise<PlanResponse> => {
  const response = await fetch('/api/workout-tracker/plan', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(edit),
  });
  if (!response.ok) throw new Error(`PUT plan failed: ${response.status}`);
  return response.json();
};

export const usePlan = () =>
  useQuery({ queryKey: PLAN_KEY, queryFn: fetchPlan });

// The response is the whole plan, synced rows included
export const useSavePlanRow = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: putPlan,
    onSuccess: (data) => {
      queryClient.setQueryData(PLAN_KEY, data);
      // Log view targets come from the plan
      void queryClient.invalidateQueries({
        queryKey: ['workout-tracker', 'day'],
      });
    },
  });
};
