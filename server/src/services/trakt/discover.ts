import { createLogger } from '../../utils/logger.ts';
import { traktFetch } from './client.ts';
import type {
  TraktMovie,
  TraktShow,
  TraktTrendingMovie,
  TraktTrendingShow,
  TraktPlayedMovie,
  TraktPlayedShow,
  TraktAnticipatedMovie,
  TraktAnticipatedShow,
  TraktBoxOfficeMovie,
  TraktFavoritedMovie,
  TraktFavoritedShow,
  TraktSearchResult,
  TraktCalendarMovie,
  TraktCalendarShow,
  TraktListItem,
} from './types.ts';
import type { TraktCatalogFilters } from '../../types/config.ts';
import type { ContentType } from '../../types/common.ts';

const log = createLogger('trakt:discover');
const PAGE_LIMIT = 20;
const MAX_CALENDAR_CHUNK = 31;
const MAX_CALENDAR_RANGE_DAYS = 365;
const MAX_RECENTLY_AIRED_DAYS = 365;
const CALENDAR_CACHE_TTL_MS = 5 * 60 * 1000;
const calendarCache = new Map<string, { items: (TraktMovie | TraktShow)[]; ts: number }>();
const FILTERABLE_LIST_TYPES = new Set([
  'trending',
  'popular',
  'favorited',
  'watched',
  'played',
  'collected',
  'anticipated',
  'recommended',
  'calendar',
  'recently_aired',
]);

export function normalizeTraktListType(listType?: string): string {
  if (!listType) return 'trending';
  if (listType === 'community_stats') return 'watched';
  return listType;
}

function shouldApplyFilters(listType: string): boolean {
  return FILTERABLE_LIST_TYPES.has(listType);
}

function traktContentType(type: ContentType): string {
  return type === 'movie' ? 'movies' : 'shows';
}

function buildCalendarPath(
  calendarType: string,
  startDate: string,
  days: number,
  type: ContentType
): string {
  switch (calendarType) {
    case 'movies':
      return `/calendars/all/movies/${startDate}/${days}`;
    case 'dvd':
      return `/calendars/all/dvd/${startDate}/${days}`;
    case 'streaming':
      return `/calendars/all/streaming/${startDate}/${days}`;
    case 'shows':
      return `/calendars/all/shows/${startDate}/${days}`;
    case 'shows_new':
      return `/calendars/all/shows/new/${startDate}/${days}`;
    case 'shows_premieres':
      return `/calendars/all/shows/premieres/${startDate}/${days}`;
    case 'shows_finales':
      return `/calendars/all/shows/finales/${startDate}/${days}`;
    default:
      return type === 'movie'
        ? `/calendars/all/movies/${startDate}/${days}`
        : `/calendars/all/shows/${startDate}/${days}`;
  }
}

function isMovieCalendarType(calendarType: string, type: ContentType): boolean {
  return (
    calendarType === 'movies' ||
    calendarType === 'dvd' ||
    calendarType === 'streaming' ||
    (calendarType !== 'shows' &&
      calendarType !== 'shows_new' &&
      calendarType !== 'shows_premieres' &&
      calendarType !== 'shows_finales' &&
      type === 'movie')
  );
}

