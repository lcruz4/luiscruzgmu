// k6 load test for remorse chess. run.sh bundles this with the game engine so
// the simulated players make legal moves. Settings are env vars (README.md).
//
// Each VU hosts one game, like the real client: every tick (POLL_S) each of
// its players polls the game (with ?since= its version, so an unchanged game
// answers 204), and after a think time the side to move plays.
// 7 in 10 VUs host an online game between two accounts, the rest a local game
// one account plays both sides of. Ticks are short so a stop lands quickly.
import { sleep } from 'k6';
import { SharedArray } from 'k6/data';
import exec from 'k6/execution';
import http, { type Params, type RefinedResponse } from 'k6/http';
import { Counter, Trend } from 'k6/metrics';
import type { Options, Scenario } from 'k6/options';
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

const SCENARIOS: Record<string, () => Scenario> = {
  smoke: () => ({
    executor: 'constant-vus',
    vus: num('VUS', 3),
    duration: env('DURATION', '1m'),
  }),
  hold: () => ({
    executor: 'constant-vus',
    vus: num('VUS', 50),
    duration: env('DURATION', '15m'),
  }),
  ramp: () => ({
    executor: 'ramping-vus',
    startVUs: 0,
    stages: rampStages(),
    gracefulRampDown: '5s',
  }),
};
const scenario = SCENARIOS[MODE];
if (!scenario) throw new Error(`MODE must be ${Object.keys(SCENARIOS)}`);

// Pass/fail marks in the summary only; the abort rules are in track()
export const options: Options = {
  scenarios: { [MODE]: scenario() },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    'http_req_duration{name:poll}': ['p(95)<500'],
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

// --- Requests, and the abort rules -----------------------------------------

type Response = RefinedResponse<'text'>;

const params = (account: Account, name: string): Params => ({
  headers: {
    Cookie: `session_id=${account.sessionId}`,
    'Content-Type': 'application/json',
  },
  tags: { name },
  timeout: TIMEOUT,
  // A signed-out page redirects to sign-in; count that as denied, don't follow
  redirects: 0,
});

let failureStreak = 0;
let deniedStreak = 0;

// Revoked sessions (the server-side kill switch) answer 401, and a server
// that's down fails or times out; either streak aborts the whole run.
const track = (res: Response) => {
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
  players: Account[];
  seats: Record<Color, Account>;
  game: GameResponse | null;
  // the version each player's client has (-1: none yet), sent as ?since=
  seen: number[];
  nextMoveAt: number;
  // the first `preplay` moves skip think time, so some games run long early
  preplay: number;
  played: number;
  rejected: number;
}

// Module scope is per VU, so this survives from one tick to the next
let table: Table | null = null;

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
  const created = parse<{ id: number }>(
    post(
      players[0],
      API,
      { mode: online ? 'online' : 'local', color: 'w' },
      'create game',
    ),
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
    players,
    seats: { w: players[0], b: players[players.length - 1] },
    game: null,
    seen: players.map(() => -1),
    nextMoveAt: 0,
    preplay: Math.floor(Math.random() * (PREPLAY_MAX + 1)),
    played: 0,
    rejected: 0,
  };
};

const poll = (t: Table) => {
  const responses = http.batch(
    t.players.map((account, i) => ({
      method: 'GET',
      url: `${BASE_URL}${API}/${t.id}${
        t.seen[i] < 0 ? '' : `?since=${t.seen[i]}`
      }`,
      params: params(account, 'poll'),
    })),
  );
  let latest: GameResponse | null = null;
  for (const [i, res] of responses.entries()) {
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

// Polls, then plays a move if it's time; returns false when the game is done
const tick = (t: Table) => {
  t.game = poll(t) ?? t.game;
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
    t.seen[t.players.indexOf(player)] = next.version;
    t.played += 1;
    t.nextMoveAt = Date.now() + thinkMs(t);
    moves.add(1);
  } else if (res.status === 400) {
    rejectedActions.add(1);
    t.rejected += 1;
    console.warn(`game ${t.id}: ${JSON.stringify(action)} → ${res.body}`);
    if (t.rejected >= 3) return false;
  }
  return true;
};

export default () => {
  const started = Date.now();
  table ??= openTable();
  if (table && !tick(table)) table = null;
  sleep(Math.max(0, POLL_S - (Date.now() - started) / 1000));
};
