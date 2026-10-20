import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { DayResponse, LogResponse } from '@/types/workout';

class SaveError extends Error {
  constructor(readonly status: number) {
    super(`Save failed: ${status}`);
  }
}

export const saveErrorText = (error: Error) =>
  error instanceof SaveError && error.status === 401
    ? 'Not saved: signed out. Reload to sign in.'
    : 'Not saved.';

const send = async (
  method: 'PUT' | 'DELETE',
  url: string,
  body?: object,
): Promise<LogResponse> => {
  const response = await fetch(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body && JSON.stringify(body),
  });
  if (!response.ok) throw new SaveError(response.status);
  return response.json();
};

export interface SetValues {
  setNumber: number;
  weight: string | null;
  reps: number | null;
  notes: string | null;
}

export interface LogFields {
  passed: boolean | null;
  notes: string | null;
}

// Writes for one exercise on one date. Each response is that day's whole log,
// so writes run one at a time (scope) and the latest response wins.
export const useLogMutations = (planExerciseId: number, date: string) => {
  const queryClient = useQueryClient();
  const scope = { id: `workout-log-${planExerciseId}-${date}` };

  const onSuccess = ({ log }: LogResponse) => {
    // Other cached days' "last" and history may now be stale (staleTime: Infinity)
    queryClient.invalidateQueries({
      queryKey: ['workout-tracker'],
      refetchType: 'none',
    });
    queryClient.setQueriesData<DayResponse | null>(
      { queryKey: ['workout-tracker', 'day'] },
      (data) =>
        data?.date === date
          ? {
              ...data,
              exercises: data.exercises.map((exercise) =>
                exercise.id === planExerciseId
                  ? { ...exercise, log }
                  : exercise,
              ),
            }
          : undefined,
    );
  };

  const saveSet = useMutation({
    scope,
    onSuccess,
    mutationFn: (set: SetValues) =>
      send('PUT', '/api/workout-tracker/sets', {
        planExerciseId,
        date,
        ...set,
      }),
  });

  const deleteSet = useMutation({
    scope,
    onSuccess,
    mutationFn: (setNumber: number) =>
      send(
        'DELETE',
        `/api/workout-tracker/sets?${new URLSearchParams({
          planExerciseId: String(planExerciseId),
          date,
          setNumber: String(setNumber),
        })}`,
      ),
  });

  const saveLog = useMutation({
    scope,
    onSuccess,
    mutationFn: (fields: LogFields) =>
      send('PUT', '/api/workout-tracker/log', {
        planExerciseId,
        date,
        ...fields,
      }),
  });

  return { saveSet, deleteSet, saveLog };
};
