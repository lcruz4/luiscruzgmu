import { idsToSync, type PlanRowKey } from './planSync';

// Incline biceps curl is on Day 2 and Day 4 of both weeks; 30 is another exercise
const rows: PlanRowKey[] = [
  { id: 26, planId: 1, week: 1, exerciseId: 12 }, // W1D2
  { id: 25, planId: 1, week: 1, exerciseId: 12 }, // W1D4
  { id: 24, planId: 1, week: 2, exerciseId: 12 }, // W2D2
  { id: 23, planId: 1, week: 2, exerciseId: 12 }, // W2D4
  { id: 30, planId: 1, week: 1, exerciseId: 13 },
  { id: 99, planId: 2, week: 1, exerciseId: 12 }, // other plan
];
const w1d2 = rows[0];

describe('idsToSync', () => {
  it('weight → same exercise in both weeks of the plan', () => {
    expect(idsToSync(rows, w1d2, 'weight')).toEqual([26, 25, 24, 23]);
  });

  it('sets and reps → same exercise in the same week', () => {
    expect(idsToSync(rows, w1d2, 'sets')).toEqual([26, 25]);
    expect(idsToSync(rows, w1d2, 'reps')).toEqual([26, 25]);
  });

  it('notes → only the edited row', () => {
    expect(idsToSync(rows, w1d2, 'notes')).toEqual([26]);
  });
});
