import { isLive } from '@/lib/remorse/timeControls';
import { logger } from './logger';
import { expireOverdueGames, type FirstMoveAbort, getGame } from './remorseDb';
import { publishGameChange } from './remorseLive';
import { notifyFirstMoveAbort, notifyTimeout } from './remorsePush';

// A game nobody started: gone for anyone watching, and both players told
export const announceAbort = ({
  id,
  emails,
  name,
  timeControl,
}: FirstMoveAbort) => {
  publishGameChange(id, 'deleted');
  if (isLive(timeControl)) return;
  notifyFirstMoveAbort(emails, name).catch((error) =>
    logger.error('Remorse notify failed:', error),
  );
};

// Ends games whose side to move ran out of time and tells both players. Runs
// before reads (so a game nobody flagged still shows its result) and on the
// sweep (so a daily game ends, and pushes, with nobody looking).
export const expireGames = async (filter: { id?: number; email?: string }) => {
  const { ended, aborted } = await expireOverdueGames(filter);
  for (const abort of aborted) announceAbort(abort);
  for (const id of ended) {
    const game = await getGame(id, '');
    publishGameChange(id, game.version);
    notifyTimeout(game).catch((error) =>
      logger.error('Remorse notify failed:', error),
    );
  }
};

const SWEEP_MS = 60_000;

declare global {
  // one sweep per process, through dev hot reloads
  var remorseClockSweep: ReturnType<typeof setInterval> | undefined;
}

export const startClockSweep = () => {
  if (globalThis.remorseClockSweep || !process.env.REMORSE_DB_URL) return;
  globalThis.remorseClockSweep = setInterval(() => {
    expireGames({}).catch((error) =>
      logger.error('Remorse clock sweep failed:', error),
    );
  }, SWEEP_MS);
};
