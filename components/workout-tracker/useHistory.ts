import { useQuery } from '@tanstack/react-query';
import type { HistoryEntry, HistoryResponse } from '@/types/workout';

const fetchHistory = async (): Promise<HistoryEntry[]> => {
  const response = await fetch('/api/workout-tracker/history');
  if (!response.ok) throw new Error(`GET history failed: ${response.status}`);
  const { entries }: HistoryResponse = await response.json();
  return entries;
};

// Every log + sets, newest first (D50). Logs change on the Log page, so
// refetch each time History opens despite the global staleTime: Infinity.
export const useHistory = () =>
  useQuery({
    queryKey: ['workout-tracker', 'history'],
    queryFn: fetchHistory,
    refetchOnMount: 'always',
  });
