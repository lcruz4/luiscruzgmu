import { isDeploying } from './deployStatus';
import { logger } from './logger';
import { ensurePlayer, remorsePool } from './remorseDb';
import { notifyDeployDone } from './remorsePush';

const WATCH_MS = 30_000;

export const addDeployWaiter = async (email: string) => {
  await ensurePlayer(remorsePool, email);
  await remorsePool.query(
    `INSERT INTO deploy_waiters (email)
     VALUES ($1)
     ON CONFLICT DO NOTHING`,
    [email],
  );
};

export const isDeployWaiter = async (email: string) => {
  const { rowCount } = await remorsePool.query(
    `SELECT 1
     FROM deploy_waiters
     WHERE email = $1`,
    [email],
  );
  return Boolean(rowCount);
};

// Once no deploy is running, pushes to everyone waiting on one. The deploy
// restarts the server, so the new one sends what the old one couldn't.
const notifyWaiters = async () => {
  const waiting = await remorsePool.query(
    `SELECT 1
     FROM deploy_waiters
     LIMIT 1`,
  );
  if (!waiting.rowCount || (await isDeploying())) return;
  const { rows } = await remorsePool.query<{ email: string }>(
    `DELETE FROM deploy_waiters
     RETURNING email`,
  );
  await Promise.all(
    rows.map(({ email }) =>
      notifyDeployDone(email).catch((error) =>
        logger.error('Remorse deploy push failed:', error),
      ),
    ),
  );
};

declare global {
  var remorseDeployWatch: ReturnType<typeof setInterval> | undefined;
}

export const startDeployWatch = () => {
  if (globalThis.remorseDeployWatch || !process.env.REMORSE_DB_URL) return;
  globalThis.remorseDeployWatch = setInterval(() => {
    notifyWaiters().catch((error) =>
      logger.error('Remorse deploy watch failed:', error),
    );
  }, WATCH_MS);
};
