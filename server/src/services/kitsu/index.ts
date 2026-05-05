export { kitsuFetch } from './client.ts';
export { getTrending, searchAnime, browseAnime, discover } from './discover.ts';
export { kitsuToStremioMeta, batchConvertToStremioMeta } from './stremioMeta.ts';
export * from './reference.ts';
export type { KitsuAnime, KitsuListResponse } from './types.ts';
export {
  KITSU_SUBTYPES,
  KITSU_STATUSES,
  KITSU_AGE_RATINGS,
  KITSU_SORT_OPTIONS,
  KITSU_SEASONS,
  KITSU_CATEGORIES,
} from './types.ts';
