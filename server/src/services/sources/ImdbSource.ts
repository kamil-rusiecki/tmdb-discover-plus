import { isImdbApiEnabled } from '../imdb/index.ts';
import { sanitizeFiltersForSource } from '../../utils/validation.ts';
import { DISPLAY } from '../../constants.ts';
import type { CatalogFilters } from '../../types/config.ts';
import type { IDiscoverSource } from './types.ts';

export const ImdbSource: IDiscoverSource = {
  sourceId: 'imdb',
  catalogIdPrefix: 'imdb',
  defaultPageSize: DISPLAY.IMDB_PAGE_SIZE,

  isEnabled() {
    return isImdbApiEnabled();
  },

  sanitizeFilters(filters: CatalogFilters): CatalogFilters {
    return sanitizeFiltersForSource('imdb', filters as Record<string, unknown>) as CatalogFilters;
  },
};
