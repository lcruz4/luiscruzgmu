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
  PlayerStats,
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

const GAMES_KEY = ['remorse-chess', 'games'];

// Polls (slower in a background tab) so the lobby can say when a game is
// waiting on you
export const useGames = () =>
  useQuery({
    queryKey: GAMES_KEY,
    queryFn: () => request<GameSummary[]>(API),
    refetchInterval: () =>
      typeof document !== 'undefined' && document.hidden ? 60_000 : 15_000,
    refetchIntervalInBackground: true,
  });

const PROFILE_KEY = ['remorse-chess', 'profile'];

// chosen: they've picked a name, or kept the default when asked
type Profile = { username: string; chosen: boolean };

export const useProfile = () =>
  useQuery({
    queryKey: PROFILE_KEY,
    queryFn: () => request<Profile>('/api/remorse-chess/profile'),
  });

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    // null keeps the default name
    mutationFn: (username: string | null) =>
      request<Profile>('/api/remorse-chess/profile', {
        method: 'PUT',
        body: JSON.stringify({ username }),
      }),
    onSuccess: (profile) => {
      queryClient.setQueryData(PROFILE_KEY, profile);
      queryClient.invalidateQueries({ queryKey: GAMES_KEY });
    },
  });
};

export const useStats = () =>
  useQuery({
    queryKey: ['remorse-chess', 'stats'],
    queryFn: () => request<PlayerStats>('/api/remorse-chess/stats'),
  });

export const useCreateGame = () =>
  useMutation({
    mutationFn: (body: { mode: 'online' | 'local' } | { rematchOf: number }) =>
      request<{ id: number; color: Color }>(API, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
  });

export const useArchive = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, archived }: { id: number; archived: boolean }) =>
      request<GameResponse>(`${API}/${id}`, {
        method: 'POST',
        body: JSON.stringify({ type: archived ? 'archive' : 'unarchive' }),
      }),
    onMutate: ({ id, archived }) =>
      queryClient.setQueryData<GameSummary[]>(
        GAMES_KEY,
        (games) =>
          games?.map((game) => (game.id === id ? { ...game, archived } : game)),
      ),
    onSettled: () => queryClient.invalidateQueries({ queryKey: GAMES_KEY }),
  });
};

export type GameCommand =
  | MoveAction
  | { type: 'selfHeal'; pieceId: string }
  | { type: 'skipExtraMove' }
  | { type: 'undo' }
  | { type: 'resign' }
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
