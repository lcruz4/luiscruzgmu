import { addSetRow, buildSetRows } from '@/lib/workout/sets';

const draft = (setNumber: number, weight: string | null) => ({
  setNumber,
  weight,
  reps: null,
  note: null,
  saved: false,
});

describe('buildSetRows', () => {
  it('pre-fills one draft per planned set at the plan weight', () => {
    expect(buildSetRows({ sets: 3, weight: '50' }, [])).toEqual([
      draft(1, '50'),
      draft(2, '50'),
      draft(3, '50'),
    ]);
  });

  it('carries the previous set weight forward into drafts', () => {
    const saved = [{ setNumber: 1, weight: '65', reps: '6', note: null }];
    expect(buildSetRows({ sets: 3, weight: '90' }, saved)).toEqual([
      { ...saved[0], saved: true },
      draft(2, '65'),
      draft(3, '65'),
    ]);
  });

  it('keeps saved sets beyond the plan count', () => {
    const saved = [
      { setNumber: 1, weight: '15', reps: '12', note: null },
      { setNumber: 2, weight: '15', reps: '12', note: null },
      { setNumber: 3, weight: '15', reps: '12', note: null },
      { setNumber: 4, weight: '15', reps: '5', note: 'extra' },
    ];
    const rows = buildSetRows({ sets: 3, weight: '15' }, saved);
    expect(rows).toHaveLength(4);
    expect(rows.every((row) => row.saved)).toBe(true);
  });

  it('leaves weight empty for bodyweight exercises', () => {
    expect(buildSetRows({ sets: 2, weight: null }, [])).toEqual([
      draft(1, null),
      draft(2, null),
    ]);
  });
});

describe('addSetRow', () => {
  it('appends a draft at the last row weight', () => {
    const rows = buildSetRows({ sets: 1, weight: '50' }, [
      { setNumber: 1, weight: '45', reps: '10', note: null },
    ]);
    expect(addSetRow(rows, { sets: 1, weight: '50' }).at(-1)).toEqual(
      draft(2, '45'),
    );
  });

  it('uses the plan weight when there are no rows', () => {
    expect(addSetRow([], { sets: 0, weight: '50' })).toEqual([draft(1, '50')]);
  });
});
