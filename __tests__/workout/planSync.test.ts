import { rowsToSync } from '@/lib/workout/planSync';

const INCLINE_CURL = 12;
const HAMMER_CURL = 13;

// Incline biceps curl sits on Day 2 and Day 4 in both weeks.
const rows = [
  { id: 1, programId: 1, week: 1, day: 2, exerciseId: INCLINE_CURL },
  { id: 2, programId: 1, week: 1, day: 4, exerciseId: INCLINE_CURL },
  { id: 3, programId: 1, week: 2, day: 2, exerciseId: INCLINE_CURL },
  { id: 4, programId: 1, week: 2, day: 4, exerciseId: INCLINE_CURL },
  { id: 5, programId: 1, week: 1, day: 2, exerciseId: HAMMER_CURL },
  { id: 6, programId: 2, week: 1, day: 2, exerciseId: INCLINE_CURL },
];

const ids = (result: { id: number }[]) => result.map((row) => row.id);

describe('rowsToSync', () => {
  it('weight edits hit every row of that exercise in the program', () => {
    expect(ids(rowsToSync(rows, rows[1], 'weight'))).toEqual([1, 2, 3, 4]);
  });

  it('sets/reps edits hit that exercise in the same week only', () => {
    expect(ids(rowsToSync(rows, rows[0], 'sets'))).toEqual([1, 2]);
    expect(ids(rowsToSync(rows, rows[3], 'reps'))).toEqual([3, 4]);
  });

  it('notes edits hit the edited row only', () => {
    expect(ids(rowsToSync(rows, rows[1], 'notes'))).toEqual([2]);
  });

  it('never touches another program', () => {
    expect(ids(rowsToSync(rows, rows[5], 'weight'))).toEqual([6]);
  });

  it('only touches the edited exercise', () => {
    expect(ids(rowsToSync(rows, rows[4], 'weight'))).toEqual([5]);
  });
});
