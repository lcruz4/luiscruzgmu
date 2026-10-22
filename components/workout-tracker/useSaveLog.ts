import { useMutation, useQueryClient } from '@tanstack/react-query';
import { draftToLog, type ExerciseDraft } from '@/lib/workout/sets';
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

// Finish exercise: replaces that day's whole log for the exercise
export const useSaveLog = (planExerciseId: number, date: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (draft: ExerciseDraft): Promise<LogResponse> => {
      const response = await fetch('/api/workout-tracker/log', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planExerciseId, date, ...draftToLog(draft) }),
      });
      if (!response.ok) throw new SaveError(response.status);
      return response.json();
    },
    onSuccess: ({ log }) => {
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
    },
  });
};
