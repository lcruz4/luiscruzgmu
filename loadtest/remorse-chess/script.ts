// k6 load test for remorse chess. run.sh bundles this with the game engine so
// the simulated players make legal moves. Settings are env vars (README.md).
//
// Each VU hosts one game, like the real client. In an online game each player
// holds the game's live stream open, refetches when the other player moves,
// and polls every LIVE_POLL_S as a backstop (every POLL_S while its stream is
// refused). A local game has no stream and polls every POLL_S. Polls send
// ?since= the version the player has, so an unchanged game answers 204.
// 7 in 10 VUs host an online game between two accounts, the rest a local game
// one account plays both sides of. Ticks are short so a stop lands quickly.
import { SharedArray } from 'k6/data';
import exec from 'k6/execution';
import http, { type Params, type RefinedResponse } from 'k6/http';
import { Counter, Trend } from 'k6/metrics';
import type { Options, Scenario } from 'k6/options';
import { setTimeout } from 'k6/timers';
import { inCheck, isHurt, legalMoves } from '@/lib/remorse/moves';
import type {
  Color,
  GameResponse,
  GameState,
  Piece,
  PromotionType,
} from '@/types/remorse';

const env = (name: string, fallback: string) => __ENV[name] || fallback;
const num = (name: string, fallback: number) =>
  Number(env(name, `${fallback}`));

const BASE_URL = env('BASE_URL', '').replace(/\/$/, '');
if (!BASE_URL) throw new Error('Set BASE_URL, e.g. BASE_URL=https://lcruz.dev');
const MODE = env('MODE', 'ramp');
const POLL_S = num('POLL_S', 2);
const LIVE_POLL_S = num('LIVE_POLL_S', 30);
const STREAM_S = num('STREAM_S', 60);
const LIVE_RETRY_S = 30;
const TICK_S = 1;
const THINK_MIN_S = num('THINK_MIN_S', 5);
const THINK_MAX_S = num('THINK_MAX_S', 15);
const PREPLAY_MAX = num('PREPLAY_MAX', 40);
const MAX_STEPS = num('MAX_STEPS', 150);
const TIMEOUT = env('TIMEOUT', '10s');
const ABORT_AFTER_FAILURES = num('ABORT_AFTER_FAILURES', 10);
const ABORT_AFTER_DENIED = num('ABORT_AFTER_DENIED', 3);

const API = '/api/remorse-chess/games';
const PAGE = '/projects/remorse-chess';

const rampStages = () =>
  env('STEPS', '10,25,50,100,150,200,300,400')
    .split(',')
    .flatMap((target) => [
      { duration: env('STEP_RAMP', '30s'), target: Number(target) },
      { duration: env('STEP_HOLD', '3m'), target: Number(target) },
    ]);

// Streams stop reopening once the scenario ends, and an iteration lasts until
// its streams time out, so the graceful stop has to cover one stream
const gracefulStop = `${STREAM_S + 15}s`;

const SCENARIOS: Record<string, () => Scenario> = {
  smoke: () => ({
    executor: 'constant-vus',
    vus: num('VUS', 3),
    duration: env('DURATION', '1m'),
    gracefulStop,
  }),
  hold: () => ({
    executor: 'constant-vus',
    vus: num('VUS', 50),
    duration: env('DURATION', '15m'),
    gracefulStop,
  }),
  ramp: () => ({
    executor: 'ramping-vus',
    startVUs: 0,
    stages: rampStages(),
    gracefulRampDown: '5s',
    gracefulStop,
  }),
};
const scenario = SCENARIOS[MODE];
if (!scenario) throw new Error(`MODE must be ${Object.keys(SCENARIOS)}`);

