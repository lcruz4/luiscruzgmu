import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchJson, retry } from './api';
import type {
  AdminExercise,
  AdminPlan,
  AdminPlanResponse,
  AdminPlanRow,
  AdminPlanSummary,
} from '@/types/workout';

export type NewPlan = {
  ownerEmail: string;
  name: string;
  sourcePlanId: number | null;
  blank: boolean;
  activate: boolean;
};

export type PlanRowInput = Pick<
  AdminPlanRow,
  | 'week'
  | 'day'
  | 'position'
  | 'exerciseId'
  | 'sets'
  | 'reps'
  | 'weight'
  | 'notes'
>;

const request = <T>(path: string, init?: RequestInit) =>
  fetchJson<T>(`/api/workout-tracker/admin/${path}`, init);

const KEYS = {
  plans: ['admin', 'workout', 'plans'],
  plan: (id: number) => ['admin', 'workout', 'plans', id],
  exercises: ['admin', 'workout', 'exercises'],
};

export const usePlans = () =>
  useQuery({
    queryKey: KEYS.plans,
    queryFn: () =>
      request<{ plans: AdminPlanSummary[] }>('plans').then(
        ({ plans }) => plans,
      ),
    retry,
  });

export const usePlan = (id: number | null) =>
  useQuery({
    queryKey: KEYS.plan(id ?? 0),
    queryFn: () => request<AdminPlanResponse>(`plans/${id}`),
    enabled: id !== null,
    retry,
  });

export const useExercises = () =>
  useQuery({
    queryKey: KEYS.exercises,
    queryFn: () =>
      request<{ exercises: AdminExercise[] }>('exercises').then(
        ({ exercises }) => exercises,
      ),
    staleTime: Infinity,
    retry,
  });

// Plans and plan details all live under KEYS.plans
const useInvalidatePlans = () => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: KEYS.plans });
};

export const useCreatePlan = () => {
  const invalidate = useInvalidatePlans();
  return useMutation({
    mutationFn: (plan: NewPlan) =>
      request<AdminPlanResponse>('plans', {
        method: 'POST',
        body: JSON.stringify(plan),
      }),
    onSuccess: invalidate,
  });
};

export const useDeletePlan = () => {
  const queryClient = useQueryClient();
  const invalidate = useInvalidatePlans();
  return useMutation({
    mutationFn: (id: number) => request(`plans/${id}`, { method: 'DELETE' }),
    onSuccess: (_, id) => {
      // Dropped first so invalidating doesn't refetch the deleted plan
      queryClient.removeQueries({ queryKey: KEYS.plan(id) });
      return invalidate();
    },
  });
};

export type PlanSettings = Pick<AdminPlan, 'weeks' | 'dayTitles'>;

export const useUpdatePlanSettings = (id: number) => {
  const invalidate = useInvalidatePlans();
  return useMutation({
    mutationFn: (settings: PlanSettings) =>
      request<AdminPlanResponse>(`plans/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(settings),
      }),
    onSuccess: invalidate,
  });
};

export const useSetPlanActive = (id: number) => {
  const invalidate = useInvalidatePlans();
  return useMutation({
    mutationFn: (active: boolean) =>
      request<{ plan: AdminPlan }>(`plans/${id}/active`, {
        method: 'PUT',
        body: JSON.stringify({ active }),
      }),
    onSuccess: invalidate,
  });
};

export const useCreatePlanRow = (planId: number) => {
  const invalidate = useInvalidatePlans();
  return useMutation({
    mutationFn: (row: PlanRowInput) =>
      request<AdminPlanRow>('plan-exercises', {
        method: 'POST',
        body: JSON.stringify({ planId, ...row }),
      }),
    onSuccess: invalidate,
  });
};

export const useUpdatePlanRow = (id: number) => {
  const invalidate = useInvalidatePlans();
  return useMutation({
    mutationFn: (row: PlanRowInput) =>
      request<AdminPlanRow>(`plan-exercises/${id}`, {
        method: 'PUT',
        body: JSON.stringify(row),
      }),
    onSuccess: invalidate,
  });
};

export const useDeletePlanRow = (id: number) => {
  const invalidate = useInvalidatePlans();
  return useMutation({
    mutationFn: () => request(`plan-exercises/${id}`, { method: 'DELETE' }),
    onSuccess: invalidate,
  });
};