function buildFilterParams(filters: TraktCatalogFilters): string {
  const params: string[] = [];
  if (filters.traktGenres?.length) params.push(`genres=${filters.traktGenres.join(',')}`);

  // Year range: prefer new numeric fields, fall back to legacy string
  if (filters.traktYearMin != null || filters.traktYearMax != null) {
    params.push(
      `years=${filters.traktYearMin ?? 1900}-${filters.traktYearMax ?? new Date().getFullYear() + 1}`
    );
  } else if (filters.traktYears) {
    params.push(`years=${filters.traktYears}`);
  }

  // Runtime range: prefer new numeric fields, fall back to legacy string
  if (filters.traktRuntimeMin != null || filters.traktRuntimeMax != null) {
    params.push(`runtimes=${filters.traktRuntimeMin ?? 0}-${filters.traktRuntimeMax ?? 400}`);
  } else if (filters.traktRuntimes) {
    params.push(`runtimes=${filters.traktRuntimes}`);
  }

  if (filters.traktCertifications?.length)
    params.push(`certifications=${filters.traktCertifications.join(',')}`);

  // Countries: handle both string (legacy) and string[] formats
  if (filters.traktCountries?.length) {
    const val = filters.traktCountries;
    params.push(`countries=${Array.isArray(val) ? val.join(',') : val}`);
  }
  // Languages: handle both string (legacy) and string[] formats
  if (filters.traktLanguages?.length) {
    const val = filters.traktLanguages;
    params.push(`languages=${Array.isArray(val) ? val.join(',') : val}`);
  }

  if (filters.traktNetworkIds?.length)
    params.push(`network_ids=${filters.traktNetworkIds.join(',')}`);
  if (filters.traktStudioIds?.length) params.push(`studio_ids=${filters.traktStudioIds.join(',')}`);
  if (filters.traktStatus?.length) params.push(`status=${filters.traktStatus.join(',')}`);

  if (filters.traktRatingMin != null || filters.traktRatingMax != null) {
    params.push(`ratings=${filters.traktRatingMin ?? 0}-${filters.traktRatingMax ?? 100}`);
  }
  if (filters.traktVotesMin != null) {
    params.push(`votes=${filters.traktVotesMin}-`);
  }
  if (filters.traktImdbRatingMin != null || filters.traktImdbRatingMax != null) {
    params.push(
      `imdb_ratings=${filters.traktImdbRatingMin ?? 0}-${filters.traktImdbRatingMax ?? 10}`
    );
  }
  if (filters.traktTmdbRatingMin != null || filters.traktTmdbRatingMax != null) {
    params.push(
      `tmdb_ratings=${filters.traktTmdbRatingMin ?? 0}-${filters.traktTmdbRatingMax ?? 10}`
    );
  }
  if (filters.traktRtMeterMin != null || filters.traktRtMeterMax != null) {
    params.push(`rt_meters=${filters.traktRtMeterMin ?? 0}-${filters.traktRtMeterMax ?? 100}`);
  }
  if (filters.traktMetascoreMin != null || filters.traktMetascoreMax != null) {
    params.push(`metascores=${filters.traktMetascoreMin ?? 0}-${filters.traktMetascoreMax ?? 100}`);
  }
  if (filters.traktImdbVotesMin != null || filters.traktImdbVotesMax != null) {
    params.push(`imdb_votes=${filters.traktImdbVotesMin ?? 0}-${filters.traktImdbVotesMax ?? ''}`);
  }
  if (filters.traktTmdbVotesMin != null || filters.traktTmdbVotesMax != null) {
    params.push(`tmdb_votes=${filters.traktTmdbVotesMin ?? 0}-${filters.traktTmdbVotesMax ?? ''}`);
  }
  if (filters.traktRtUserMeterMin != null || filters.traktRtUserMeterMax != null) {
    params.push(
      `rt_user_meters=${filters.traktRtUserMeterMin ?? 0}-${filters.traktRtUserMeterMax ?? 100}`
    );
  }

  return params.join('&');
}

function buildUrl(
  basePath: string,
  page: number,
  limit: number,
  filters?: TraktCatalogFilters
): string {
  const parts = [`page=${page}`, `limit=${limit}`, 'extended=full'];
  if (filters) {
    const filterStr = buildFilterParams(filters);
    if (filterStr) parts.push(filterStr);
  }
  return `${basePath}?${parts.join('&')}`;
}

function unwrapMovies(items: TraktTrendingMovie[]): TraktMovie[] {
  return items.map((i) => i.movie);
}

function unwrapShows(items: TraktTrendingShow[]): TraktShow[] {
  return items.map((i) => i.show);
}

