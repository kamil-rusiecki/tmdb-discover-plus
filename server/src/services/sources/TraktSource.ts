import { isTraktEnabled } from '../trakt/index.ts';
import { sanitizeFiltersForSource } from '../../utils/validation.ts';
import { DISPLAY } from '../../constants.ts';
import type { CatalogFilters } from '../../types/config.ts';
import type { IDiscoverSource } from './types.ts';

export const TraktSource: IDiscoverSource = {
  sourceId: 'trakt',
  catalogIdPrefix: 'trakt',
  defaultPageSize: DISPLAY.TMDB_PAGE_SIZE,

  isEnabled() {
    return isTraktEnabled();
  },

  sanitizeFilters(filters: CatalogFilters): CatalogFilters {
    return sanitizeFiltersForSource('trakt', filters as Record<string, unknown>) as CatalogFilters;
  },
};
