import { memo, useCallback } from 'react';

const AVAILABLE_EXTRAS = [
  {
    id: 'genre',
    label: 'Genre (default)',
    description: 'Standard Stremio genre dropdown',
  },
  {
    id: 'year',
    label: 'Year',
    description: 'Use the dropdown values as years',
  },
  {
    id: 'sortBy',
    label: 'Sort By',
    description: 'Use the dropdown values as sort options',
  },
  {
    id: 'certification',
    label: 'Age Rating',
    description: 'Use the dropdown values as certifications',
  },
];

export const StremioExtras = memo(function StremioExtras({ localCatalog, onFiltersChange }) {
  const selectedMode =
    localCatalog?.filters?.stremioExtraMode || localCatalog?.filters?.stremioExtras?.[0] || 'genre';

  const selectMode = useCallback(
    (id) => {
      onFiltersChange('stremioExtraMode', id);
      onFiltersChange('stremioExtras', [id]);
    },
    [onFiltersChange]
  );

  return (
    <div className="stremio-extras">
      <p className="stremio-extras-hint">
        Choose what the single Stremio dropdown should control for this catalog. Genre is the
        default and most compatible option.
      </p>
      <div className="stremio-extras-grid">
        {AVAILABLE_EXTRAS.map((extra) => {
          const isSelected = selectedMode === extra.id;
          return (
            <button
              key={extra.id}
              type="button"
              className={`stremio-extra-chip ${isSelected ? 'active' : ''}`}
              onClick={() => selectMode(extra.id)}
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
