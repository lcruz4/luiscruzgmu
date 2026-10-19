export interface SetValues {
  setNumber: number;
  weight: string | null;
  reps: string | null;
  note: string | null;
}

export interface SetRow extends SetValues {
  saved: boolean;
}

interface PlanTarget {
  sets: number;
  weight: string | null;
}

// First set defaults to the plan weight, every later set to the previous set's.
const draftRow = (
  setNumber: number,
  previous: SetRow | undefined,
  plan: PlanTarget,
): SetRow => ({
  setNumber,
  weight: previous ? previous.weight : plan.weight,
  reps: null,
  note: null,
  saved: false,
});

/** Saved sets plus drafts up to the plan's set count. */
export function buildSetRows(plan: PlanTarget, saved: SetValues[]): SetRow[] {
  const bySetNumber = new Map(saved.map((set) => [set.setNumber, set]));
  const count = Math.max(plan.sets, ...saved.map((set) => set.setNumber));
  const rows: SetRow[] = [];
  for (let setNumber = 1; setNumber <= count; setNumber++) {
    const existing = bySetNumber.get(setNumber);
    rows.push(
      existing
        ? { ...existing, saved: true }
        : draftRow(setNumber, rows.at(-1), plan),
    );
  }
  return rows;
}

export const addSetRow = (rows: SetRow[], plan: PlanTarget): SetRow[] => [
  ...rows,
  draftRow(rows.length + 1, rows.at(-1), plan),
];