// Pass/fail marks in the summary only; the abort rules are in track()
export const options: Options = {
  scenarios: { [MODE]: scenario() },
  thresholds: {
    // Streams end in a timeout by design (STREAM_S), so they're left out
    'http_req_failed{stream:no}': ['rate<0.01'],
    'http_req_duration{stream:no}': ['p(95)<1000'],
    'http_req_duration{name:poll}': ['p(95)<500'],
    'http_req_duration{name:refetch}': ['p(95)<500'],
    'http_req_duration{name:move}': ['p(95)<1000'],
  },
  summaryTrendStats: ['avg', 'med', 'p(90)', 'p(95)', 'p(99)', 'max'],
  userAgent: 'remorse-loadtest/k6',
};

// A 409 is the game moving on under a stale version; the client refetches
http.setResponseCallback(http.expectedStatuses({ min: 200, max: 299 }, 409));

interface Account {
  email: string;
  sessionId: string;
}

const accounts: Account[] = new SharedArray('accounts', () =>
  open(env('ACCOUNTS', './accounts.csv'))
    .trim()
    .split('\n')
    .slice(1)
    .map((line) => {
      const [email, sessionId] = line.split(',');
      return { email, sessionId };
    }),
);

const moves = new Counter('moves');
const gamesStarted = new Counter('games_started');
const gamesFinished = new Counter('games_finished');
const rejectedActions = new Counter('rejected_actions');
const pollKb = new Trend('poll_kb');
const unchangedPolls = new Counter('unchanged_polls');
const streamsOpened = new Counter('streams_opened');
const streamsRefused = new Counter('streams_refused');

// --- Requests, and the abort rules -----------------------------------------

type Response = RefinedResponse<'text'>;

const params = (account: Account, name: string): Params => ({
  headers: {
    Cookie: `session_id=${account.sessionId}`,
    'Content-Type': 'application/json',
  },
  tags: { name, stream: 'no' },
  timeout: TIMEOUT,
  // A signed-out page redirects to sign-in; count that as denied, don't follow
  redirects: 0,
});

let failureStreak = 0;
let deniedStreak = 0;

// Revoked sessions (the server-side kill switch) answer 401, and a server
// that's down fails or times out; either streak aborts the whole run.
const track = <R extends Pick<Response, 'status' | 'error'>>(res: R) => {
  const denied =
    res.status === 401 ||
    res.status === 403 ||
    (res.status >= 300 && res.status < 400);
  deniedStreak = denied ? deniedStreak + 1 : 0;
  if (deniedStreak >= ABORT_AFTER_DENIED) {
    exec.test.abort(
      `${deniedStreak} sign-in rejections in a row (last ${res.status}): sessions revoked, or auth is down`,
    );
  }
  const failed = res.status === 0 || res.status === 429 || res.status >= 500;
  failureStreak = failed ? failureStreak + 1 : 0;
  if (failureStreak >= ABORT_AFTER_FAILURES) {
    exec.test.abort(
      `${failureStreak} failed requests in a row (last ${
        res.status || res.error
      })`,
    );
  }
  return res;
};

const get = (account: Account, path: string, name: string) =>
  track(http.get(`${BASE_URL}${path}`, params(account, name)));

const post = (account: Account, path: string, body: object, name: string) =>
  track(
    http.post(
      `${BASE_URL}${path}`,
      JSON.stringify(body),
      params(account, name),
    ),
  );

const delay = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

const parse = <T>(res: Response): T | null => {
  if (res.status !== 200 || !res.body) return null;
  try {
    return JSON.parse(res.body);
  } catch (_error) {
    return null;
  }
};

// --- Choosing an action ----------------------------------------------------

type Command =
  | { type: 'move'; from: string; to: string; promotion?: PromotionType }
  | { type: 'selfHeal'; pieceId: string }
  | { type: 'skipExtraMove' };

const pick = <T>(items: T[]) => items[Math.floor(Math.random() * items.length)];

const moveTo = (piece: Piece, to: string): Command => {
  const lastRank = piece.color === 'w' ? '8' : '1';
  return piece.type === 'p' && to[1] === lastRank
    ? { type: 'move', from: piece.square, to, promotion: 'q' }
    : { type: 'move', from: piece.square, to };
};

