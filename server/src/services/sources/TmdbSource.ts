import { sanitizeFiltersForSource } from '../../utils/validation.ts';
import type { CatalogFilters } from '../../types/config.ts';
import type { IDiscoverSource } from './types.ts';

export const TmdbSource: IDiscoverSource = {
  sourceId: 'tmdb',
  catalogIdPrefix: 'tmdb',
  defaultPageSize: 20,

  isEnabled() {
    return true;
  },

  sanitizeFilters(filters: CatalogFilters): CatalogFilters {
    return sanitizeFiltersForSource('tmdb', filters as Record<string, unknown>) as CatalogFilters;
  },
};