function applyCalendarPostFilters(
  items: (TraktMovie | TraktShow)[],
  filters?: TraktCatalogFilters
): (TraktMovie | TraktShow)[] {
  if (!filters) return items;

  let filtered = items;

  if (filters.traktRatingMin != null || filters.traktRatingMax != null) {
    const minR = (filters.traktRatingMin ?? 0) / 10;
    const maxR = (filters.traktRatingMax ?? 100) / 10;
    filtered = filtered.filter((item) => {
      const r = item.rating;
      return r == null || (r >= minR && r <= maxR);
    });
  }

  if (filters.traktVotesMin != null) {
    const minVotes = filters.traktVotesMin;
    filtered = filtered.filter((item) => {
      const votes = item.votes;
      return votes == null || votes >= minVotes;
    });
  }

  if (filters.traktImdbRatingMin != null || filters.traktImdbRatingMax != null) {
    const minR = filters.traktImdbRatingMin ?? 0;
    const maxR = filters.traktImdbRatingMax ?? 10;
    filtered = filtered.filter((item) => {
      const r = item.rating;
      return r == null || (r >= minR && r <= maxR);
    });
  }

  return filtered;
}

export async function getTrending(
  type: ContentType,
  page: number,
  filters?: TraktCatalogFilters,
  clientId?: string
): Promise<{ items: (TraktMovie | TraktShow)[]; hasMore: boolean }> {
  const tType = traktContentType(type);
  const url = buildUrl(`/${tType}/trending`, page, PAGE_LIMIT, filters);
  log.debug('Trakt trending', { type, page });

  if (type === 'movie') {
    const data = await traktFetch<TraktTrendingMovie[]>(url, clientId);
    return { items: unwrapMovies(data), hasMore: data.length >= PAGE_LIMIT };
  }
  const data = await traktFetch<TraktTrendingShow[]>(url, clientId);
  return { items: unwrapShows(data), hasMore: data.length >= PAGE_LIMIT };
}

export async function getPopular(
  type: ContentType,
  page: number,
  filters?: TraktCatalogFilters,
  clientId?: string
): Promise<{ items: (TraktMovie | TraktShow)[]; hasMore: boolean }> {
  const tType = traktContentType(type);
  const url = buildUrl(`/${tType}/popular`, page, PAGE_LIMIT, filters);
  log.debug('Trakt popular', { type, page });

  if (type === 'movie') {
    const data = await traktFetch<TraktMovie[]>(url, clientId);
    return { items: data, hasMore: data.length >= PAGE_LIMIT };
  }
  const data = await traktFetch<TraktShow[]>(url, clientId);
  return { items: data, hasMore: data.length >= PAGE_LIMIT };
}

export async function getFavorited(
  type: ContentType,
  period: string,
  page: number,
  filters?: TraktCatalogFilters,
  clientId?: string
): Promise<{ items: (TraktMovie | TraktShow)[]; hasMore: boolean }> {
  const tType = traktContentType(type);
  const url = buildUrl(`/${tType}/favorited/${period}`, page, PAGE_LIMIT, filters);
  log.debug('Trakt favorited', { type, period, page });

  if (type === 'movie') {
    const data = await traktFetch<TraktFavoritedMovie[]>(url, clientId);
    return { items: data.map((i) => i.movie), hasMore: data.length >= PAGE_LIMIT };
  }
  const data = await traktFetch<TraktFavoritedShow[]>(url, clientId);
  return { items: data.map((i) => i.show), hasMore: data.length >= PAGE_LIMIT };
}

export async function getWatched(
  type: ContentType,
  period: string,
  page: number,
  filters?: TraktCatalogFilters,
  clientId?: string
): Promise<{ items: (TraktMovie | TraktShow)[]; hasMore: boolean }> {
  const tType = traktContentType(type);
  const url = buildUrl(`/${tType}/watched/${period}`, page, PAGE_LIMIT, filters);
  log.debug('Trakt watched', { type, period, page });

  if (type === 'movie') {
    const data = await traktFetch<TraktPlayedMovie[]>(url, clientId);
    return { items: data.map((i) => i.movie), hasMore: data.length >= PAGE_LIMIT };
  }
  const data = await traktFetch<TraktPlayedShow[]>(url, clientId);
  return { items: data.map((i) => i.show), hasMore: data.length >= PAGE_LIMIT };
}

