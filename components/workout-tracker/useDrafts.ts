import { useEffect, useState } from 'react';
import type { ExerciseDraft } from '@/lib/workout/sets';

const storageKey = (date: string) => `workout-tracker:drafts:${date}`;

// Unsaved exercise cards for one date, by plan exercise id. Kept in
// localStorage so a reload in the same tab doesn't lose them.
export const useDrafts = (date: string) => {
  const [drafts, setDrafts] = useState<Record<number, ExerciseDraft>>(() => {
    try {
      return JSON.parse(localStorage.getItem(storageKey(date)) ?? '{}');
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(storageKey(date), JSON.stringify(drafts));
    } catch {
      // Storage full or blocked: the drafts still live in memory
    }
  }, [date, drafts]);

  const setDraft = (planExerciseId: number, draft: ExerciseDraft | null) =>
    setDrafts((current) => {
      const next = { ...current };
      if (draft) next[planExerciseId] = draft;
      else delete next[planExerciseId];
      return next;
    });

  return { drafts, setDraft };
};
