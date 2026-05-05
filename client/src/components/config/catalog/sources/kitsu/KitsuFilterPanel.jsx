import { useMemo, useCallback } from 'react';
import { Settings, Sparkles, Layers, Calendar, Eye } from 'lucide-react';
import { FilterSection } from '../../FilterSection';
import { AnimeSeasonSelector } from '../../shared/AnimeSeasonSelector';
import { AnimeFormatSelector } from '../../shared/AnimeFormatSelector';
import { SearchableSelect } from '../../../../forms/SearchableSelect';
import { Checkbox } from '../../../../forms/Checkbox';
import { LabelWithTooltip } from '../../../../forms/Tooltip';

const KITSU_LIST_TYPES = [
  { value: 'browse', label: 'Browse' },
  { value: 'trending', label: 'Trending' },
];

const KITSU_SORT_OPTIONS = [
  { value: '-averageRating', label: 'Highest Rated' },
  { value: '-userCount', label: 'Most Popular' },
  { value: '-favoritesCount', label: 'Most Favorited' },
  { value: '-startDate', label: 'Newest' },
  { value: 'startDate', label: 'Oldest' },
  { value: '-episodeCount', label: 'Most Episodes' },
];

const KITSU_SUBTYPES = [
  { value: 'TV', label: 'TV' },
  { value: 'movie', label: 'Movie' },
  { value: 'OVA', label: 'OVA' },
  { value: 'ONA', label: 'ONA' },
  { value: 'special', label: 'Special' },
  { value: 'music', label: 'Music' },
];

const KITSU_STATUSES = [
  { value: 'current', label: 'Currently Airing' },
  { value: 'finished', label: 'Finished' },
  { value: 'tba', label: 'TBA' },
  { value: 'unreleased', label: 'Unreleased' },
  { value: 'upcoming', label: 'Upcoming' },
];

const KITSU_AGE_RATINGS = [
  { value: 'G', label: 'G - All Ages' },
  { value: 'PG', label: 'PG - Children' },
  { value: 'R', label: 'R - 17+' },
  { value: 'R18', label: 'R18 - Explicit' },
];

const KITSU_SEASON_OPTIONS = [
  { value: 'winter', label: 'Winter' },
  { value: 'spring', label: 'Spring' },
  { value: 'summer', label: 'Summer' },
  { value: 'fall', label: 'Fall' },
];

const KITSU_CATEGORIES = [
  { slug: 'action', title: 'Action' },
  { slug: 'adventure', title: 'Adventure' },
  { slug: 'comedy', title: 'Comedy' },
  { slug: 'drama', title: 'Drama' },
  { slug: 'sci-fi', title: 'Sci-Fi' },
  { slug: 'space', title: 'Space' },
  { slug: 'mystery', title: 'Mystery' },
  { slug: 'magic', title: 'Magic' },
  { slug: 'supernatural', title: 'Supernatural' },
  { slug: 'fantasy', title: 'Fantasy' },
  { slug: 'sports', title: 'Sports' },
  { slug: 'romance', title: 'Romance' },
  { slug: 'slice-of-life', title: 'Slice of Life' },
  { slug: 'horror', title: 'Horror' },
  { slug: 'psychological', title: 'Psychological' },
  { slug: 'thriller', title: 'Thriller' },
  { slug: 'martial-arts', title: 'Martial Arts' },
  { slug: 'super-power', title: 'Super Power' },
  { slug: 'school', title: 'School' },
  { slug: 'ecchi', title: 'Ecchi' },
  { slug: 'historical', title: 'Historical' },
  { slug: 'military', title: 'Military' },
  { slug: 'mecha', title: 'Mecha' },
  { slug: 'demons', title: 'Demons' },
  { slug: 'harem', title: 'Harem' },
  { slug: 'music', title: 'Music' },
  { slug: 'shounen', title: 'Shounen' },
  { slug: 'shoujo', title: 'Shoujo' },
  { slug: 'seinen', title: 'Seinen' },
  { slug: 'josei', title: 'Josei' },
  { slug: 'isekai', title: 'Isekai' },
  { slug: 'kids', title: 'Kids' },
  { slug: 'parody', title: 'Parody' },
];

