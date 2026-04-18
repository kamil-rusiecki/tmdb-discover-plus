import type { AnimeIdEntry } from '../services/animeIdMap/index.ts';

export interface ResolvedMetaId {
  tmdbId: number | null;
  imdbId: string | null;
  requiresImdbLookup: boolean;
}

function parsePositiveInt(raw: string): number | null {
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function normalizeImdbId(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim().toLowerCase();
  return /^tt\d+$/i.test(trimmed) ? trimmed : null;
}

export function resolveRequestedMetaId(
  requestedId: string,
  lookupAnimeEntry: (id: string) => AnimeIdEntry | undefined
): ResolvedMetaId {
  const rawId = String(requestedId || '').trim();
  if (!rawId) {
    return {
      tmdbId: null,
      imdbId: null,
      requiresImdbLookup: false,
    };
  }

  const directImdbId = normalizeImdbId(rawId);
  if (directImdbId) {
    return {
      tmdbId: null,
      imdbId: directImdbId,
      requiresImdbLookup: true,
    };
  }

  if (rawId.startsWith('tmdb:')) {
    return {
      tmdbId: parsePositiveInt(rawId.slice('tmdb:'.length)),
      imdbId: null,
      requiresImdbLookup: false,
    };
  }

  if (/^\d+$/.test(rawId)) {
    return {
      tmdbId: parsePositiveInt(rawId),
      imdbId: null,
      requiresImdbLookup: false,
    };
  }

  const mapEntry = lookupAnimeEntry(rawId);
  if (!mapEntry) {
    return {
      tmdbId: null,
      imdbId: null,
      requiresImdbLookup: false,
    };
  }

  const mappedTmdbId =
    typeof mapEntry.themoviedb_id === 'number' && Number.isFinite(mapEntry.themoviedb_id)
      ? mapEntry.themoviedb_id
      : null;
  const mappedImdbId = normalizeImdbId(mapEntry.imdb_id);

  return {
    tmdbId: mappedTmdbId,
    imdbId: mappedImdbId,
    requiresImdbLookup: !mappedTmdbId && Boolean(mappedImdbId),
  };
}
