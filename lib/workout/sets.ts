import type { LogSet } from '@/types/workout';

/** A saved set, or a draft (id null) that isn't stored until reps are entered */
export type SetRow = Omit<LogSet, 'id'> & { id: number | null };

interface PlanTarget {
  sets: number;
  weight: string | null;
}

// Saved sets plus drafts for any gaps, up to the plan's set count, the
// highest saved set or rowCount (rows added by hand), whichever is largest.
// Drafts start at the plan weight (D41).
export const buildSetRows = (
  plan: PlanTarget,
  saved: LogSet[],
  rowCount = 0,
): SetRow[] => {
  const bySetNumber = new Map(saved.map((set) => [set.setNumber, set]));
  const count = Math.max(
    plan.sets,
    rowCount,
    ...saved.map((set) => set.setNumber),
  );
  const rows: SetRow[] = [];
  for (let setNumber = 1; setNumber <= count; setNumber++) {
    rows.push(
      bySetNumber.get(setNumber) ?? {
        id: null,
        setNumber,
        weight: plan.weight,
        reps: null,
        notes: null,
      },
    );
  }
  return rows;
};