export function KitsuFilterPanel({
  localCatalog,
  onFiltersChange,
  expandedSections,
  onToggleSection,
}) {
  const filters = localCatalog?.filters || {};
  const type = localCatalog?.type || 'anime';

  const isTrending = filters.kitsuListType === 'trending';

  const availableSubtypes = useMemo(() => {
    if (type === 'movie') return KITSU_SUBTYPES.filter((s) => s.value === 'movie');
    return KITSU_SUBTYPES.filter((s) => s.value !== 'movie');
  }, [type]);

  const categoryObjects = useMemo(
    () => KITSU_CATEGORIES.map((c) => ({ id: c.slug, name: c.title })),
    []
  );

  const getListBadge = () => {
    let count = 0;
    if (isTrending) count++;
    if (filters.kitsuSort && filters.kitsuSort !== '-averageRating' && !isTrending) count++;
    return count;
  };

  const getCategoryBadge = () => (filters.kitsuCategories || []).length;

  const getFormatBadge = () => {
    let count = 0;
    if ((filters.kitsuSubtype || []).length > 0) count++;
    if ((filters.kitsuStatus || []).length > 0) count++;
    if ((filters.kitsuAgeRating || []).length > 0) count++;
    return count;
  };

  const getSeasonBadge = () => {
    let count = 0;
    if (filters.kitsuSeason) count++;
    if (filters.kitsuSeasonYear) count++;
    return count;
  };

  const getOptionsBadge = () => (filters.randomize ? 1 : 0);

  const handleCategoryToggle = useCallback(
    (slug) => {
      const current = filters.kitsuCategories || [];
      if (current.includes(slug)) {
        onFiltersChange(
          'kitsuCategories',
          current.filter((c) => c !== slug)
        );
      } else {
        onFiltersChange('kitsuCategories', [...current, slug]);
      }
    },
    [filters.kitsuCategories, onFiltersChange]
  );

  return (
    <>
      <FilterSection
        id="ranking"
        title="List & Sort"
        description="Choose list type and sorting"
        icon={Settings}
        isOpen={expandedSections?.ranking}
        onToggle={onToggleSection}
        badgeCount={getListBadge()}
      >
        <div className="filter-grid">
          <div className="filter-group">
            <LabelWithTooltip
              label="List Type"
              tooltip="Browse allows filtering; Trending shows currently popular anime on Kitsu."
            />
            <SearchableSelect
              options={KITSU_LIST_TYPES}
              value={filters.kitsuListType || 'browse'}
              onChange={(value) => onFiltersChange('kitsuListType', value)}
              placeholder="Browse"
              labelKey="label"
              valueKey="value"
              allowClear={false}
            />
          </div>

          {!isTrending && (
            <div className="filter-group">
              <LabelWithTooltip
                label="Sort By"
                tooltip="How to order results. Only applies in Browse mode."
              />
              <SearchableSelect
                options={KITSU_SORT_OPTIONS}
                value={filters.kitsuSort || '-averageRating'}
                onChange={(value) => onFiltersChange('kitsuSort', value)}
                placeholder="Highest Rated"
                labelKey="label"
                valueKey="value"
                allowClear={false}
              />
            </div>
          )}
        </div>
      </FilterSection>

      {!isTrending && (
        <FilterSection
          id="genres"
          title="Categories"
          description="Filter by Kitsu anime categories"
          icon={Sparkles}
          isOpen={expandedSections?.genres}
          onToggle={onToggleSection}
          badgeCount={getCategoryBadge()}
        >
          <div className="genre-grid">
            {categoryObjects.map((cat) => {
              const isSelected = (filters.kitsuCategories || []).includes(cat.id);
              return (
                <button
                  key={cat.id}
                  type="button"
                  className={`genre-chip ${isSelected ? 'included' : ''}`}
                  onClick={() => handleCategoryToggle(cat.id)}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>
        </FilterSection>
      )}

      {!isTrending && (
        <FilterSection
          id="format"
          title="Type & Status"
          description="Subtype, airing status, and age rating"
          icon={Layers}
          isOpen={expandedSections?.format}
          onToggle={onToggleSection}
          badgeCount={getFormatBadge()}
        >
          <div className="filter-group">
            <LabelWithTooltip
              label="Subtype"
              tooltip="Filter by anime format: TV, Movie, OVA, ONA, Special."
            />
            <AnimeFormatSelector
              selected={filters.kitsuSubtype || []}
              options={availableSubtypes}
              onChange={(values) => onFiltersChange('kitsuSubtype', values)}
            />
          </div>

          <div className="filter-group">
            <LabelWithTooltip label="Status" tooltip="Filter by airing status." />
            <AnimeFormatSelector
              selected={filters.kitsuStatus || []}
              options={KITSU_STATUSES}
              onChange={(values) => onFiltersChange('kitsuStatus', values)}
            />
          </div>

          <div className="filter-group">
            <LabelWithTooltip label="Age Rating" tooltip="Filter by content age rating." />
            <AnimeFormatSelector
              selected={filters.kitsuAgeRating || []}
              options={KITSU_AGE_RATINGS}
              onChange={(values) => onFiltersChange('kitsuAgeRating', values)}
            />
          </div>
        </FilterSection>
      )}

      {!isTrending && type !== 'movie' && (
        <FilterSection
          id="season"
          title="Season"
          description="Filter by anime season and year"
          icon={Calendar}
          isOpen={expandedSections?.season}
          onToggle={onToggleSection}
          badgeCount={getSeasonBadge()}
        >
          <AnimeSeasonSelector
            season={filters.kitsuSeason || ''}
            seasonYear={filters.kitsuSeasonYear || ''}
            seasonOptions={KITSU_SEASON_OPTIONS}
            onSeasonChange={(value) => onFiltersChange('kitsuSeason', value || undefined)}
            onYearChange={(value) =>
              onFiltersChange('kitsuSeasonYear', value ? Number(value) : undefined)
            }
          />
        </FilterSection>
      )}

      <FilterSection
        id="options"
        title="Options"
        description="Additional display options"
        icon={Eye}
        isOpen={expandedSections?.options}
        onToggle={onToggleSection}
        badgeCount={getOptionsBadge()}
      >
        <div className="filter-group">
          <Checkbox
            checked={!!filters.randomize}
            onChange={(checked) => onFiltersChange('randomize', checked || undefined)}
            label="Randomize results"
          />
        </div>
      </FilterSection>
    </>
  );
}