const chooseAction = (state: GameState): Command | null => {
  const own = state.pieces.filter((piece) => piece.color === state.turn);
  if (state.extraMovePieceId) {
    const piece = own.find((p) => p.id === state.extraMovePieceId);
    const targets = piece ? legalMoves(state, piece.square) : [];
    if (!piece || !targets.length || Math.random() < 0.3) {
      return { type: 'skipExtraMove' };
    }
    return moveTo(piece, pick(targets));
  }
  const choices = own.flatMap((piece) =>
    legalMoves(state, piece.square).map((to) => ({ piece, to })),
  );
  const heals = inCheck(state, state.turn)
    ? []
    : own.filter((piece) => piece.type === 'b' && isHurt(piece));
  if (heals.length && (!choices.length || Math.random() < 0.2)) {
    return { type: 'selfHeal', pieceId: pick(heals).id };
  }
  if (!choices.length) return null;
  const { piece, to } = pick(choices);
  return moveTo(piece, to);
};

// --- One VU's game ---------------------------------------------------------

interface Table {
  id: number;
  online: boolean;
  players: Account[];
  seats: Record<Color, Account>;
  game: GameResponse | null;
  // the version each player's client has (-1: none yet), sent as ?since=
  seen: number[];
  // per player: whether its live stream is open, and when it polls next
  live: boolean[];
  nextPollAt: number[];
  done: boolean;
  nextMoveAt: number;
  // the first `preplay` moves skip think time, so some games run long early
  preplay: number;
  played: number;
  rejected: number;
}

const LOCAL_SLOTS = [2, 5, 8];

const playersOfVu = () => {
  const id = exec.vu.idInTest;
  const first = (2 * (id - 1)) % accounts.length;
  return LOCAL_SLOTS.includes((id - 1) % 10)
    ? [accounts[first]]
    : [accounts[first], accounts[(first + 1) % accounts.length]];
};

const thinkMs = (t: Table) =>
  t.played < t.preplay
    ? 0
    : 1000 * (THINK_MIN_S + Math.random() * (THINK_MAX_S - THINK_MIN_S));

const openTable = (): Table | null => {
  const players = playersOfVu();
  const online = players.length === 2;
  for (const account of players) {
    get(account, PAGE, 'lobby page');
    get(account, API, 'list games');
  }
  const created = parse<{ id: number; color: Color }>(
    post(players[0], API, { mode: online ? 'online' : 'local' }, 'create game'),
  );
  if (!created) return null;
  const path = `${API}/${created.id}`;
  if (
    online &&
    !parse<GameResponse>(post(players[1], path, { type: 'join' }, 'join'))
  ) {
    return null;
  }
  for (const account of players) {
    get(account, `${PAGE}/${created.id}`, 'game page');
  }
  gamesStarted.add(1);
  return {
    id: created.id,
    online,
    players,
    seats:
      created.color === 'w'
        ? { w: players[0], b: players[players.length - 1] }
        : { w: players[players.length - 1], b: players[0] },
    game: null,
    seen: players.map(() => -1),
    live: players.map(() => false),
    nextPollAt: players.map(() => 0),
    done: false,
    nextMoveAt: 0,
    preplay: Math.floor(Math.random() * (PREPLAY_MAX + 1)),
    played: 0,
    rejected: 0,
  };
};

// k6 can't read a stream as it arrives, so this only holds the connection
// open; the VU knows when moves happen and refetches for the other player
// itself. The request times out after STREAM_S and reopens while the game
// lasts. A refused stream (503: Redis down) retries later, like the client.
// Past the scenario's end k6 interrupts iterations, and a stream reopened
// after that never settles, so the run would never finish
const ending = () => exec.scenario.progress >= 1;

