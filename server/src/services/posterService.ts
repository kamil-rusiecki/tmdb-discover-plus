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
  CUSTOM_URL: 'customUrl',
} as const;

function getServiceBaseUrl(service: PosterServiceType): string | null {
  switch (service) {
    case PosterService.RPDB:
      return RPDB_BASE_URL;
    case PosterService.TOP_POSTERS:
      return TOP_POSTERS_BASE_URL;
    default:
      return null;
  }
}

function hasValidTmdbId(tmdbId: number | string | null | undefined): boolean {
  if (tmdbId === null || tmdbId === undefined) return false;
  const value = String(tmdbId).trim();
  return value.length > 0 && value !== '0';
}

function getTypePrefix(type: string): 'movie' | 'series' {
  return type === 'series' ? 'series' : 'movie';
}

function resolveCustomPosterUrl(options: PosterUrlOptions): string | null {
  const pattern = options.customUrlPattern?.trim();
  if (!pattern) return null;

  const typePrefix = getTypePrefix(options.type);
  const hasImdb = Boolean(options.imdbId && String(options.imdbId).startsWith('tt'));
  const hasTmdb = hasValidTmdbId(options.tmdbId);
  const tmdbId = hasTmdb ? String(options.tmdbId).trim() : '';
  const imdbId = hasImdb ? String(options.imdbId) : '';

  const ratingIdType = hasImdb ? 'imdb' : hasTmdb ? 'tmdb' : '';
  const ratingId = hasImdb ? imdbId : hasTmdb ? `${typePrefix}-${tmdbId}` : '';

  const language = String(options.language || 'en').trim() || 'en';
  const languageShort = language.includes('-') ? language.split('-')[0] : language;

  const replacements: Record<string, string> = {
    '{id}': imdbId || tmdbId,
    '{imdb_id}': imdbId,
    '{tmdb_id}': tmdbId,
    '{type}': options.type,
    '{type_prefix}': typePrefix,
    '{tmdb_type_id}': hasTmdb ? `${typePrefix}-${tmdbId}` : '',
    '{rating_id_type}': ratingIdType,
    '{rating_id}': ratingId,
    '{language}': language,
    '{language_short}': languageShort,
    '{api_key}': options.apiKey || '',
    '{api_key_urlencoded}': options.apiKey ? encodeURIComponent(options.apiKey) : '',
  };

  const placeholdersInPattern = pattern.match(/\{[a-z_]+\}/g) || [];
  const unknownPlaceholder = placeholdersInPattern.find(
    (placeholder) => !(placeholder in replacements)
  );
  if (unknownPlaceholder) {
    log.debug('Unsupported custom poster placeholder', { unknownPlaceholder });
    return null;
  }

  let resolved = pattern;
  for (const placeholder of placeholdersInPattern) {
    const value = replacements[placeholder] ?? '';
    if (!value) {
      log.debug('Missing value for custom poster placeholder', { placeholder });
      return null;
    }
    resolved = resolved.split(placeholder).join(value);
  }

  try {
    const parsed = new URL(resolved);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

export function generatePosterUrl(options: PosterUrlOptions): string | null {
  const { apiKey, service, tmdbId, type, imdbId = null } = options;

  if (!service || service === PosterService.NONE) {
    return null;
  }

  if (service === PosterService.CUSTOM_URL) {
    return resolveCustomPosterUrl(options);
  }

  if (!apiKey) {
    return null;
  }

  if (!hasValidTmdbId(tmdbId) && !imdbId) {
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

  const prefix = getTypePrefix(type);
  return `${baseUrl}/${apiKey}/tmdb/poster-default/${prefix}-${tmdbId}.jpg?fallback=true`;
}

export function generateBackdropUrl(options: PosterUrlOptions): string | null {
  const { apiKey, service, tmdbId, type, imdbId = null } = options;

  if (!service || service === PosterService.NONE) {
    return null;
  }

  if (service === PosterService.CUSTOM_URL) {
    return resolveCustomPosterUrl(options);
  }

  if (!apiKey) {
    return null;
  }

  if (!hasValidTmdbId(tmdbId) && !imdbId) {
    return null;
  }

  const baseUrl = getServiceBaseUrl(service);
  if (!baseUrl) {
    return null;
  }

  if (imdbId && typeof imdbId === 'string' && imdbId.startsWith('tt')) {
    return `${baseUrl}/${apiKey}/imdb/backdrop-default/${imdbId}.jpg?fallback=true`;
  }

  const prefix = getTypePrefix(type);
  return `${baseUrl}/${apiKey}/tmdb/backdrop-default/${prefix}-${tmdbId}.jpg?fallback=true`;
}

export function isValidPosterConfig(posterOptions: PosterOptions | null): boolean {
  if (!posterOptions) return false;
  const { apiKey, service, customUrlPattern } = posterOptions;
  if (!service || service === PosterService.NONE) return false;
  if (service === PosterService.CUSTOM_URL) {
    return Boolean(customUrlPattern && customUrlPattern.trim());
  }
  return Boolean(apiKey);
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

  if (preferences.posterService === PosterService.CUSTOM_URL) {
    const customUrlPattern = preferences.posterCustomUrlPattern?.trim();
    if (!customUrlPattern) return null;
    return {
      service: preferences.posterService,
      customUrlPattern,
    };
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
    customUrlPattern: preferences.posterCustomUrlPattern,
  };
}