export async function getPlayed(
  type: ContentType,
  period: string,
  page: number,
  filters?: TraktCatalogFilters,
  clientId?: string
): Promise<{ items: (TraktMovie | TraktShow)[]; hasMore: boolean }> {
  const tType = traktContentType(type);
  const url = buildUrl(`/${tType}/played/${period}`, page, PAGE_LIMIT, filters);
  log.debug('Trakt played', { type, period, page });

  if (type === 'movie') {
    const data = await traktFetch<TraktPlayedMovie[]>(url, clientId);
    return { items: data.map((i) => i.movie), hasMore: data.length >= PAGE_LIMIT };
  }
  const data = await traktFetch<TraktPlayedShow[]>(url, clientId);
  return { items: data.map((i) => i.show), hasMore: data.length >= PAGE_LIMIT };
}

export async function getCollected(
  type: ContentType,
  period: string,
  page: number,
  filters?: TraktCatalogFilters,
  clientId?: string
): Promise<{ items: (TraktMovie | TraktShow)[]; hasMore: boolean }> {
  const tType = traktContentType(type);
  const url = buildUrl(`/${tType}/collected/${period}`, page, PAGE_LIMIT, filters);
  log.debug('Trakt collected', { type, period, page });

  if (type === 'movie') {
    const data = await traktFetch<TraktPlayedMovie[]>(url, clientId);
    return { items: data.map((i) => i.movie), hasMore: data.length >= PAGE_LIMIT };
  }
  const data = await traktFetch<TraktPlayedShow[]>(url, clientId);
  return { items: data.map((i) => i.show), hasMore: data.length >= PAGE_LIMIT };
}

export async function getAnticipated(
  type: ContentType,
  page: number,
  filters?: TraktCatalogFilters,
  clientId?: string
): Promise<{ items: (TraktMovie | TraktShow)[]; hasMore: boolean }> {
  const tType = traktContentType(type);
  const url = buildUrl(`/${tType}/anticipated`, page, PAGE_LIMIT, filters);
  log.debug('Trakt anticipated', { type, page });

  if (type === 'movie') {
    const data = await traktFetch<TraktAnticipatedMovie[]>(url, clientId);
    return { items: data.map((i) => i.movie), hasMore: data.length >= PAGE_LIMIT };
  }
  const data = await traktFetch<TraktAnticipatedShow[]>(url, clientId);
  return { items: data.map((i) => i.show), hasMore: data.length >= PAGE_LIMIT };
}

export async function getBoxOffice(
  clientId?: string
): Promise<{ items: TraktMovie[]; hasMore: boolean }> {
  const url = '/movies/boxoffice?extended=full';
  log.debug('Trakt box office');
  const data = await traktFetch<TraktBoxOfficeMovie[]>(url, clientId);
  return { items: data.map((i) => i.movie), hasMore: false };
}

export async function getCalendar(
  calendarType: string,
  startDate: string,
  days: number,
  type: ContentType,
  filters?: TraktCatalogFilters,
  clientId?: string
): Promise<{ items: (TraktMovie | TraktShow)[]; hasMore: boolean }> {
  const path = buildCalendarPath(calendarType, startDate, days, type);

  const parts = ['extended=full'];
  if (filters) {
    const filterStr = buildFilterParams(filters);
    if (filterStr) parts.push(filterStr);
  }
  const url = `${path}?${parts.join('&')}`;
  log.debug('Trakt calendar', { calendarType, startDate, days });

  if (isMovieCalendarType(calendarType, type)) {
    const data = await traktFetch<TraktCalendarMovie[]>(url, clientId);
    return { items: data.map((i) => i.movie), hasMore: false };
  }

  const data = await traktFetch<TraktCalendarShow[]>(url, clientId);
  const seen = new Set<string>();
  const shows: TraktShow[] = [];
  for (const entry of data) {
    const key = entry.show.ids.imdb || entry.show.ids.slug || String(entry.show.ids.trakt);
    if (!seen.has(key)) {
      seen.add(key);
      shows.push(entry.show);
    }
  }
  return { items: shows, hasMore: false };
}

export async function getRecommended(
  type: ContentType,
  period: string,
  page: number,
  filters?: TraktCatalogFilters,
  clientId?: string
): Promise<{ items: (TraktMovie | TraktShow)[]; hasMore: boolean }> {
  const tType = traktContentType(type);
  const url = buildUrl(`/${tType}/recommended/${period}`, page, PAGE_LIMIT, filters);
  log.debug('Trakt recommended', { type, period, page });

  if (type === 'movie') {
    const data = await traktFetch<TraktFavoritedMovie[]>(url, clientId);
    return { items: data.map((i) => i.movie), hasMore: data.length >= PAGE_LIMIT };
  }
  const data = await traktFetch<TraktFavoritedShow[]>(url, clientId);
  return { items: data.map((i) => i.show), hasMore: data.length >= PAGE_LIMIT };
}

