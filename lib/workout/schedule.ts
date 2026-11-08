export const MAX_WEEKS = 4;
export const DAYS_PER_WEEK = 4;

export interface WeekDay {
  week: number;
  day: number;
}

export interface LoggedDay extends WeekDay {
  /** YYYY-MM-DD */
  date: string;
}

// W1D1…W1D4, W2D1…W2D4 (for a 2-week plan), then wraps to W1D1
export const nextWeekDay = ({ week, day }: WeekDay, weeks: number): WeekDay => {
  const next = ((week - 1) * DAYS_PER_WEEK + day) % (weeks * DAYS_PER_WEEK);
  return {
    week: Math.floor(next / DAYS_PER_WEEK) + 1,
    day: (next % DAYS_PER_WEEK) + 1,
  };
};

// Last logged today → same week/day; otherwise the next one. No history → W1D1.
export const autoNext = (
  lastLogged: LoggedDay | undefined,
  today: string,
  weeks: number,
): WeekDay => {
  if (!lastLogged) return { week: 1, day: 1 };
  if (lastLogged.date === today) {
    return { week: lastLogged.week, day: lastLogged.day };
  }
  return nextWeekDay(lastLogged, weeks);
};
