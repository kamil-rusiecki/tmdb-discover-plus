import fetch from 'node-fetch';
import { createLogger } from '../utils/logger.ts';
import { TIMEOUTS } from '../constants.ts';
import type {
  PosterOptions,
  PosterUrlOptions,
  PosterServiceType,
  UserPreferences,
} from '../types/index.ts';

const log = createLogger('posterService');

const POSTER_CHECK_TTL_MS = 24 * 60 * 60 * 1000;
const POSTER_CHECK_NEGATIVE_TTL_MS = 60 * 60 * 1000;
const POSTER_CHECK_MAX_CACHE = 2000;
const ALLOWED_POSTER_HOSTS = new Set([
  'api.ratingposterdb.com',
  'api.top-streaming.stream',
  'image.tmdb.org',
]);

interface PosterCheckEntry {
  exists: boolean;
  ts: number;
}

const posterCheckCache = new Map<string, PosterCheckEntry>();

function evictStaleEntries(): void {
  if (posterCheckCache.size <= POSTER_CHECK_MAX_CACHE) return;
  const now = Date.now();
  for (const [key, entry] of posterCheckCache) {
    const ttl = entry.exists ? POSTER_CHECK_TTL_MS : POSTER_CHECK_NEGATIVE_TTL_MS;
    if (now - entry.ts > ttl) {
      posterCheckCache.delete(key);
    }
  }
  if (posterCheckCache.size > POSTER_CHECK_MAX_CACHE) {
    const excess = posterCheckCache.size - POSTER_CHECK_MAX_CACHE;
    const keys = posterCheckCache.keys();
    for (let i = 0; i < excess; i++) {
      const next = keys.next();
      if (!next.done) posterCheckCache.delete(next.value);
    }
  }
}

export async function checkPosterExists(url: string): Promise<boolean> {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' || !ALLOWED_POSTER_HOSTS.has(parsed.hostname)) {
      return false;
    }
  } catch {
    return false;
  }

  const cached = posterCheckCache.get(url);
  if (cached) {
    const ttl = cached.exists ? POSTER_CHECK_TTL_MS : POSTER_CHECK_NEGATIVE_TTL_MS;
    if (Date.now() - cached.ts < ttl) return cached.exists;
    posterCheckCache.delete(url);
  }

  try {
    const response = await fetch(url, {
      method: 'HEAD',
      signal: AbortSignal.timeout(TIMEOUTS.RPDB_FETCH_MS),
      redirect: 'follow',
    });

    if (!response.ok) {
      posterCheckCache.set(url, { exists: false, ts: Date.now() });
      evictStaleEntries();
      return false;
    }

    const contentType = response.headers.get('content-type');
    if (contentType && !contentType.startsWith('image/')) {
      posterCheckCache.set(url, { exists: false, ts: Date.now() });
      evictStaleEntries();
      return false;
    }

    const contentLength = response.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) < 100) {
      posterCheckCache.set(url, { exists: false, ts: Date.now() });
      evictStaleEntries();
      return false;
    }

    posterCheckCache.set(url, { exists: true, ts: Date.now() });
    evictStaleEntries();
    return true;
  } catch {
    posterCheckCache.set(url, { exists: false, ts: Date.now() });
    evictStaleEntries();
    return false;
  }
}

const RPDB_BASE_URL = 'https://api.ratingposterdb.com';
const TOP_POSTERS_BASE_URL = 'https://api.top-streaming.stream';

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

export const PosterService = {
  NONE: 'none',
  RPDB: 'rpdb',
  TOP_POSTERS: 'topPosters',
} as const;

function getServiceBaseUrl(service: string): string | null {
  switch (service) {
    case PosterService.RPDB:
      return RPDB_BASE_URL;
    case PosterService.TOP_POSTERS:
      return TOP_POSTERS_BASE_URL;
    default:
      return null;
  }
}

export function generatePosterUrl(options: PosterUrlOptions): string | null {
  const { apiKey, service, tmdbId, type, imdbId = null } = options;

  if (!apiKey || !service || service === PosterService.NONE) {
    return null;
  }

  if (!tmdbId && !imdbId) {
    log.debug('Cannot generate poster URL: no ID provided');
    return null;
  }

  const baseUrl = getServiceBaseUrl(service);
  if (!baseUrl) {
    log.debug('Unknown poster service', { service });
    return null;
  }

  if (imdbId && typeof imdbId === 'string' && imdbId.startsWith('tt')) {
    return `${baseUrl}/${apiKey}/imdb/poster-default/${imdbId}.jpg?fallback=true`;
  }

  const prefix = type === 'series' ? 'series' : 'movie';
  return `${baseUrl}/${apiKey}/tmdb/poster-default/${prefix}-${tmdbId}.jpg?fallback=true`;
}

export function generateBackdropUrl(options: PosterUrlOptions): string | null {
  const { apiKey, service, tmdbId, type, imdbId = null } = options;

  if (!apiKey || !service || service === PosterService.NONE) {
    return null;
  }

  if (!tmdbId && !imdbId) {
    return null;
  }

  const baseUrl = getServiceBaseUrl(service);
  if (!baseUrl) {
    return null;
  }

  if (imdbId && typeof imdbId === 'string' && imdbId.startsWith('tt')) {
    return `${baseUrl}/${apiKey}/imdb/backdrop-default/${imdbId}.jpg?fallback=true`;
  }

  const prefix = type === 'series' ? 'series' : 'movie';
  return `${baseUrl}/${apiKey}/tmdb/backdrop-default/${prefix}-${tmdbId}.jpg?fallback=true`;
}

export function isValidPosterConfig(posterOptions: PosterOptions | null): boolean {
  if (!posterOptions) return false;
  const { apiKey, service } = posterOptions;
  return Boolean(apiKey && service && service !== PosterService.NONE);
}

export function createPosterOptions(
  preferences: UserPreferences | null | undefined,
  decryptFn: (encrypted: string) => string | null
): PosterOptions | null {
  if (
    !preferences ||
    !preferences.posterService ||
    preferences.posterService === PosterService.NONE
  ) {
    return null;
  }

  if (!preferences.posterApiKeyEncrypted) {
    return null;
  }

  const apiKey = decryptFn(preferences.posterApiKeyEncrypted);
  if (!apiKey) {
    return null;
  }

  return {
    apiKey,
    service: preferences.posterService,
  };
}
