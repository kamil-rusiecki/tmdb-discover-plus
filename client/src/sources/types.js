/**
 * @typedef {Object} ActiveChip
 * @property {string} key
 * @property {string} label
 * @property {string} section
 */

/**
 * @typedef {Object} SourceRefData
 * @property {{ movie: Array, series: Array }} genres
 * @property {{ movie: Array, series: Array }} sortOptions
 * @property {Array} originalLanguages
 * @property {Array} countries
 * @property {Array} [imdbSortOptions]
 * @property {Array} [tvStatuses]
 * @property {Array} [tvTypes]
 * @property {Array} [watchRegions]
 * @property {Array} [monetizationTypes]
 * @property {Array} [selectedPeople]
 * @property {Array} [selectedCompanies]
 * @property {Array} [selectedKeywords]
 * @property {Array} [excludeKeywords]
 * @property {Array} [excludeCompanies]
 * @property {Array} [selectedImdbExcludeCompanies]
 */

/**
 * @typedef {Object} SourceDescriptor
 * @property {string} id
 * @property {string} label
 * @property {string} defaultSortBy
 * @property {Object} defaultFilters
 * @property {string[]} movieOnlyFilterKeys
 * @property {string[]} seriesOnlyFilterKeys
 * @property {(currentFilters: Object) => Object} cleanFiltersOnSwitch
 * @property {(filters: Object, refData: SourceRefData) => ActiveChip[]} computeActiveChips
 * @property {import('react').LazyExoticComponent} FilterPanelComponent
 */
