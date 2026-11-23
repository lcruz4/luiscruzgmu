# Remorse chess load test

k6 plays real games against the API, the way the browser client does. Each VU
hosts one game. After a think time, the side to move plays a legal move from
the game engine.

- 7 in 10 VUs host an **online** game between two accounts (create, then join).
  Each player holds the game's live stream (`/live`) open, refetches the game
  when the other player moves (what the stream's event triggers in the
  browser), and polls every `LIVE_POLL_S` (30s) as a backstop. If the stream is
  refused (503: Redis down) that player polls every `POLL_S` (2s) and retries
  the stream after 30s, like the client.
- The rest host a **local** game that one account plays both sides of. Local
  games have no stream and poll every `POLL_S`.
- k6 can't read a stream as it arrives, so it only holds the connection open
  and times it out every `STREAM_S` (60s), then reopens it. Those timeouts show
  as `Request Failed` warnings and inflate the overall `http_req_duration` and
  `http_req_failed`; use the `{stream:no}` lines instead. `streams_opened` and
  `streams_refused` count them.
- 1 VU ≈ 1.7 players ≈ 0.4 req/s plus 1.4 open streams. Every request also
  passes through the lcruz_auth check (a stream once per connect). The default
  ramp is 10→400 VUs: about 17→680 players, 4→160 req/s and up to about 560
  open streams.
- Before a new game, each of its players loads the lobby page and the game
  list. After the game is created, each loads the game page (server-rendered).
- The first `PREPLAY_MAX` moves of each game skip think time, so some games run
  long early. Polls return the whole history, so long games make polls heavier.
  After `MAX_STEPS` steps the VU starts a new game, once the old game's streams
  time out (up to `STREAM_S`, like a tab left open).

## Setup

1. `brew install k6` and `npm install`.
2. Make the accounts: `node loadtest/remorse-chess/accounts.mjs 100`. This writes
   `out/accounts.csv` (for k6) and `out/auth-seed.sql`. Both hold live session
   ids and are gitignored.
3. Run `out/auth-seed.sql` against the **prod lcruz_auth DB** yourself, with
   `psql "<lcruz_auth DB URL>" -f loadtest/remorse-chess/out/auth-seed.sql`. It
   creates `loadtest-NNN@loadtest.invalid` users with the remorse-chess role and
   sessions that expire in 24h. Running it again replaces the sessions.

## Run

```bash
BASE_URL=https://lcruz.dev ./loadtest/remorse-chess/run.sh
```

- Live dashboard: http://localhost:5665
- HTML report and summary JSON: `out/`
- Extra args go to `k6 run`.

| Env                          | Default                        |                                                                                          |
| ---------------------------- | ------------------------------ | ---------------------------------------------------------------------------------------- |
| `BASE_URL`                   | required                       |                                                                                          |
| `MODE`                       | `ramp`                         | `ramp`: step through `STEPS`. `hold`: `VUS` for `DURATION`. `smoke`: 3 VUs for 1m        |
| `STEPS`                      | `10,25,50,100,150,200,300,400` | VU levels for `ramp`. Each ramps over `STEP_RAMP` (30s), then holds for `STEP_HOLD` (3m) |
| `VUS`, `DURATION`            | 50, `15m`                      | for `hold` (smoke: 3, `1m`)                                                              |
| `POLL_S`                     | 2                              | the client's poll for local games, or while its stream is refused                        |
| `LIVE_POLL_S`                | 30                             | the client's backstop poll while its stream is open                                      |
| `STREAM_S`                   | 60                             | how long k6 holds a stream before reopening it                                           |
| `THINK_MIN_S`, `THINK_MAX_S` | 5, 15                          | time between moves                                                                       |
| `PREPLAY_MAX`                | 40                             |                                                                                          |
| `MAX_STEPS`                  | 150                            |                                                                                          |
| `TIMEOUT`                    | `10s`                          | per request. A timeout counts as a failure                                               |
| `ABORT_AFTER_FAILURES`       | 10                             | one VU's consecutive failures (timeouts, 429, 5xx) before the run aborts                 |
| `ABORT_AFTER_DENIED`         | 3                              | one VU's consecutive 401/403/redirects before the run aborts                             |

Smoke it first: `BASE_URL=https://lcruz.dev MODE=smoke ./loadtest/remorse-chess/run.sh`

## Stopping it

- **Ctrl+C** in the k6 terminal.
- **From another terminal on the same machine:** `./loadtest/remorse-chess/stop.sh`
- **From the server:** run `stop-from-server.sql` against the lcruz_auth DB. It
  revokes the sessions, every request gets a 401, and k6 aborts within seconds.
  Re-seed to test again.
- **Automatic:** a VU that sees `ABORT_AFTER_FAILURES` failures or
  `ABORT_AFTER_DENIED` sign-in rejections in a row aborts the whole run. A dead
  server trips this in about 10s.

k6 v2 dropped live scaling (`k6 scale`, pause), so to sit at one level, use
`MODE=hold VUS=n`.

## Server-side notes

- Requests carry the User-Agent `remorse-loadtest/k6`, so nginx logs can be
  filtered on it.
- lcruz.dev sits behind Cloudflare. Its bot and rate rules may challenge or
  block one IP sending hundreds of req/s, which shows up as 403/429 and trips an
  abort. Add a WAF skip rule for the load generator's IP during the run.
- The whole box is under load, so the portfolio, workout tracker and
  chess-review slow down too. A run with many 5xx can burn Sentry quota.

## Cleanup (you run these against prod)

```bash
psql "<remorse_chess DB URL>" -f loadtest/remorse-chess/remorse-cleanup.sql
```

```bash
psql "<lcruz_auth DB URL>" -f loadtest/remorse-chess/auth-cleanup.sql
```
