import {
  skipToken,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import type { GameResponse, GameSummary } from '@/types/remorse';

const API = '/api/remorse-chess/games';

const request = async <T>(url: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json' },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new Error(body.error ?? `Request failed (${response.status})`);
  return body;
};

export const useGames = () =>
  useQuery({
    queryKey: ['remorse-chess', 'games'],
    queryFn: () => request<GameSummary[]>(API),
  });

export const useCreateGame = () =>
  useMutation({
    mutationFn: (body: { mode: 'online' | 'local'; color: 'w' | 'b' }) =>
      request<{ id: number }>(API, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
  });

export type GameCommand =
  | { type: 'move'; from: string; to: string }
  | { type: 'selfHeal'; pieceId: string }
  | { type: 'skipExtraMove' }
  | { type: 'undo' }
  | { type: 'join' };

// Polls so the other player's moves show up; every command answers with the
// new game, and a stale version (409) refetches.
export const useGame = (id: number | undefined) => {
  const queryClient = useQueryClient();
  const key = ['remorse-chess', 'game', id];
  const query = useQuery({
    queryKey: key,
    queryFn: id ? () => request<GameResponse>(`${API}/${id}`) : skipToken,
    refetchInterval: 2000,
    staleTime: 0,
  });
  const mutation = useMutation({
    mutationFn: (command: GameCommand) =>
      request<GameResponse>(`${API}/${id}`, {
        method: 'POST',
        body: JSON.stringify({ ...command, version: query.data?.version }),
      }),
    onSuccess: (game) => queryClient.setQueryData(key, game),
    onError: () => queryClient.invalidateQueries({ queryKey: key }),
  });
  return { query, mutation };
};
