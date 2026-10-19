# CLAUDE.md

Personal portfolio site (lcruz.dev) plus side projects, built on Next.js **Pages Router**.

## Commands

- `npm run dev` / `npm run build` / `npm start`
- `npm test` — Jest (ts-jest, node env). Only covers `services/`; Stockfish tests spawn the real `stockfish` binary (must be installed) and are slow.
- Node version in `.nvmrc`. Prettier: single quotes (incl. JSX).
- Pre-commit hook (husky + lint-staged): ESLint + prettier on staged files, `tsc --noEmit`, Jest without Stockfish tests.

## Structure

- `pages/` — routes. `index.tsx` is the portfolio; `projects/*` are standalone apps (chess-review, reward-chart, kuromasu).
- `pages/api/` — API routes:
  - `chess-review` — Stockfish game analysis
  - `*-sticker(s)` — reward-chart CRUD against Postgres (`pg`, `DB_URL`)
  - `kitty-sort`, `remember-that`, `sms-code` — MacroDroid automations, Basic auth via `verifyMacroDroid` (`lib/utils.ts`)
  - `contactMe` (Mailjet), `random-gif` (Giphy)
- `components/<feature>/` — UI grouped by feature; `components/ui/` is shadcn.
- `services/` — server-only singletons: `stockfish.ts` (pooled engine processes + Redis cache), `redis.ts` (`withCache` helper; no-ops gracefully if Redis is down), `logger.ts` (use instead of `console`; `LOG_LEVEL` env).
- `lib/` — shared utils (`cn`, auth) and solvers. `helpers/` — constants, chess helpers. `types/` — shared types.
- `store/` — Zustand (nav state). `themes/` — Emotion theme.

## Conventions

- Path alias `@/*` → repo root.
- Arrow functions only (`eslint.config.mjs`, checked on staged files). Older files still have `function` declarations; convert them when you touch the file.
- Styling is mixed: older portfolio components use Emotion `styled` + theme; newer project pages use Tailwind v4 + shadcn. Match the surrounding file.
- Data fetching on the client via TanStack Query.
- Sentry configured in `sentry.*.config.ts` and `next.config.js`.

## Deploy

Push to `main` → GitHub Action calls the deploy webhook on lcruz.dev. No CI tests.

## Commit

Commit and rebase as `luis <luiscruzgmu@gmail.com>`: `git -c user.name="luis" -c user.email="luiscruzgmu@gmail.com" commit ...` (same `-c` flags for `rebase`). This overrides global instructions.
Don't prefix commit messages with `[AI agent commit]`. This overrides global instructions.
Never use the Slack skill when pushing changes or opening PRs in this project.

## GitHub CLI

The active `gh` account (luiscruzih) isn't a collaborator on this repo. Run every `gh` command as lcruz4: `GH_TOKEN=$(gh auth token --user lcruz4) gh ...`. Don't switch the active account.
