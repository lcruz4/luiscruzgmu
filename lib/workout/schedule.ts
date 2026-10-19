export const WEEKS = 2;
export const DAYS_PER_WEEK = 4;
export const PASS_FAIL_WEEK = 2;

export interface WeekDay {
  week: number;
  day: number;
}

export interface LoggedDay extends WeekDay {
  /** YYYY-MM-DD */
  date: string;
}

const sequenceIndex = ({ week, day }: WeekDay) =>
  (week - 1) * DAYS_PER_WEEK + day;

export function nextWeekDay({ week, day }: WeekDay): WeekDay {
  if (day < DAYS_PER_WEEK) return { week, day: day + 1 };
  if (week < WEEKS) return { week: week + 1, day: 1 };
  return { week: 1, day: 1 };
}

/**
 * Something logged today → that week/day. Otherwise the week/day after the
 * most recent one logged before today. No history → W1D1.
 */
export function autoNext(logged: LoggedDay[], today: string): WeekDay {
  let latest: LoggedDay | undefined;
  for (const entry of logged) {
    if (entry.date === today) return { week: entry.week, day: entry.day };
    if (entry.date > today) continue;
    if (
      !latest ||
      entry.date > latest.date ||
      (entry.date === latest.date &&
        sequenceIndex(entry) > sequenceIndex(latest))
    ) {
      latest = entry;
    }
  }
  return latest ? nextWeekDay(latest) : { week: 1, day: 1 };
}

export const isPassFailWeek = (week: number) => week === PASS_FAIL_WEEK;
