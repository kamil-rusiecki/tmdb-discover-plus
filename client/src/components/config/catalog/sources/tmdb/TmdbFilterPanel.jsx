import { Calendar, Layers, Play, Settings, Sparkles, Users } from 'lucide-react';
import { memo, useEffect, useMemo } from 'react';
import { FilterPanel } from '../../FilterPanel';
import { FilterSection } from '../../FilterSection';
import { GenreSelector } from '../../GenreSelector';
import { OptionsPanel } from '../../OptionsPanel';
import { PeopleFilters } from '../../PeopleFilters';
import { ReleaseFilters } from '../../ReleaseFilters';
import { StremioExtras } from '../../StremioExtras';
import { StreamFilters } from '../../StreamFilters';

import { SearchInput } from '../../../../forms/SearchInput';
import { SearchableSelect } from '../../../../forms/SearchableSelect';

export const TmdbFilterPanel = memo(function TmdbFilterPanel({
  localCatalog,
  onFiltersChange,
  sortOptions,
  originalLanguages,
  countries,
  safeCountries,
  safeCertifications,
  safeGenres,
  releaseTypes,
  tvStatuses,
  tvTypes,
  watchRegions,
  watchProviders,
  monetizationTypes,
  tvNetworkOptions,
  selectedNetworks,
  selectedPeople,
  setSelectedPeople,
  selectedCompanies,
  setSelectedCompanies,
  selectedKeywords,
  setSelectedKeywords,
  excludeKeywords,
  setExcludeKeywords,
  excludeCompanies,
  setExcludeCompanies,
  searchPerson,
  searchCompany,
  searchKeyword,
  searchCollection,
  getCollectionById,
  handleTVNetworkSearch,
  handleTriStateGenreClick,
  genresLoading,
  refreshGenres,
  expandedSections,
  onToggleSection,
  activeFilters,
  isPresetCatalog,
  supportsFullFilters,
  selectedCollection,
  setSelectedCollection,
}) {
  const catalogType = localCatalog?.type || 'movie';
  const isMovie = catalogType === 'movie';
  const isCollectionMode = catalogType === 'collection';

  const currentGenres = safeGenres[catalogType] || [];
  const selectedGenres = localCatalog?.filters?.genres || [];
  const excludedGenres = localCatalog?.filters?.excludeGenres || [];
  const certCountry = localCatalog?.filters?.certificationCountry || 'US';
  const certOptions = (safeCertifications[catalogType] || {})[certCountry] || [];
  const certCountryCodes = Object.keys(safeCertifications[catalogType] || {});
  const certCountries = safeCountries.filter((c) => certCountryCodes.includes(c.iso_3166_1));
  const getFilterCount = (section) => activeFilters.filter((f) => f.section === section).length;
  const collectionSortOptions = useMemo(() => {
    return (sortOptions?.movie || []).filter(
      (option) =>
        option.value === 'collection_order' ||
        option.value === 'release_date.desc' ||
        option.value === 'release_date.asc' ||
        option.value === 'title.asc' ||
        option.value === 'title.desc' ||
        option.value === 'popularity.desc' ||
        option.value === 'popularity.asc' ||
        option.value === 'vote_average.desc' ||
        option.value === 'vote_average.asc' ||
        option.value === 'vote_count.desc' ||
        option.value === 'vote_count.asc'
    );
  }, [sortOptions]);

  useEffect(() => {
    const currentCollectionId = localCatalog?.filters?.collectionId;
    if (!isCollectionMode || !currentCollectionId || !getCollectionById) return;
    if (selectedCollection && String(selectedCollection.id) === String(currentCollectionId)) return;

    let cancelled = false;
    getCollectionById(currentCollectionId, localCatalog?.filters?.displayLanguage || '')
      .then((collection) => {
        if (cancelled || !collection) return;
        setSelectedCollection({
          id: collection.id,
          name: collection.name,
          poster_path: collection.poster_path,
          backdrop_path: collection.backdrop_path,
        });
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [
    getCollectionById,
    isCollectionMode,
    localCatalog?.filters?.collectionId,
    localCatalog?.filters?.displayLanguage,
    selectedCollection,
    setSelectedCollection,
  ]);

  return (
    <>
      {isCollectionMode && (
        <FilterSection
          id="collection"
          title="Collection"
          description="Select one TMDB collection"
          icon={Sparkles}
          isOpen={expandedSections.collection}
          onToggle={onToggleSection}
          badgeCount={localCatalog?.filters?.collectionId ? 1 : 0}
        >
          <div className="filter-group">
            <span className="filter-label">Find collection</span>
            <SearchInput
              type="collection"
              placeholder="Search TMDB collections..."
              onSearch={async (query) => {
                const response = await searchCollection(
                  query,
                  1,
                  localCatalog?.filters?.displayLanguage || ''
                );
                return response?.results || [];
              }}
              selectedItems={selectedCollection}
              onSelect={(item) => {
                const normalized = {
                  id: item.id,
                  name: item.name,
                  poster_path: item.posterPath || null,
                  backdrop_path: item.backdropPath || null,
                };
                setSelectedCollection(normalized);
                onFiltersChange('listType', 'collection');
                onFiltersChange('collectionId', String(normalized.id));
                onFiltersChange('collectionName', normalized.name);
              }}
              onRemove={() => {
                setSelectedCollection(null);
                onFiltersChange('listType', 'collection');
                onFiltersChange('collectionId', undefined);
                onFiltersChange('collectionName', undefined);
              }}
              multiple={false}
            />
          </div>

          <div className="filter-group" style={{ marginTop: 12 }}>
            <span className="filter-label">Collection order</span>
            <SearchableSelect
              options={collectionSortOptions}
              value={localCatalog?.filters?.sortBy || 'collection_order'}
              onChange={(value) => onFiltersChange('sortBy', value)}
              placeholder="Collection Order"
              searchPlaceholder="Search..."
              labelKey="label"
              valueKey="value"
              allowClear={false}
            />
          </div>
        </FilterSection>
      )}

      {!isPresetCatalog && !isCollectionMode && (
        <FilterSection
          id="filters"
          title="Sort & Filter"
          description="Sorting, language, year, rating"
          icon={Settings}
          isOpen={expandedSections.filters}
          onToggle={onToggleSection}
          badgeCount={getFilterCount('filters')}
        >
          <FilterPanel
            localCatalog={localCatalog}
            onFiltersChange={onFiltersChange}
            sortOptions={sortOptions}
            originalLanguages={originalLanguages}
            countries={countries}
          />
        </FilterSection>
      )}

      {supportsFullFilters && (
        <FilterSection
          id="release"
          title={`${isMovie ? 'Release' : 'Air Date'} & Classification`}
          description="Date ranges, age ratings, release type"
          icon={Calendar}
          isOpen={expandedSections.release}
          onToggle={onToggleSection}
          badgeCount={getFilterCount('release')}
        >
          <ReleaseFilters
            localCatalog={localCatalog}
            onFiltersChange={onFiltersChange}
            isMovie={isMovie}
            countries={countries}
            releaseTypes={releaseTypes}
            tvStatuses={tvStatuses}
            tvTypes={tvTypes}
            certOptions={certOptions}
            certCountries={certCountries}
          />
        </FilterSection>
      )}

      {supportsFullFilters && (
        <FilterSection
          id="streaming"
          title="Where to Watch"
          description="Filter by streaming services and original networks"
          icon={Play}
          isOpen={expandedSections.streaming}
          onToggle={onToggleSection}
          badgeCount={getFilterCount('streaming')}
        >
          <StreamFilters
            type={catalogType}
            tvNetworks={tvNetworkOptions}
            selectedNetworks={selectedNetworks}
            watchRegions={watchRegions}
            watchProviders={watchProviders}
            monetizationTypes={monetizationTypes}
            onNetworkSearch={handleTVNetworkSearch}
            filters={localCatalog?.filters || {}}
            onFiltersChange={onFiltersChange}
          />
        </FilterSection>
      )}

      {supportsFullFilters && (
        <FilterSection
          id="genres"
          title="Genres"
          description={
            activeFilters.find((f) => f.section === 'genres')?.label ||
            'Select genres to include/exclude'
          }
          icon={Sparkles}
          isOpen={expandedSections.genres}
          onToggle={onToggleSection}
          badgeCount={getFilterCount('genres')}
        >
          <GenreSelector
            genres={currentGenres}
            selectedGenres={selectedGenres}
            excludedGenres={excludedGenres}
            genreMatchMode={localCatalog?.filters?.genreMatchMode || 'any'}
            onInclude={handleTriStateGenreClick}
            onExclude={handleTriStateGenreClick}
            onClear={handleTriStateGenreClick}
            onSetMatchMode={(mode) => onFiltersChange('genreMatchMode', mode)}
            loading={genresLoading}
            onRefresh={refreshGenres}
          />
        </FilterSection>
      )}

      {supportsFullFilters && (
        <FilterSection
          id="people"
          title={isMovie ? 'People & Studios' : 'Studios & Keywords'}
          description={
            isMovie
              ? 'Filter by cast, crew, or production company'
              : 'Filter by production companies and keywords'
          }
          icon={Users}
          isOpen={expandedSections.people}
          onToggle={onToggleSection}
          badgeCount={getFilterCount('people')}
        >
          <PeopleFilters
            selectedPeople={selectedPeople}
            onSelectPeople={setSelectedPeople}
            selectedCompanies={selectedCompanies}
            onSelectCompanies={setSelectedCompanies}
            selectedKeywords={selectedKeywords}
            onSelectKeywords={setSelectedKeywords}
            excludeKeywords={excludeKeywords}
            onExcludeKeywords={setExcludeKeywords}
            excludeCompanies={excludeCompanies}
            onExcludeCompanies={setExcludeCompanies}
            searchPerson={searchPerson}
            searchCompany={searchCompany}
            searchKeyword={searchKeyword}
            showPeople={isMovie}
          />
        </FilterSection>
      )}

      {supportsFullFilters ? (
        <FilterSection
          id="options"
          title="Options"
          description="Include adult, video, randomize, or discover-only results"
          icon={Settings}
          isOpen={expandedSections.options}
          onToggle={onToggleSection}
        >
          <OptionsPanel
            localCatalog={localCatalog}
            onFiltersChange={onFiltersChange}
            isMovie={isMovie}
          />
        </FilterSection>
      ) : (
        !isCollectionMode && (
          <div className="preset-empty-state">
            <Sparkles size={32} className="preset-empty-icon" />
            <span className="preset-empty-text">
              This is a curated preset from TMDB and cannot be modified.
            </span>
          </div>
        )
      )}

      {!isCollectionMode && (
        <FilterSection
          id="extras"
          title="Stremio Extras"
          description="Expose filter dropdowns inside Stremio"
          icon={Layers}
          isOpen={expandedSections.extras}
          onToggle={onToggleSection}
          badgeCount={(localCatalog?.filters?.stremioExtras || []).length}
        >
          <StremioExtras localCatalog={localCatalog} onFiltersChange={onFiltersChange} />
        </FilterSection>
      )}
    </>
  );
});
