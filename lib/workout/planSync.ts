export type PlanField = 'sets' | 'reps' | 'weight' | 'notes';

export const PLAN_FIELDS: PlanField[] = ['sets', 'reps', 'weight', 'notes'];

export interface PlanRowKey {
  id: number;
  planId: number;
  week: number;
  exerciseId: number;
}

// Ids of the rows a plan edit must update so shared targets stay in sync
// (D13/D14): weight/notes → same exercise in the plan, sets/reps → same
// exercise and week.
export const idsToSync = (
  rows: PlanRowKey[],
  edited: PlanRowKey,
  field: PlanField,
): number[] => {
  const sameExercise = (row: PlanRowKey) =>
    row.planId === edited.planId && row.exerciseId === edited.exerciseId;
  const matches = (row: PlanRowKey) => {
    switch (field) {
      case 'weight':
      case 'notes':
        return sameExercise(row);
      case 'sets':
      case 'reps':
        return sameExercise(row) && row.week === edited.week;
    }
  };
  return rows.filter(matches).map((row) => row.id);
};