const openStream = (t: Table, i: number) => {
  if (t.done || ending()) return;
  t.live[i] = true;
  streamsOpened.add(1);
  http
    .asyncRequest('GET', `${BASE_URL}${API}/${t.id}/live`, null, {
      headers: { Cookie: `session_id=${t.players[i].sessionId}` },
      tags: { name: 'live', stream: 'yes' },
      timeout: `${STREAM_S}s`,
      redirects: 0,
      responseType: 'none',
    })
    .then((res) => {
      // 1050: k6's request timeout, the stream's normal end here
      if (res.error_code === 1050) return openStream(t, i);
      t.live[i] = false;
      t.nextPollAt[i] = Math.min(t.nextPollAt[i], Date.now() + POLL_S * 1000);
      if (res.status === 503) streamsRefused.add(1);
      else track(res);
      setTimeout(() => openStream(t, i), LIVE_RETRY_S * 1000);
    });
};

const poll = (t: Table, players: number[], name: string) => {
  const responses = http.batch(
    players.map((i) => ({
      method: 'GET',
      url: `${BASE_URL}${API}/${t.id}${
        t.seen[i] < 0 ? '' : `?since=${t.seen[i]}`
      }`,
      params: params(t.players[i], name),
    })),
  );
  let latest: GameResponse | null = null;
  for (const [n, res] of responses.entries()) {
    const i = players[n];
    track(res);
    if (res.status === 204) unchangedPolls.add(1);
    if (res.status === 200 && typeof res.body === 'string') {
      pollKb.add(res.body.length / 1024);
    }
    const game = parse<GameResponse>(res);
    if (game) t.seen[i] = game.version;
    latest ??= game;
  }
  return latest;
};

// Polls whoever is due, then plays a move if it's time; returns false when
// the game is done
const tick = (t: Table) => {
  const now = Date.now();
  const due = t.players.flatMap((_, i) => (now >= t.nextPollAt[i] ? [i] : []));
  if (due.length) {
    t.game = poll(t, due, 'poll') ?? t.game;
    for (const i of due) {
      t.nextPollAt[i] = now + (t.live[i] ? LIVE_POLL_S : POLL_S) * 1000;
    }
  }
  const game = t.game;
  if (!game) return true;
  if (game.state.winner) {
    gamesFinished.add(1);
    return false;
  }
  if (game.steps.length >= MAX_STEPS) return false;
  if (Date.now() < t.nextMoveAt) return true;

  const action = chooseAction(game.state);
  if (!action) return false;
  const name = action.type === 'move' ? 'move' : action.type;
  const player = t.seats[game.state.turn];
  const res = post(
    player,
    `${API}/${t.id}`,
    { ...action, version: game.version },
    name,
  );
  const next = parse<GameResponse>(res);
  if (next) {
    t.game = next;
    const mover = t.players.indexOf(player);
    t.seen[mover] = next.version;
    t.played += 1;
    t.nextMoveAt = Date.now() + thinkMs(t);
    moves.add(1);
    // The other player's stream gets the new version, so its client refetches
    const other = t.players.findIndex((_, i) => i !== mover);
    if (t.online && t.live[other]) poll(t, [other], 'refetch');
  } else if (res.status === 400) {
    rejectedActions.add(1);
    t.rejected += 1;
    console.warn(`game ${t.id}: ${JSON.stringify(action)} → ${res.body}`);
    if (t.rejected >= 3) return false;
  }
  return true;
};

// One iteration plays one game. The iteration ends once its streams time out
// (up to STREAM_S), like a tab left open on a finished game.
export default async () => {
  const t = openTable();
  if (!t) {
    await delay(POLL_S * 1000);
    return;
  }
  if (t.online) {
    for (const i of t.players.keys()) openStream(t, i);
  }
  for (;;) {
    const started = Date.now();
    if (ending() || !tick(t)) break;
    await delay(Math.max(0, TICK_S * 1000 - (Date.now() - started)));
  }
  t.done = true;
};
