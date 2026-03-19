import type { StremioMeta, StremioMetaPreview } from '../../types/stremio.ts';
import type { ContentType } from '../../types/common.ts';
import type { CatalogFilters } from '../../types/config.ts';

export interface DiscoverResult {
  items: StremioMetaPreview[];
  hasMore: boolean;
  totalCount?: number;
}

export interface IDiscoverSource {
  readonly sourceId: string;
  readonly catalogIdPrefix: string;
  readonly defaultPageSize: number;
  isEnabled(): boolean;
  sanitizeFilters(filters: CatalogFilters): CatalogFilters;
}
