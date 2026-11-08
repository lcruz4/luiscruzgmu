import { autoNext, nextWeekDay } from './schedule';

describe('nextWeekDay', () => {
  it('walks W1D1…W1D4, W2D1…W2D4 and wraps', () => {
    expect(nextWeekDay({ week: 1, day: 1 }, 2)).toEqual({ week: 1, day: 2 });
    expect(nextWeekDay({ week: 1, day: 4 }, 2)).toEqual({ week: 2, day: 1 });
    expect(nextWeekDay({ week: 2, day: 4 }, 2)).toEqual({ week: 1, day: 1 });
  });

  it('wraps within week 1 on a 1-week plan', () => {
    expect(nextWeekDay({ week: 1, day: 3 }, 1)).toEqual({ week: 1, day: 4 });
    expect(nextWeekDay({ week: 1, day: 4 }, 1)).toEqual({ week: 1, day: 1 });
  });

  it('lands in week 1 from a week the plan no longer has', () => {
    expect(nextWeekDay({ week: 2, day: 2 }, 1)).toEqual({ week: 1, day: 3 });
  });
});

describe('autoNext', () => {
  const today = '2026-10-19';

  it('starts at W1D1 with no history', () => {
    expect(autoNext(undefined, today, 2)).toEqual({ week: 1, day: 1 });
  });

  it('stays on the day logged today', () => {
    expect(autoNext({ week: 1, day: 3, date: today }, today, 2)).toEqual({
      week: 1,
      day: 3,
    });
  });

  it('moves to the day after the last one logged earlier', () => {
    expect(autoNext({ week: 1, day: 4, date: '2026-10-17' }, today, 2)).toEqual(
      { week: 2, day: 1 },
    );
    expect(autoNext({ week: 2, day: 4, date: '2026-10-17' }, today, 2)).toEqual(
      { week: 1, day: 1 },
    );
    expect(autoNext({ week: 1, day: 4, date: '2026-10-17' }, today, 1)).toEqual(
      { week: 1, day: 1 },
    );
  });
});