export async function getUpcomingCalendar(
  calendarType: string,
  days: number,
  type: ContentType,
  filters?: TraktCatalogFilters,
  clientId?: string,
  page = 1
): Promise<{ items: (TraktMovie | TraktShow)[]; hasMore: boolean }> {
  const clampedDays = Math.min(Math.max(days, 1), MAX_CALENDAR_RANGE_DAYS);
  const cacheKey = `upcoming:${calendarType}:${clampedDays}:${type}:${clientId ?? ''}:${buildFilterParams(filters ?? {})}`;
  const now = Date.now();
  const cached = calendarCache.get(cacheKey);

  let allItems: (TraktMovie | TraktShow)[];

  if (cached && now - cached.ts < CALENDAR_CACHE_TTL_MS) {
    allItems = cached.items;
  } else {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const overallEnd = new Date(today.getTime() + clampedDays * 24 * 60 * 60 * 1000);

    const chunks: Array<{ startDate: string; chunkDays: number }> = [];
    let currentStart = new Date(today);
    while (currentStart < overallEnd) {
      const msRemaining = overallEnd.getTime() - currentStart.getTime();
      const daysRemaining = Math.ceil(msRemaining / (24 * 60 * 60 * 1000));
      const chunkDays = Math.min(daysRemaining, MAX_CALENDAR_CHUNK);
      chunks.push({
        startDate: currentStart.toISOString().split('T')[0],
        chunkDays,
      });
      currentStart = new Date(currentStart.getTime() + chunkDays * 24 * 60 * 60 * 1000);
    }

    log.debug('Trakt upcoming calendar', {
      calendarType,
      days: clampedDays,
      chunks: chunks.length,
    });

    const filterParts = ['extended=full'];
    if (filters) {
      const filterStr = buildFilterParams(filters);
      if (filterStr) filterParts.push(filterStr);
    }

    if (isMovieCalendarType(calendarType, type)) {
      const chunkResults = await Promise.all(
        chunks.map((chunk) => {
          const path = buildCalendarPath(calendarType, chunk.startDate, chunk.chunkDays, type);
          const url = `${path}?${filterParts.join('&')}`;
          return traktFetch<TraktCalendarMovie[]>(url, clientId);
        })
      );
      const allMovies = chunkResults.flat();
      const movieMap = new Map<string, TraktCalendarMovie>();
      for (const entry of allMovies) {
        const key = entry.movie.ids.imdb || String(entry.movie.ids.tmdb || entry.movie.ids.trakt);
        const existing = movieMap.get(key);
        if (!existing || (entry.released || '') < (existing.released || '')) {
          movieMap.set(key, entry);
        }
      }
      allItems = Array.from(movieMap.values())
        .sort((a, b) => (a.released || '').localeCompare(b.released || ''))
        .map((i) => i.movie);
    } else {
      const chunkResults = await Promise.all(
        chunks.map((chunk) => {
          const path = buildCalendarPath(calendarType, chunk.startDate, chunk.chunkDays, type);
          const url = `${path}?${filterParts.join('&')}`;
          return traktFetch<TraktCalendarShow[]>(url, clientId);
        })
      );
      const allShows = chunkResults.flat();
      const showMap = new Map<string, TraktCalendarShow>();
      for (const entry of allShows) {
        const key = entry.show.ids.imdb || entry.show.ids.slug || String(entry.show.ids.trakt);
        const existing = showMap.get(key);
        if (!existing || (entry.first_aired || '') < (existing.first_aired || '')) {
          showMap.set(key, entry);
        }
      }
      allItems = Array.from(showMap.values())
        .sort((a, b) => (a.first_aired || '').localeCompare(b.first_aired || ''))
        .map((i) => i.show);
    }

    allItems = applyCalendarPostFilters(allItems, filters);

    calendarCache.set(cacheKey, { items: allItems, ts: now });
    if (calendarCache.size > 100) {
      const firstKey = calendarCache.keys().next().value;
      if (firstKey) calendarCache.delete(firstKey);
    }
  }

  const start = (page - 1) * PAGE_LIMIT;
  return {
    items: allItems.slice(start, start + PAGE_LIMIT),
    hasMore: start + PAGE_LIMIT < allItems.length,
  };
}

