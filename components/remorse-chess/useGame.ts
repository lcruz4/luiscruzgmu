import {
  skipToken,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import type { PlayerIcon } from '@/lib/remorse/icons';
import type { BoardThemeId } from '@/lib/remorse/boardThemes';
import type { PieceSetId } from '@/lib/remorse/pieceSets';
import type { TutorialKey } from '@/lib/remorse/tutorial';
import type { TraumaPercents } from '@/lib/remorse/balance';
import type { TimeCategory } from '@/lib/remorse/timeControls';
import type {
  Color,
  GameResponse,
  GameSummary,
  MoveAction,
  NewFollower,
  PlayerPage,
  PlayerRef,
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
  // A body cut short (e.g. iOS suspending the tab) must throw, not become {}
  if (response.ok) return response.json();
  const body = await response.json().catch(() => ({}));
  throw new Error(body.error ?? `Request failed (${response.status})`);
};

export const GAMES_KEY = ['remorse-chess', 'games'];

export const fetchGames = () => request<GameSummary[]>(API);

// Polls (slower in a background tab) so the lobby can say when a game is
// waiting on you; refetches on every visit since games change elsewhere
export const useGames = () =>
  useQuery({
    queryKey: GAMES_KEY,
    queryFn: fetchGames,
    refetchOnMount: 'always',
    refetchInterval: () =>
      typeof document !== 'undefined' && document.hidden ? 60_000 : 15_000,
    refetchIntervalInBackground: true,
  });

const PROFILE_KEY = ['remorse-chess', 'profile'];

// chosen: they've picked a name, or kept the default when asked
type Profile = {
  id: number | null;
  username: string;
  icon: PlayerIcon | null;
  pieceSet: PieceSetId | null;
  boardTheme: BoardThemeId | null;
  chosen: boolean;
  tutorialSeen: TutorialKey[];
  ratings: Record<TimeCategory, number>;
};

export const useProfile = () =>
  useQuery({
    queryKey: PROFILE_KEY,
    queryFn: () => request<Profile>('/api/remorse-chess/profile'),
  });

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    // username null keeps the default name
    mutationFn: (body: {
      username?: string | null;
      icon?: PlayerIcon;
      pieceSet?: PieceSetId;
      boardTheme?: BoardThemeId;
      tutorialSeen?: TutorialKey[];
    }) =>
      request<Profile>('/api/remorse-chess/profile', {
        method: 'PUT',
        body: JSON.stringify(body),
      }),
    onSuccess: (profile) => {
      queryClient.setQueryData(PROFILE_KEY, profile);
      queryClient.invalidateQueries({ queryKey: GAMES_KEY });
    },
  });
};

// Marks tutorial pieces seen right away; the save happens in the background
export const useMarkTutorialSeen = () => {
  const queryClient = useQueryClient();
  const { mutate } = useMutation({
    mutationFn: (keys: TutorialKey[]) =>
      request<Profile>('/api/remorse-chess/profile', {
        method: 'PUT',
        body: JSON.stringify({ tutorialSeen: keys }),
      }),
    onSuccess: (profile) => queryClient.setQueryData(PROFILE_KEY, profile),
  });
  return useCallback(
    (keys: TutorialKey[]) => {
      queryClient.setQueryData<Profile>(PROFILE_KEY, (profile) =>
        profile
          ? {
              ...profile,
              tutorialSeen: [...new Set([...profile.tutorialSeen, ...keys])],
            }
          : profile,
      );
      mutate(keys);
    },
    [queryClient, mutate],
  );
};

export const useStats = () =>
  useQuery({
    queryKey: ['remorse-chess', 'stats'],
    queryFn: () => request<PlayerStats>('/api/remorse-chess/stats'),
  });

export const useCreateGame = () =>
  useMutation({
    mutationFn: (
      body:
        | {
            mode: 'online' | 'local' | 'random';
            balanced?: boolean;
            timeControl: string;
          }
        | { rematchOf: number; balanced?: boolean }
        | { challenge: number; balanced?: boolean; timeControl: string },
    ) =>
      request<{ id: number; color: Color }>(API, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
  });

const playerKey = (id: number | undefined) => ['remorse-chess', 'player', id];
const MUTUALS_KEY = ['remorse-chess', 'mutuals'];

export const usePlayer = (id: number | undefined) =>
  useQuery({
    queryKey: playerKey(id),
    queryFn: id
      ? () => request<PlayerPage>(`/api/remorse-chess/players/${id}`)
      : skipToken,
  });

// Players you can challenge: you follow each other
export const useMutuals = () =>
  useQuery({
    queryKey: MUTUALS_KEY,
    queryFn: () => request<PlayerRef[]>('/api/remorse-chess/players'),
  });

export const useFollow = (id: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (following: boolean) =>
      request<null>(
        `/api/remorse-chess/players/${id}`,
        {
          method: 'POST',
          body: JSON.stringify({ type: following ? 'follow' : 'unfollow' }),
        },
        null,
      ),
    onSuccess: (_result, following) =>
      queryClient.setQueryData<PlayerPage>(playerKey(id), (player) =>
        player ? { ...player, following } : player,
      ),
    onSettled: () => queryClient.invalidateQueries({ queryKey: MUTUALS_KEY }),
  });
};

