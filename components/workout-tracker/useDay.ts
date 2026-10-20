import { skipToken, useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import type { DayResponse } from '@/types/workout';

const pad = (n: number) => String(n).padStart(2, '0');

// The client's local day (D46). Set after mount so SSR (server timezone)
// never renders a different date than the browser.
export const useToday = () => {
  const [today, setToday] = useState<string>();
  useEffect(() => {
    const now = new Date();
    setToday(
      `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
    );
  }, []);
  return today;
};

// null = no active plan (404)
const fetchDay = async (date: string): Promise<DayResponse | null> => {
  const response = await fetch(`/api/workout-tracker/day?date=${date}`);
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`GET day failed: ${response.status}`);
  return response.json();
};

// No week/day = auto-next (D17)
export const useDay = (date: string | undefined) =>
  useQuery({
    queryKey: ['workout-tracker', 'day', date],
    queryFn: date ? () => fetchDay(date) : skipToken,
  });
