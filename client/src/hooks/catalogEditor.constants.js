export const DEFAULT_CATALOG = {
  name: '',
  type: 'movie',
  filters: {
    genres: [],
    excludeGenres: [],
    sortBy: 'popularity.desc',
    imdbOnly: false,
    voteCountMin: 0,
  },
  enabled: true,
};

// Filters that only make sense for movie-type catalogs.
export const MOVIE_ONLY_FILTER_KEYS = [
  'includeVideo',
  'primaryReleaseYear',
  'releaseDateFrom',
  'releaseDateTo',
  'releaseTypes',
  'releaseType',
];

// Filters that only make sense for series-type catalogs.
export const SERIES_ONLY_FILTER_KEYS = [
  'airDateFrom',
  'airDateTo',
  'firstAirDateFrom',
  'firstAirDateTo',
  'firstAirDateYear',
  'includeNullFirstAirDates',
  'screenedTheatrically',
  'timezone',
  'withNetworks',
  'networks',
  'tvStatus',
  'tvType',
];
