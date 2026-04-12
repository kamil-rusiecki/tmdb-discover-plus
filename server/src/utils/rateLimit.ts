import { rateLimit, type Options } from 'express-rate-limit';
import { createLogger } from './logger.ts';
import { config } from '../config.ts';
import type { Request, Response } from 'express';

const log = createLogger('rateLimit');

let createStore: ((prefix: string) => Options['store']) | null = null;

if (config.cache.redisUrl) {
  try {
    const { RedisStore } = await import('rate-limit-redis');
    const { createClient } = await import('redis');
    const redisClient = createClient({ url: config.cache.redisUrl });
    await redisClient.connect();
    createStore = (prefix: string) =>
      new RedisStore({
        sendCommand: (...args: string[]) => redisClient.sendCommand(args),
        prefix,
      });
    log.info('Rate limiting backed by Redis');
  } catch (err) {
    log.warn('Redis rate-limit store unavailable, using in-memory', {
      error: (err as Error).message,
    });
  }
}

const baseOptions: Partial<Options> = {
  standardHeaders: true,
  legacyHeaders: true,
  validate: { trustProxy: true },
  skip: (req: Request) => {
    if (config.features.disableRateLimit) return true;

    const isDevOrTest = config.nodeEnv === 'development' || config.nodeEnv === 'test';
    const ip = req.ip || req.headers['x-forwarded-for'];
    const isLocalhost =
      ip === '127.0.0.1' || ip === '::1' || ip === 'localhost' || ip === '::ffff:127.0.0.1';

    return isDevOrTest && isLocalhost;
  },
  handler: (req, res, _next, options) => {
    log.warn('Rate limit exceeded', {
      ip: req.ip,
      url: req.originalUrl,
      limit: options.limit,
    });
    res.status(429).json({
      error: options.message,
      retryAfter: Math.ceil(options.windowMs / 1000),
    });
  },
};

const withStore = (prefix: string): Partial<Options> =>
  createStore ? { store: createStore(prefix) } : {};

/**
 * Rate limit for sensitive endpoints (login, config creation)
 */
export const strictRateLimit = rateLimit({
  ...baseOptions,
  ...withStore('rl:strict:'),
  windowMs: 60 * 1000, // 1 minute
  limit: 60,
  message: 'Too many requests to this endpoint, please try again later',
});

/**
 * Standard rate limit for API endpoints
 */
export const apiRateLimit = rateLimit({
  ...baseOptions,
  ...withStore('rl:api:'),
  windowMs: 60 * 1000,
  limit: 300,
  message: 'Too many API requests, please try again later',
});

/**
 * Relaxed rate limit for addon endpoints (catalog/manifest)
 */
export const addonRateLimit = rateLimit({
  ...baseOptions,
  ...withStore('rl:addon:'),
  windowMs: 60 * 1000,
  limit: 1000,
  message: 'Rate limit exceeded',
});

export const monitoringRateLimit = rateLimit({
  ...baseOptions,
  ...withStore('rl:monitor:'),
  windowMs: 60 * 1000,
  limit: 30,
  message: 'Too many monitoring requests, please try again later',
});
