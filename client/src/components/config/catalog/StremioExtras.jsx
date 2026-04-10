import { memo, useCallback } from 'react';

const AVAILABLE_EXTRAS = [
  {
    id: 'year',
    label: 'Year',
    description: 'Filter by release year in Stremio',
  },
  {
    id: 'sortBy',
    label: 'Sort By',
    description: 'Change sort order in Stremio',
  },
  {
    id: 'certification',
    label: 'Age Rating',
    description: 'Filter by certification in Stremio',
  },
];

export const StremioExtras = memo(function StremioExtras({ localCatalog, onFiltersChange }) {
  const selected = localCatalog?.filters?.stremioExtras || [];

  const toggle = useCallback(
    (id) => {
      const current = localCatalog?.filters?.stremioExtras || [];
      const next = current.includes(id) ? current.filter((e) => e !== id) : [...current, id];
      onFiltersChange('stremioExtras', next.length > 0 ? next : undefined);
    },
    [localCatalog?.filters?.stremioExtras, onFiltersChange]
  );

  return (
    <div className="stremio-extras">
      <p className="stremio-extras-hint">
        Expose additional filter dropdowns inside Stremio&apos;s Discover page for this catalog.
        Genre is always included when genres are configured.
      </p>
      <div className="stremio-extras-grid">
        {AVAILABLE_EXTRAS.map((extra) => {
          const isSelected = selected.includes(extra.id);
          return (
            <button
              key={extra.id}
              type="button"
              className={`stremio-extra-chip ${isSelected ? 'active' : ''}`}
              onClick={() => toggle(extra.id)}
            >
              <span className="stremio-extra-chip-label">{extra.label}</span>
              <span className="stremio-extra-chip-desc">{extra.description}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
});
