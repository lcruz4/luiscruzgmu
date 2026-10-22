import { draftToLog, initialDraft } from './sets';

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
