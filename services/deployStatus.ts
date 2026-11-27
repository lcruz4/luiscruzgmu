import { DEPLOYING_CODE } from '@/lib/remorse/deploy';
import { HttpError } from './api';
import { logger } from './logger';

// True from the moment a deploy starts, including while it waits for live
// games to finish
const STATUS_URL = process.env.FLASK_API_URL
  ? `${process.env.FLASK_API_URL}/deploy/luiscruzgmu/status`
  : null;
const CACHE_MS = 5_000;

let cached: { deploying: boolean; at: number } | null = null;

// Can't reach the status: assume no deploy rather than block every live game
export const isDeploying = async () => {
  if (!STATUS_URL) return false;
  if (cached && Date.now() - cached.at < CACHE_MS) return cached.deploying;
  let deploying = false;
  try {
    const response = await fetch(STATUS_URL, {
      signal: AbortSignal.timeout(3_000),
    });
    if (!response.ok) throw new Error(`status ${response.status}`);
    const body: unknown = await response.json();
    deploying =
      typeof body === 'object' &&
      body !== null &&
      'deploying' in body &&
      body.deploying === true;
  } catch (error) {
    logger.warn('Deploy status check failed:', error);
  }
  cached = { deploying, at: Date.now() };
  return deploying;
};

// A deploy waits for every running live clock, so none may start during one
export const assertNotDeploying = async () => {
  if (await isDeploying()) {
    throw new HttpError(
      503,
      'Live games are paused while an update is going out',
      DEPLOYING_CODE,
    );
  }
};
