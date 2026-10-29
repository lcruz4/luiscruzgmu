import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  draftToLog,
  type ExerciseDraft,
  expectedLog,
} from '@/lib/workout/sets';
import type { DayLog, DayResponse, LogResponse } from '@/types/workout';

class SaveError extends Error {
  constructor(readonly status: number) {
    super(`Save failed: ${status}`);
  }
}

export const saveErrorText = (error: Error) =>
  error instanceof SaveError && error.status === 401
    ? 'Not saved: signed out. Reload to sign in.'
    : 'Not saved.';

// Replaces that day's whole log for the exercise. The cache shows the saved
// log right away; saves for one card run one at a time so a slow one can't
// land after a newer one.
export const useSaveLog = (planExerciseId: number, date: string) => {
  const queryClient = useQueryClient();
  const mutationKey = ['workout-tracker', 'log', planExerciseId, date];

  const setLog = (update: (log: DayLog | null) => DayLog | null) =>
    queryClient.setQueriesData<DayResponse | null>(
      { queryKey: ['workout-tracker', 'day'] },
      (data) =>
        data?.date === date
          ? {
              ...data,
              exercises: data.exercises.map((exercise) =>
                exercise.id === planExerciseId
                  ? { ...exercise, log: update(exercise.log) }
                  : exercise,
              ),
            }
          : undefined,
    );

  return useMutation({
    mutationKey,
    scope: { id: mutationKey.join(':') },
    mutationFn: async (draft: ExerciseDraft): Promise<LogResponse> => {
      const response = await fetch('/api/workout-tracker/log', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planExerciseId, date, ...draftToLog(draft) }),
      });
      if (!response.ok) throw new SaveError(response.status);
      return response.json();
    },
    onMutate: (draft) => setLog((log) => expectedLog(log, draft)),
    onSuccess: ({ log }) => {
      // Other cached days' "last" and history may now be stale (staleTime: Infinity)
      queryClient.invalidateQueries({
        queryKey: ['workout-tracker'],
        refetchType: 'none',
      });
      // A queued save would flash back to this older log
      if (queryClient.isMutating({ mutationKey }) <= 1) setLog(() => log);
    },
    // Back to what the server has
    onError: () =>
      queryClient.invalidateQueries({ queryKey: ['workout-tracker', 'day'] }),
  });
};
