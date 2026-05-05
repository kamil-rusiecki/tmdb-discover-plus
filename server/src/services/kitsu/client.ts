import { createLogger } from '../../utils/logger.ts';
import { TIMEOUTS, CIRCUIT_BREAKER_DEFAULTS } from '../../constants.ts';
import { ADDON_VERSION } from '../../version.ts';

const log = createLogger('kitsu:client');

const KITSU_API_BASE = 'https://kitsu.io/api/edge';
const KITSU_API_ORIGIN = 'https://kitsu.io';
const MIN_INTERVAL_MS = 100;
const KITSU_HEADERS = {
  Accept: 'application/vnd.api+json',
  'Content-Type': 'application/vnd.api+json',
  'User-Agent': `TMDB-Discover-Plus/${ADDON_VERSION} (+https://github.com/semi-column/tmdb-discover-plus)`,
} as const;

let lastRequestTime = 0;
const requestQueue: Array<{ resolve: () => void; reject: (err: Error) => void }> = [];
let processingQueue = false;

async function processQueue(): Promise<void> {
  if (processingQueue) return;
  processingQueue = true;
  while (requestQueue.length > 0) {
    const now = Date.now();
    const elapsed = now - lastRequestTime;
    if (elapsed < MIN_INTERVAL_MS) {
      await new Promise((r) => setTimeout(r, MIN_INTERVAL_MS - elapsed));
    }
    lastRequestTime = Date.now();
    const item = requestQueue.shift();
    item?.resolve();
  }
  processingQueue = false;
}

async function acquireSlot(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (requestQueue.length >= 100) {
      reject(new Error('Kitsu request queue full'));
      return;
    }
    requestQueue.push({ resolve, reject });
    processQueue();
  });
}

const circuitBreaker = {
  failures: [] as number[],
  openedAt: 0,
  threshold: CIRCUIT_BREAKER_DEFAULTS.THRESHOLD,
  windowMs: CIRCUIT_BREAKER_DEFAULTS.WINDOW_MS,
  cooldownMs: CIRCUIT_BREAKER_DEFAULTS.COOLDOWN_MS,
};

function isCircuitOpen(): boolean {
  if (!circuitBreaker.openedAt) return false;
  return Date.now() - circuitBreaker.openedAt < circuitBreaker.cooldownMs;
}

function recordFailure(): void {
  const now = Date.now();
  circuitBreaker.failures = circuitBreaker.failures.filter(
    (t) => now - t < circuitBreaker.windowMs
  );
  circuitBreaker.failures.push(now);
  if (circuitBreaker.failures.length >= circuitBreaker.threshold) {
    circuitBreaker.openedAt = now;
    log.warn('circuit breaker opened for Kitsu API');
  }
}

function recordSuccess(): void {
  circuitBreaker.failures = [];
  circuitBreaker.openedAt = 0;
}

function resolveKitsuUrl(requestPath: string): string {
  if (!requestPath) throw new Error('Kitsu path is required');

  if (requestPath.startsWith('http://') || requestPath.startsWith('https://')) {
    const parsed = new URL(requestPath);
    if (parsed.origin !== KITSU_API_ORIGIN) {
      throw Object.assign(new Error('Disallowed Kitsu URL origin'), { statusCode: 400 });
    }
    return parsed.toString();
  }

  if (!requestPath.startsWith('/') || requestPath.startsWith('//')) {
    throw Object.assign(new Error('Invalid Kitsu API path'), { statusCode: 400 });
  }

  return `${KITSU_API_BASE}${requestPath}`;
}

export async function kitsuFetch<T>(path: string): Promise<T> {
  if (isCircuitOpen()) {
    throw Object.assign(new Error('Kitsu circuit breaker open'), { statusCode: 503 });
  }

  await acquireSlot();

  const url = resolveKitsuUrl(path);
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(url, {
        headers: KITSU_HEADERS,
        signal: AbortSignal.timeout(TIMEOUTS.KITSU_FETCH_MS),
      });

      if (response.status === 429) {
        log.warn('Kitsu rate limited', { attempt });
        await new Promise((r) => setTimeout(r, 2000 * Math.pow(2, attempt)));
        continue;
      }

      if (!response.ok) {
        throw Object.assign(new Error(`Kitsu API error: ${response.status}`), {
          statusCode: response.status,
        });
      }

      const data = (await response.json()) as T;
      recordSuccess();
      return data;
    } catch (err) {
      lastError = err as Error;
      if ((err as { statusCode?: number }).statusCode === 429) continue;
      if (attempt < 2) {
        await new Promise((r) => setTimeout(r, 300 * Math.pow(2, attempt)));
      }
    }
  }

  recordFailure();
  throw lastError || new Error('Kitsu API request failed');
}