const NEW_FOLLOWERS_KEY = ['remorse-chess', 'new-followers'];

export const useNewFollowers = () =>
  useQuery({
    queryKey: NEW_FOLLOWERS_KEY,
    queryFn: () => request<NewFollower[]>('/api/remorse-chess/followers'),
    refetchOnMount: 'always',
  });

// Answers a new follower: follow them back, or just dismiss them
export const useAnswerFollower = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, followBack }: { id: number; followBack: boolean }) =>
      followBack
        ? request<null>(
            `/api/remorse-chess/players/${id}`,
            { method: 'POST', body: JSON.stringify({ type: 'follow' }) },
            null,
          )
        : request<null>(
            '/api/remorse-chess/followers',
            { method: 'POST', body: JSON.stringify({ playerId: id }) },
            null,
          ),
    onSuccess: (_result, { id }) =>
      queryClient.setQueryData<NewFollower[]>(
        NEW_FOLLOWERS_KEY,
        (followers) => followers?.filter((follower) => follower.id !== id),
      ),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: NEW_FOLLOWERS_KEY });
      queryClient.invalidateQueries({ queryKey: MUTUALS_KEY });
    },
  });
};

// Answers the suggestion to play someone balanced, so it isn't shown again
export const useAnswerBalanceSuggestion = () =>
  useMutation({
    mutationFn: ({
      playerId,
      accepted,
    }: {
      playerId: number;
      accepted: boolean;
    }) =>
      request<null>(
        `/api/remorse-chess/players/${playerId}`,
        {
          method: 'POST',
          body: JSON.stringify({ type: 'balanceSuggestion', accepted }),
        },
        null,
      ),
  });

// Takes the seat a challenge holds for you
export const useAcceptChallenge = () =>
  useMutation({
    mutationFn: (id: number) =>
      request<GameResponse>(`${API}/${id}`, {
        method: 'POST',
        body: JSON.stringify({ type: 'join' }),
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

export const useCancelGame = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      request<null>(`${API}/${id}`, { method: 'DELETE' }, null),
    onSuccess: (_result, id) =>
      queryClient.setQueryData<GameSummary[]>(
        GAMES_KEY,
        (games) => games?.filter((game) => game.id !== id),
      ),
    onSettled: () => queryClient.invalidateQueries({ queryKey: GAMES_KEY }),
  });
};

export type GameCommand =
  | MoveAction
  | { type: 'bishopHeal'; pieceId: string }
  | { type: 'skipExtraMove' }
  | { type: 'resign' }
  | { type: 'flag' }
  | { type: 'join'; inviteToken?: string }
  | { type: 'setOdds'; odds: Record<Color, TraumaPercents> };

const fetchGame = (id: number, current: GameResponse | undefined) =>
  request(
    current ? `${API}/${id}?since=${current.version}` : `${API}/${id}`,
    undefined,
    current,
  );

// How often to poll while the live stream is open (only a safety net for a
// missed event), and how long to wait before reopening a stream the browser
// gave up on
const LIVE_POLL_MS = 30_000;
const POLL_MS = 2000;
const LIVE_RETRY_MS = 30_000;

// The game's live stream sends its version on connect and on every change;
// one we don't have refetches the game. setLive: whether it's connected.
const useLiveGame = (
  id: number | undefined,
  online: boolean,
  setLive: (live: boolean) => void,
) => {
  const queryClient = useQueryClient();
  useEffect(() => {
    if (!id || !online) return;
    const key = ['remorse-chess', 'game', id];
    let source: EventSource | undefined;
    let retry: ReturnType<typeof setTimeout> | undefined;
    const open = () => {
      const current = new EventSource(`${API}/${id}/live`);
      source = current;
      current.onopen = () => setLive(true);
      current.onmessage = (event) => {
        const game = queryClient.getQueryData<GameResponse>(key);
        if (game && event.data !== String(game.version)) {
          queryClient.invalidateQueries({ queryKey: key });
        }
      };
      current.onerror = () => {
        setLive(false);
        // CLOSED: the server refused (e.g. 503) and the browser won't retry
        if (current.readyState === EventSource.CLOSED) {
          retry = setTimeout(open, LIVE_RETRY_MS);
        }
      };
    };
    open();
    return () => {
      clearTimeout(retry);
      source?.close();
      setLive(false);
    };
  }, [id, online, queryClient, setLive]);
};

// Gets the other player's moves from the live stream, polling slowly as a
// backstop (or every 2s while the stream is down). Polls send the version it
// has so an unchanged game costs the server little; every command answers
// with the new game, and a stale version (409) refetches.
export const useGame = (id: number | undefined) => {
  const queryClient = useQueryClient();
  const key = ['remorse-chess', 'game', id];
  const [live, setLive] = useState(false);
  const query = useQuery({
    queryKey: key,
    queryFn: id
      ? () => fetchGame(id, queryClient.getQueryData<GameResponse>(key))
      : skipToken,
    refetchInterval: live ? LIVE_POLL_MS : POLL_MS,
    staleTime: 0,
  });
  useLiveGame(id, query.data?.mode === 'online', setLive);
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
