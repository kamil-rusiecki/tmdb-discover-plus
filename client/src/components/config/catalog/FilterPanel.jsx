import { useCallback, useMemo, memo } from 'react';
import { Check } from 'lucide-react';
import { RangeSlider, SingleSlider } from '../../forms/RangeSlider';
import { MultiSelect } from '../../forms/MultiSelect';
import { SearchableSelect } from '../../forms/SearchableSelect';
import { LabelWithTooltip } from '../../forms/Tooltip';

const CURRENT_YEAR = new Date().getFullYear();

export const FilterPanel = memo(function FilterPanel({
  localCatalog,
  onFiltersChange,
  sortOptions,
  originalLanguages,
  countries,
}) {
  const safeSortOptions =
    sortOptions && typeof sortOptions === 'object' && !Array.isArray(sortOptions)
      ? sortOptions
      : { movie: [], series: [] };
  const safeOriginalLanguages = Array.isArray(originalLanguages) ? originalLanguages : [];
  const safeCountries = Array.isArray(countries) ? countries : [];

  const countriesValue = useMemo(() => {
    const raw = localCatalog?.filters?.countries;
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    return String(raw).split(',').filter(Boolean);
  }, [localCatalog?.filters?.countries]);

  const handleYearRangeChange = useCallback(
    (range) => {
      onFiltersChange('yearFrom', range[0]);
      onFiltersChange('yearTo', range[1]);
      onFiltersChange('lastXYears', undefined);
    },
    [onFiltersChange]
  );

  const handleRatingRangeChange = useCallback(
    (range) => {
      onFiltersChange('ratingMin', range[0]);
      onFiltersChange('ratingMax', range[1]);
    },
    [onFiltersChange]
  );

  const handleRuntimeRangeChange = useCallback(
    (range) => {
      onFiltersChange('runtimeMin', range[0] === 0 ? undefined : range[0]);
      onFiltersChange('runtimeMax', range[1] === 400 ? undefined : range[1]);
    },
    [onFiltersChange]
  );

  const handleLastXYears = useCallback(
    (value) => {
      onFiltersChange('lastXYears', value);
      if (value) {
        const now = new Date().getFullYear();
        onFiltersChange('yearFrom', now - value);
        onFiltersChange('yearTo', now);
      } else {
        onFiltersChange('yearFrom', undefined);
        onFiltersChange('yearTo', undefined);
      }
    },
    [onFiltersChange]
  );

  return (
    <>
      <div className="filter-grid">
        <div className="filter-group">
          <LabelWithTooltip
            label="Sort By"
            tooltip="How to order your results. Popular shows what's trending now, while rating shows critically acclaimed content."
          />
          <SearchableSelect
            options={safeSortOptions[localCatalog?.type] || safeSortOptions.movie || []}
            value={localCatalog?.filters?.sortBy || 'popularity.desc'}
            onChange={(value) => onFiltersChange('sortBy', value)}
            placeholder="Most Popular"
            searchPlaceholder="Search..."
            labelKey="label"
            valueKey="value"
            allowClear={false}
          />
        </div>

        <div className="filter-group">
          <LabelWithTooltip
            label="Original Language"
            tooltip="Filter by the original language of the content (e.g., select 'Japanese' for anime, 'Korean' for K-dramas)."
          />
          <SearchableSelect
            options={safeOriginalLanguages}
            value={localCatalog?.filters?.language || ''}
            onChange={(value) => onFiltersChange('language', value)}
            placeholder="Any"
            searchPlaceholder="Search languages..."
            labelKey="english_name"
            valueKey="iso_639_1"
          />
        </div>

        <div className="filter-group">
          <LabelWithTooltip
            label="Country"
            tooltip="Filter by country of origin. Select multiple countries (OR logic). Useful for finding British shows, Bollywood movies, etc."
          />
          <MultiSelect
            options={safeCountries}
            value={countriesValue}
            onChange={(value) => onFiltersChange('countries', value)}
            placeholder="Any"
            searchPlaceholder="Search countries..."
            labelKey="english_name"
            valueKey="iso_3166_1"
          />
        </div>
      </div>

      <div className="filter-spacer-lg">
        <RangeSlider
          label="Year Range"
          tooltip="Filter by release year or first air date. Great for finding classics or recent releases."
          min={1900}
          max={CURRENT_YEAR + 2}
          step={1}
          value={[
            localCatalog?.filters?.yearFrom || 1900,
            localCatalog?.filters?.yearTo || CURRENT_YEAR + 2,
          ]}
          onChange={handleYearRangeChange}
          formatValue={(v) => v}
          showInputs
        />
        <div className="runtime-presets filter-spacer-sm">
          {[3, 5, 10, 15, 20].map((n) => (
            <button
              key={n}
              type="button"
              className={`date-preset ${localCatalog?.filters?.lastXYears === n ? 'active' : ''}`}
              onClick={() =>
                handleLastXYears(localCatalog?.filters?.lastXYears === n ? undefined : n)
              }
            >
              Last {n}y
            </button>
          ))}
          <div className="last-x-years-input-group">
            <input
              type="number"
              className="input last-x-years-input"
              min="1"
              max="100"
              placeholder="Custom"
              value={localCatalog?.filters?.lastXYears ?? ''}
              onChange={(e) => {
                const v = e.target.value;
                handleLastXYears(v ? Math.max(1, Math.min(100, Number(v))) : undefined);
              }}
            />
            <span className="last-x-years-label">years</span>
          </div>
          {localCatalog?.filters?.lastXYears && (
            <button
              type="button"
              className="date-preset"
              onClick={() => handleLastXYears(undefined)}
            >
              Any
            </button>
          )}
        </div>
      </div>

      <div className="filter-spacer">
        <RangeSlider
          label="Rating"
          tooltip="TMDB average user rating (0-10 scale). Higher ratings indicate better reviews."
          min={0}
          max={10}
          step={0.1}
          value={[localCatalog?.filters?.ratingMin || 0, localCatalog?.filters?.ratingMax || 10]}
          onChange={handleRatingRangeChange}
          formatValue={(v) => v.toFixed(1)}
          showInputs
        />
      </div>

      <div className="filter-spacer">
        <RangeSlider
          label="Runtime (minutes)"
          tooltip="Filter by total runtime. Perfect for finding quick watches or epic adventures."
          min={0}
          max={400}
          step={1}
          value={[localCatalog?.filters?.runtimeMin || 0, localCatalog?.filters?.runtimeMax || 400]}
          onChange={handleRuntimeRangeChange}
          formatValue={(v) => (v === 0 ? 'Any' : v === 400 ? '400+' : `${v}m`)}
          showInputs
        />
        <div className="runtime-presets filter-spacer-sm">
          <button
            type="button"
            className={`date-preset ${localCatalog?.filters?.runtimeMax === 60 && !localCatalog?.filters?.runtimeMin ? 'active' : ''}`}
            onClick={() => handleRuntimeRangeChange([0, 60])}
          >
            Short (&lt;60m)
          </button>
          <button
            type="button"
            className={`date-preset ${localCatalog?.filters?.runtimeMin === 90 && localCatalog?.filters?.runtimeMax === 120 ? 'active' : ''}`}
            onClick={() => handleRuntimeRangeChange([90, 120])}
          >
            Standard (90-120m)
          </button>
          <button
            type="button"
            className={`date-preset ${localCatalog?.filters?.runtimeMin === 150 && localCatalog?.filters?.runtimeMax === 400 ? 'active' : ''}`}
            onClick={() => handleRuntimeRangeChange([150, 400])}
          >
            Long (&gt;150m)
          </button>
          <button
            type="button"
            className={`date-preset ${localCatalog?.filters?.runtimeMin === 180 ? 'active' : ''}`}
            onClick={() => handleRuntimeRangeChange([180, 400])}
          >
            Epic (&gt;3h)
          </button>
          <button
            type="button"
            className="date-preset"
            onClick={() => handleRuntimeRangeChange([0, 400])}
          >
            Any
          </button>
        </div>
      </div>

      <div className="filter-spacer">
        <SingleSlider
          label="Minimum Votes"
          tooltip="Requires this many user ratings. Higher values filter out obscure titles and ensure quality."
          min={0}
          max={10000}
          step={1}
          value={localCatalog?.filters?.voteCountMin ?? 0}
          onChange={(v) => onFiltersChange('voteCountMin', v)}
          formatValue={(v) => v.toLocaleString()}
          showInput
        />
      </div>

      <label className="checkbox-label-row" style={{ cursor: 'pointer', marginTop: '12px' }}>
        <div
          className={`checkbox ${localCatalog?.filters?.releasedOnly ? 'checked' : ''}`}
          role="checkbox"
          aria-checked={!!localCatalog?.filters?.releasedOnly}
          tabIndex={0}
          onClick={() => onFiltersChange('releasedOnly', !localCatalog?.filters?.releasedOnly)}
          onKeyDown={(e) => {
            if (e.key === ' ' || e.key === 'Enter') {
              e.preventDefault();
              onFiltersChange('releasedOnly', !localCatalog?.filters?.releasedOnly);
            }
          }}
        >
          {localCatalog?.filters?.releasedOnly && <Check size={14} />}
        </div>
        <LabelWithTooltip
          label="Released only"
          tooltip={
            localCatalog?.type === 'series'
              ? 'Only show TV series that have already started airing. Filters out announced shows with future air dates.'
              : 'Only show movies with a digital, physical, or TV release on or before today. Filters out announced and in-production titles.'
          }
        />
      </label>
    </>
  );
});
