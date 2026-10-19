import { autoNext, isPassFailWeek, nextWeekDay } from '@/lib/workout/schedule';

const TODAY = '2026-10-19';

describe('nextWeekDay', () => {
  it('walks W1D1…W1D4, W2D1…W2D4 and wraps', () => {
    expect(nextWeekDay({ week: 1, day: 1 })).toEqual({ week: 1, day: 2 });
    expect(nextWeekDay({ week: 1, day: 4 })).toEqual({ week: 2, day: 1 });
    expect(nextWeekDay({ week: 2, day: 4 })).toEqual({ week: 1, day: 1 });
  });
});

describe('autoNext', () => {
  it('starts at W1D1 with no history', () => {
    expect(autoNext([], TODAY)).toEqual({ week: 1, day: 1 });
  });

  it('stays on the week/day already logged today', () => {
    const logged = [
      { date: '2026-10-17', week: 1, day: 3 },
      { date: TODAY, week: 2, day: 2 },
    ];
    expect(autoNext(logged, TODAY)).toEqual({ week: 2, day: 2 });
  });

  it('moves from W1D4 to W2D1', () => {
    const logged = [
      { date: '2026-10-05', week: 1, day: 4 },
      { date: '2026-10-01', week: 1, day: 3 },
    ];
    expect(autoNext(logged, TODAY)).toEqual({ week: 2, day: 1 });
  });

  it('wraps from W2D4 to W1D1', () => {
    expect(autoNext([{ date: '2026-10-12', week: 2, day: 4 }], TODAY)).toEqual(
      { week: 1, day: 1 },
    );
  });

  it('uses the most recent date, not the order of the input', () => {
    const logged = [
      { date: '2026-10-17', week: 1, day: 3 },
      { date: '2026-10-13', week: 1, day: 1 },
      { date: '2026-10-15', week: 1, day: 2 },
    ];
    expect(autoNext(logged, TODAY)).toEqual({ week: 1, day: 4 });
  });

  it('ignores logs dated after today', () => {
    const logged = [
      { date: '2026-10-17', week: 1, day: 3 },
      { date: '2026-10-25', week: 2, day: 2 },
    ];
    expect(autoNext(logged, TODAY)).toEqual({ week: 1, day: 4 });
  });

  it('breaks same-date ties by sequence order', () => {
    const logged = [
      { date: '2026-10-17', week: 1, day: 3 },
      { date: '2026-10-17', week: 1, day: 2 },
    ];
    expect(autoNext(logged, TODAY)).toEqual({ week: 1, day: 4 });
  });
});

describe('isPassFailWeek', () => {
  it('is only Week 2', () => {
    expect(isPassFailWeek(1)).toBe(false);
    expect(isPassFailWeek(2)).toBe(true);
  });
});
