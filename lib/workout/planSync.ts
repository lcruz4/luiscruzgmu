export type PlanField = 'sets' | 'reps' | 'weight' | 'notes';

export interface PlanRowKey {
  id: number;
  programId: number;
  week: number;
  exerciseId: number;
}

/**
 * Rows a plan edit must update so shared targets stay in sync (D13/D14):
 * weight → same exercise in the program, sets/reps → same exercise and week,
 * notes → the edited row only.
 */
export function rowsToSync<T extends PlanRowKey>(
  rows: T[],
  edited: PlanRowKey,
  field: PlanField,
): T[] {
  const sameExercise = (row: T) =>
    row.programId === edited.programId && row.exerciseId === edited.exerciseId;

  switch (field) {
    case 'weight':
      return rows.filter(sameExercise);
    case 'sets':
    case 'reps':
      return rows.filter((row) => sameExercise(row) && row.week === edited.week);
    case 'notes':
      return rows.filter((row) => row.id === edited.id);
  }
}
