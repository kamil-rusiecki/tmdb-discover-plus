import { sanitizeFiltersForSource } from '../../utils/validation.ts';
import { DISPLAY } from '../../constants.ts';
import type { CatalogFilters } from '../../types/config.ts';
import type { IDiscoverSource } from './types.ts';

export const KitsuSource: IDiscoverSource = {
  sourceId: 'kitsu',
  catalogIdPrefix: 'kitsu',
  defaultPageSize: DISPLAY.ANIME_PAGE_SIZE,

  isEnabled() {
    return true;
  },

  sanitizeFilters(filters: CatalogFilters): CatalogFilters {
    return sanitizeFiltersForSource('kitsu', filters as Record<string, unknown>) as CatalogFilters;
  },
};
