import { buildSetRows } from './sets';

const plan = { sets: 3, weight: '40' };
const saved = (setNumber: number, reps: number) => ({
  id: 100 + setNumber,
  setNumber,
  weight: '45',
  reps,
  notes: null,
});
const draft = (setNumber: number, weight: string | null = '40') => ({
  id: null,
  setNumber,
  weight,
  reps: null,
  notes: null,
});

describe('buildSetRows', () => {
  it('pre-fills the plan sets at the plan weight', () => {
    expect(buildSetRows(plan, [])).toEqual([draft(1), draft(2), draft(3)]);
    expect(buildSetRows({ sets: 2, weight: null }, [])).toEqual([
      draft(1, null),
      draft(2, null),
    ]);
  });

  it('keeps saved sets and fills gaps with drafts', () => {
    expect(buildSetRows(plan, [saved(1, 10), saved(3, 9)])).toEqual([
      saved(1, 10),
      draft(2),
      saved(3, 9),
    ]);
  });

  it('shows saved sets beyond the plan', () => {
    expect(buildSetRows(plan, [saved(4, 8)])).toHaveLength(4);
  });

  it('adds rows up to rowCount, never fewer than the plan or saved sets', () => {
    expect(buildSetRows(plan, [], 5)).toHaveLength(5);
    expect(buildSetRows(plan, [], 2)).toHaveLength(3);
    expect(buildSetRows(plan, [saved(4, 8)], 2)).toHaveLength(4);
  });
});
