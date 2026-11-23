import { createClient } from 'redis';
import { logger } from './logger';

// Live game updates across Next workers: a change publishes the game's new
// version on its channel, and each worker forwards it to its open streams.
// Unlike services/redis.ts these clients reconnect, since live play depends on them.

type Listener = (message: string) => void;

// Sent to every stream when the subscriber reconnects: events published while
// it was down are lost, so clients should refetch
export const RESYNC = 'resync';

const channelOf = (id: number) => `remorse:game:${id}`;

const publisher = createClient({ url: process.env.REDIS_URL });
const subscriber = publisher.duplicate();
const listeners = new Map<number, Set<Listener>>();
let subscriberReady = false;

publisher.on('error', (error) =>
  logger.error('Remorse live publisher error:', error),
);
subscriber.on('error', (error) => {
  subscriberReady = false;
  logger.error('Remorse live subscriber error:', error);
});
subscriber.on('ready', () => {
  const reconnect = subscriberReady === false && listeners.size > 0;
  subscriberReady = true;
  if (!reconnect) return;
  for (const set of listeners.values()) {
    for (const listener of set) listener(RESYNC);
  }
});
subscriber.on('end', () => {
  subscriberReady = false;
});

const connect = async () => {
  try {
    await Promise.all([publisher.connect(), subscriber.connect()]);
  } catch (error) {
    logger.error('Remorse live failed to connect to Redis:', error);
  }
};
await connect();

export const isLive = () => subscriberReady;

// Not awaited by callers: a failed publish only delays the other player until
// their fallback poll
export const publishGameChange = (id: number, version: number | 'deleted') =>
  publisher.isReady
    ? publisher
        .publish(channelOf(id), String(version))
        .catch((error) => logger.error('Remorse live publish failed:', error))
    : Promise.resolve();

// Returns the unsubscribe function
export const subscribeToGame = async (id: number, listener: Listener) => {
  let set = listeners.get(id);
  if (!set) {
    set = new Set();
    listeners.set(id, set);
    try {
      await subscriber.subscribe(channelOf(id), (message) => {
        for (const each of listeners.get(id) ?? []) each(message);
      });
    } catch (error) {
      listeners.delete(id);
      throw error;
    }
  }
  set.add(listener);
  return async () => {
    set.delete(listener);
    if (set.size || listeners.get(id) !== set) return;
    listeners.delete(id);
    await subscriber
      .unsubscribe(channelOf(id))
      .catch((error) =>
        logger.error('Remorse live unsubscribe failed:', error),
      );
  };
};
