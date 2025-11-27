import { createClient } from 'redis';
import { logger } from './logger';
import { RedisClientType } from '@redis/client';

interface WithCacheOptions {
  key: string;
  keyOnSet?: string;
}

interface WithCacheWithExtraDataOptions<T extends Record<string, unknown>>
  extends WithCacheOptions {
  extraData: T;
}

// ----------------------------------------------------------------------------
// Type Guards
// ----------------------------------------------------------------------------

const isOptions = (
  obj:
    | string
    | WithCacheOptions
    | WithCacheWithExtraDataOptions<Record<string, unknown>>,
): obj is
  | WithCacheOptions
  | WithCacheWithExtraDataOptions<Record<string, unknown>> => {
  return typeof obj !== 'string';
};

const isWithCacheWithExtraDataOptions = <T extends Record<string, unknown>>(
  obj: string | WithCacheOptions | WithCacheWithExtraDataOptions<T>,
): obj is WithCacheWithExtraDataOptions<T> => {
  return obj.hasOwnProperty('extraData');
};

class RedisService {
  private _client?: RedisClientType;

  async init() {
    if (!this._client) {
      try {
        this._client = createClient({
          url: process.env.REDIS_URL,
          socket: {
            reconnectStrategy: false,
          },
        });

        this._client.on('error', (err) =>
          logger.error('Redis Client Error>', err),
        );
        await this._client.connect();
      } catch (error) {
        logger.error('Failed to create Redis client:', error);
        this._client = undefined;
      }
    }

    return this;
  }

  keys(pattern: string) {
    if (!this._client) {
      logger.debug('Redis client is not connected, cannot fetch keys.');
      return Promise.resolve([]);
    }
    return this._client.keys(pattern);
  }

  // OVERLOADS When extraData is provided, T must extend Record<string, unknown>
  withCache<T, U extends Record<string, unknown>>(
    keyOrOpts: WithCacheWithExtraDataOptions<U>,
    callback: () => Promise<T>,
  ): Promise<T & U>;
  withCache<T>(
    keyOrOpts: string | WithCacheOptions,
    callback: () => Promise<T>,
  ): Promise<T>;
  async withCache<T extends U, U extends Record<string, unknown>>(
    keyOrOpts: string | WithCacheOptions | WithCacheWithExtraDataOptions<U>,
    callback: () => Promise<T>,
  ): Promise<T> {
    if (!this._client) {
      logger.debug('Redis client is not connected, skipping cache.');
      return callback();
    }
    const options = isOptions(keyOrOpts) ? keyOrOpts : { key: keyOrOpts };
    const key = options.key;
    const keyOnSet = options?.keyOnSet ?? key;
    const extraData = isWithCacheWithExtraDataOptions(options)
      ? options.extraData
      : undefined;

    const cachedData = await this._client.get(key);
    if (cachedData) {
      logger.debug(`Cache hit for key: [${key}]`);
      return JSON.parse(cachedData) as T;
    }

    logger.debug(`Cache miss for key: [${key}]`);
    const data = await callback();

    // Merge extraData if provided
    const dataToCache = extraData ? { ...data, ...extraData } : data;

    await this._client.set(keyOnSet, JSON.stringify(dataToCache));
    logger.debug(`Cache set for key: [${keyOnSet}]`);
    return data;
  }
}

export const redis = await new RedisService().init();
