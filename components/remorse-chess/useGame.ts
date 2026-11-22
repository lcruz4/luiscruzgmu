import {
  skipToken,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import type {
  Color,
  GameResponse,
  GameSummary,
  MoveAction,
} from '@/types/remorse';

const API = '/api/remorse-chess/games';

// `current`: what to return on a 204, the server saying it's still current
const request = async <T>(
  url: string,
  init?: RequestInit,
  current?: T,
): Promise<T> => {
  const response = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json' },
  });
  if (response.status === 204 && current !== undefined) return current;
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
    mutationFn: (body: { mode: 'online' | 'local' }) =>
      request<{ id: number; color: Color }>(API, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
  });

export type GameCommand =
  | MoveAction
  | { type: 'selfHeal'; pieceId: string }
  | { type: 'skipExtraMove' }
  | { type: 'undo' }
  | { type: 'join' };

const fetchGame = (id: number, current: GameResponse | undefined) =>
  request(
    current ? `${API}/${id}?since=${current.version}` : `${API}/${id}`,
    undefined,
    current,
  );

// Polls so the other player's moves show up, sending the version it has so an
// unchanged game costs the server little; every command answers with the new
// game, and a stale version (409) refetches.
export const useGame = (id: number | undefined) => {
  const queryClient = useQueryClient();
  const key = ['remorse-chess', 'game', id];
  const query = useQuery({
    queryKey: key,
    queryFn: id
      ? () => fetchGame(id, queryClient.getQueryData<GameResponse>(key))
      : skipToken,
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
