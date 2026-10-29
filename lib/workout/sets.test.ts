import {
  allSetsSaved,
  draftToLog,
  initialDraft,
  savedRows,
  withSavedSet,
} from './sets';

const plan = { sets: 3, reps: 10, weight: '40', log: null };
const planned = { weight: '40', reps: '10', notes: '' };

describe('initialDraft', () => {
  it('pre-fills the plan sets, weight and reps when nothing is logged', () => {
    expect(initialDraft(plan)).toEqual({
      sets: [planned, planned, planned],
      notes: '',
      passed: null,
    });
    expect(initialDraft({ ...plan, sets: 1, weight: null }).sets).toEqual([
      { weight: '', reps: '10', notes: '' },
    ]);
  });

  it('starts from the saved log when there is one', () => {
    const log = {
      id: 1,
      passed: false,
      notes: 'hard',
      sets: [
        { id: 7, setNumber: 1, weight: '45', reps: 8, notes: 'paused' },
        { id: 8, setNumber: 2, weight: null, reps: null, notes: null },
      ],
    };
    expect(initialDraft({ ...plan, log })).toEqual({
      sets: [
        { weight: '45', reps: '8', notes: 'paused' },
        { weight: '', reps: '', notes: '' },
      ],
      notes: 'hard',
      passed: false,
    });
  });
});

describe('draftToLog', () => {
  it('drops rows without reps and blanks to null', () => {
    expect(
      draftToLog({
        sets: [
          { weight: ' 45 ', reps: '8', notes: '' },
          { weight: '45', reps: '', notes: 'skipped' },
          { weight: '', reps: '0', notes: ' +2 after pause ' },
        ],
        notes: '  ',
        passed: true,
      }),
    ).toEqual({
      passed: true,
      notes: null,
      sets: [
        { weight: '45', reps: 8, notes: null },
        { weight: null, reps: 0, notes: '+2 after pause' },
      ],
    });
  });
});

const savedLog = {
  id: 1,
  passed: true,
  notes: 'easy',
  sets: [
    { id: 7, setNumber: 1, weight: '40', reps: 10, notes: null },
    { id: 8, setNumber: 2, weight: '45', reps: 9, notes: null },
  ],
};

describe('savedRows', () => {
  it('marks rows matching the saved set at the same position', () => {
    expect(
      savedRows(savedLog, [
        { weight: ' 40', reps: '10', notes: '' },
        { weight: '45', reps: '8', notes: '' },
        planned,
      ]),
    ).toEqual([true, false, false]);
    expect(savedRows(null, [planned])).toEqual([false]);
  });

  it('ignores note edits on a saved row', () => {
    expect(
      savedRows(savedLog, [{ weight: '40', reps: '10', notes: 'grip' }]),
    ).toEqual([true]);
  });
});

describe('allSetsSaved', () => {
  const savedDraft = initialDraft({ ...plan, log: savedLog });

  it('needs a log with every row on the card saved', () => {
    expect(allSetsSaved(null, undefined)).toBe(false);
    expect(allSetsSaved(savedLog, undefined)).toBe(true);
    expect(allSetsSaved(savedLog, savedDraft)).toBe(true);
    expect(
      allSetsSaved(savedLog, {
        ...savedDraft,
        sets: [...savedDraft.sets, planned],
      }),
    ).toBe(false);
  });
});

describe('withSavedSet', () => {
  const edited = { weight: '45', reps: '7', notes: 'grip' };

  it('swaps one row into the saved log, keeping its note and pass/fail', () => {
    expect(withSavedSet(savedLog, [planned, edited, planned], 1)).toEqual({
      sets: [{ weight: '40', reps: '10', notes: '' }, edited],
      notes: 'easy',
      passed: true,
    });
  });

  it('fills earlier unsaved rows from the draft', () => {
    expect(withSavedSet(null, [planned, planned, edited], 2)).toEqual({
      sets: [planned, planned, edited],
      notes: '',
      passed: null,
    });
  });
});
