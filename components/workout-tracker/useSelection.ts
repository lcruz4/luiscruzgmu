import { useRouter } from 'next/router';
import { DAYS_PER_WEEK, WEEKS, type WeekDay } from '@/lib/workout/schedule';

export interface Selection {
  /** Omitted = today */
  date?: string;
  /** Omitted = auto-next (D17) */
  weekDay?: WeekDay;
}

const intParam = (value: unknown, max: number) => {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 && n <= max ? n : undefined;
};

// The picked workout lives in the URL (?date=&week=&day=) so a reload keeps
// it. No params = today + auto-next; invalid ones are ignored.
export const useSelection = () => {
  const router = useRouter();
  const { date, week: weekParam, day: dayParam } = router.query;
  const week = intParam(weekParam, WEEKS);
  const day = intParam(dayParam, DAYS_PER_WEEK);

  const selection: Selection = {
    date:
      typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)
        ? date
        : undefined,
    weekDay: week && day ? { week, day } : undefined,
  };

  const select = ({ date, weekDay }: Selection) =>
    router.push(
      {
        pathname: router.pathname,
        query: {
          ...(date && { date }),
          ...(weekDay && { week: weekDay.week, day: weekDay.day }),
        },
      },
      undefined,
      { shallow: true },
    );

  return { selection, select };
};
