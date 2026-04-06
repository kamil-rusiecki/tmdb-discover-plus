export const TRAKT_BROWSE_TYPES = [
  { value: 'discover', label: 'Discover' },
  { value: 'community', label: 'Community' },
  { value: 'calendar', label: 'Calendar' },
  { value: 'other', label: 'Other' },
];

const BROWSE_TYPE_OPTIONS = {
  discover: ['trending', 'popular', 'anticipated', 'recommended'],
  community: ['favorited', 'watched', 'played', 'collected'],
  calendar: ['calendar', 'recently_aired'],
  other: ['boxoffice'],
};

const PERIOD_LIST_TYPES = new Set(['recommended', 'favorited', 'watched', 'played', 'collected']);
const CALENDAR_LIST_TYPES = new Set(['calendar', 'recently_aired']);
const NON_FILTER_LIST_TYPES = new Set(['boxoffice', 'list']);

function humanize(value) {
  return String(value)
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function normalizeTraktListType(listType) {
  if (!listType) return 'trending';
  if (listType === 'community_stats') return 'watched';
  return listType;
}

export function getBrowseTypeForListType(listType) {
  const normalized = normalizeTraktListType(listType);
  const match = Object.entries(BROWSE_TYPE_OPTIONS).find(([, values]) =>
    values.includes(normalized)
  );
  return match?.[0] || 'discover';
}

function getOptionLabel(value, listTypes, communityMetrics) {
  const fromListTypes = listTypes.find((item) => item.value === value)?.label;
  if (fromListTypes) return fromListTypes;

  const fromCommunityMetrics = communityMetrics.find((item) => item.value === value)?.label;
  if (fromCommunityMetrics) return fromCommunityMetrics;

  return humanize(value);
}

export function getListTypeOptionsForBrowseType({
  browseType,
  listTypes = [],
  communityMetrics = [],
  isMovie = true,
}) {
  const values = BROWSE_TYPE_OPTIONS[browseType] || [];
  return values
    .filter((value) => isMovie || value !== 'boxoffice')
    .map((value) => ({
      value,
      label: getOptionLabel(value, listTypes, communityMetrics),
    }));
}

export function getAvailableBrowseTypes({ listTypes = [], communityMetrics = [], isMovie = true }) {
  return TRAKT_BROWSE_TYPES.filter(
    (browseType) =>
      getListTypeOptionsForBrowseType({
        browseType: browseType.value,
        listTypes,
        communityMetrics,
        isMovie,
      }).length > 0
  );
}

export function getDefaultListTypeForBrowseType({
  browseType,
  listTypes = [],
  communityMetrics = [],
  isMovie = true,
}) {
  const options = getListTypeOptionsForBrowseType({
    browseType,
    listTypes,
    communityMetrics,
    isMovie,
  });
  return options[0]?.value || 'trending';
}

export function supportsTraktPeriod(listType) {
  return PERIOD_LIST_TYPES.has(normalizeTraktListType(listType));
}

export function supportsTraktCalendarSettings(listType) {
  return CALENDAR_LIST_TYPES.has(normalizeTraktListType(listType));
}

export function supportsTraktAdvancedFilters(listType) {
  return !NON_FILTER_LIST_TYPES.has(normalizeTraktListType(listType));
}