export async function getRecentlyAired(
  calendarType: string,
  days: number,
  type: ContentType,
  filters?: TraktCatalogFilters,
  clientId?: string,
  page = 1
): Promise<{ items: (TraktMovie | TraktShow)[]; hasMore: boolean }> {
  const clampedDays = Math.min(Math.max(days, 1), MAX_RECENTLY_AIRED_DAYS);
  const cacheKey = `${calendarType}:${clampedDays}:${type}:${clientId ?? ''}:${buildFilterParams(filters ?? {})}`;
  const now = Date.now();
  const cached = calendarCache.get(cacheKey);

  let allItems: (TraktMovie | TraktShow)[];

  if (cached && now - cached.ts < CALENDAR_CACHE_TTL_MS) {
    allItems = cached.items;
  } else {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const overallStart = new Date(today.getTime() - clampedDays * 24 * 60 * 60 * 1000);

    const chunks: Array<{ startDate: string; chunkDays: number }> = [];
    let currentStart = new Date(overallStart);
    while (currentStart < today) {
      const msRemaining = today.getTime() - currentStart.getTime();
      const daysRemaining = Math.ceil(msRemaining / (24 * 60 * 60 * 1000));
      const chunkDays = Math.min(daysRemaining, MAX_CALENDAR_CHUNK);
      chunks.push({
        startDate: currentStart.toISOString().split('T')[0],
        chunkDays,
      });
      currentStart = new Date(currentStart.getTime() + chunkDays * 24 * 60 * 60 * 1000);
    }

    log.debug('Trakt recently aired', { calendarType, days: clampedDays, chunks: chunks.length });

    const filterParts = ['extended=full'];
    if (filters) {
      const filterStr = buildFilterParams(filters);
      if (filterStr) filterParts.push(filterStr);
    }

    if (isMovieCalendarType(calendarType, type)) {
      const chunkResults = await Promise.all(
        chunks.map((chunk) => {
          const path = buildCalendarPath(calendarType, chunk.startDate, chunk.chunkDays, type);
          const url = `${path}?${filterParts.join('&')}`;
          return traktFetch<TraktCalendarMovie[]>(url, clientId);
        })
      );
      const allMovies = chunkResults.flat();
      const movieMap = new Map<string, TraktCalendarMovie>();
      for (const entry of allMovies) {
        const key = entry.movie.ids.imdb || String(entry.movie.ids.tmdb || entry.movie.ids.trakt);
        const existing = movieMap.get(key);
        if (!existing || (entry.released || '') > (existing.released || '')) {
          movieMap.set(key, entry);
        }
      }
      allItems = Array.from(movieMap.values())
        .sort((a, b) => (b.released || '').localeCompare(a.released || ''))
        .map((i) => i.movie);
    } else {
      const chunkResults = await Promise.all(
        chunks.map((chunk) => {
          const path = buildCalendarPath(calendarType, chunk.startDate, chunk.chunkDays, type);
          const url = `${path}?${filterParts.join('&')}`;
          return traktFetch<TraktCalendarShow[]>(url, clientId);
        })
      );
      const allShows = chunkResults.flat();
      const showMap = new Map<string, TraktCalendarShow>();
      for (const entry of allShows) {
        const key = entry.show.ids.imdb || entry.show.ids.slug || String(entry.show.ids.trakt);
        const existing = showMap.get(key);
        if (!existing || (entry.first_aired || '') > (existing.first_aired || '')) {
          showMap.set(key, entry);
        }
      }
      allItems = Array.from(showMap.values())
        .sort((a, b) => (b.first_aired || '').localeCompare(a.first_aired || ''))
        .map((i) => i.show);
    }

    allItems = applyCalendarPostFilters(allItems, filters);

    calendarCache.set(cacheKey, { items: allItems, ts: now });
    if (calendarCache.size > 100) {
      const firstKey = calendarCache.keys().next().value;
      if (firstKey) calendarCache.delete(firstKey);
    }
  }

  const start = (page - 1) * PAGE_LIMIT;
  return {
    items: allItems.slice(start, start + PAGE_LIMIT),
    hasMore: start + PAGE_LIMIT < allItems.length,
  };
}

