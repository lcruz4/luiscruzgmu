import { skipToken, useQuery } from '@tanstack/react-query';
import type { WeekDay } from '@/lib/workout/schedule';
import type { DayResponse } from '@/types/workout';

const pad = (n: number) => String(n).padStart(2, '0');

// Local day as YYYY-MM-DD
export const getToday = () => {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
    now.getDate(),
  )}`;
};

// null = no active plan (404)
const fetchDay = async (
  date: string,
  weekDay: WeekDay | undefined,
): Promise<DayResponse | null> => {
  const params = new URLSearchParams({ date });
  if (weekDay) {
    params.set('week', String(weekDay.week));
    params.set('day', String(weekDay.day));
  }
  const response = await fetch(`/api/workout-tracker/day?${params}`);
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`GET day failed: ${response.status}`);
  return response.json();
};

// No week/day = auto-next (D17)
export const useDay = (date: string, weekDay?: WeekDay) =>
  useQuery({
    queryKey: ['workout-tracker', 'day', date, weekDay],
    queryFn: date ? () => fetchDay(date, weekDay) : skipToken,
  });
