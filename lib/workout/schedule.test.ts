import { autoNext, nextWeekDay } from './schedule';

describe('nextWeekDay', () => {
  it('walks W1D1…W1D4, W2D1…W2D4 and wraps', () => {
    expect(nextWeekDay({ week: 1, day: 1 })).toEqual({ week: 1, day: 2 });
    expect(nextWeekDay({ week: 1, day: 4 })).toEqual({ week: 2, day: 1 });
    expect(nextWeekDay({ week: 2, day: 4 })).toEqual({ week: 1, day: 1 });
  });
});

describe('autoNext', () => {
  const today = '2026-10-19';

  it('starts at W1D1 with no history', () => {
    expect(autoNext(undefined, today)).toEqual({ week: 1, day: 1 });
  });

  it('stays on the day logged today', () => {
    expect(autoNext({ week: 1, day: 3, date: today }, today)).toEqual({
      week: 1,
      day: 3,
    });
  });

  it('moves to the day after the last one logged earlier', () => {
    expect(autoNext({ week: 1, day: 4, date: '2026-10-17' }, today)).toEqual({
      week: 2,
      day: 1,
    });
    expect(autoNext({ week: 2, day: 4, date: '2026-10-17' }, today)).toEqual({
      week: 1,
      day: 1,
    });
  });
});