export async function searchTrakt(
  query: string,
  type: ContentType,
  page: number,
  clientId?: string
): Promise<{ items: (TraktMovie | TraktShow)[]; hasMore: boolean }> {
  const tType = type === 'movie' ? 'movie' : 'show';
  const url = `/search/${tType}?query=${encodeURIComponent(query)}&page=${page}&limit=${PAGE_LIMIT}&extended=full&fields=title`;
  log.debug('Trakt search', { query, type, page });

  const data = await traktFetch<TraktSearchResult[]>(url, clientId);
  const items: (TraktMovie | TraktShow)[] = [];
  for (const result of data) {
    if (result.movie) items.push(result.movie);
    else if (result.show) items.push(result.show);
  }
  return { items, hasMore: data.length >= PAGE_LIMIT };
}

export async function getListItems(
  listId: string,
  type: ContentType,
  page: number,
  clientId?: string
): Promise<{ items: (TraktMovie | TraktShow)[]; hasMore: boolean }> {
  const tType = traktContentType(type);
  const url = `/users/${listId}/items/${tType}?page=${page}&limit=${PAGE_LIMIT}&extended=full`;
  log.debug('Trakt list items', { listId, type, page });

  const data = await traktFetch<TraktListItem[]>(url, clientId);
  const items: (TraktMovie | TraktShow)[] = [];
  for (const entry of data) {
    if (entry.movie) items.push(entry.movie);
    else if (entry.show) items.push(entry.show);
  }
  return { items, hasMore: data.length >= PAGE_LIMIT };
}

function todayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

export async function discover(
  filters: TraktCatalogFilters,
  type: ContentType,
  page: number,
  clientId?: string
): Promise<{ items: (TraktMovie | TraktShow)[]; hasMore: boolean }> {
  const listType = normalizeTraktListType(filters.traktListType);
  const period = filters.traktPeriod || 'weekly';
  const endpointFilters = shouldApplyFilters(listType) ? filters : undefined;

  switch (listType) {
    case 'trending':
      return getTrending(type, page, endpointFilters, clientId);
    case 'popular':
      return getPopular(type, page, endpointFilters, clientId);
    case 'favorited':
      return getFavorited(type, period, page, endpointFilters, clientId);
    case 'watched':
      return getWatched(type, period, page, endpointFilters, clientId);
    case 'played':
      return getPlayed(type, period, page, endpointFilters, clientId);
    case 'collected':
      return getCollected(type, period, page, endpointFilters, clientId);
    case 'anticipated':
      return getAnticipated(type, page, endpointFilters, clientId);
    case 'boxoffice': {
      if (type !== 'movie') {
        return { items: [], hasMore: false };
      }
      return getBoxOffice(clientId);
    }
    case 'calendar': {
      const calType = filters.traktCalendarType || (type === 'movie' ? 'movies' : 'shows');
      const days = Math.min(Math.max(filters.traktCalendarDays || 30, 1), MAX_CALENDAR_RANGE_DAYS);
      return getUpcomingCalendar(calType, days, type, endpointFilters, clientId, page);
    }
    case 'recently_aired': {
      const calType = filters.traktCalendarType || (type === 'movie' ? 'movies' : 'shows');
      const days = Math.min(Math.max(filters.traktCalendarDays || 30, 1), MAX_RECENTLY_AIRED_DAYS);
      return getRecentlyAired(calType, days, type, endpointFilters, clientId, page);
    }
    case 'recommended':
      return getRecommended(type, period, page, endpointFilters, clientId);
    case 'list': {
      const listId = filters.traktListId;
      if (!listId) return { items: [], hasMore: false };
      return getListItems(listId, type, page, clientId);
    }
    default:
      return getTrending(type, page, endpointFilters, clientId);
  }
}
