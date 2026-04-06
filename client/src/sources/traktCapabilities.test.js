import { describe, it, expect } from 'vitest';
import {
  getAvailableBrowseTypes,
  getBrowseTypeForListType,
  getDefaultListTypeForBrowseType,
  getListTypeOptionsForBrowseType,
  normalizeTraktListType,
  supportsTraktAdvancedFilters,
  supportsTraktCalendarSettings,
  supportsTraktPeriod,
} from './traktCapabilities';

const listTypes = [
  { value: 'trending', label: 'Trending Now' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'anticipated', label: 'Most Anticipated' },
  { value: 'recommended', label: 'Recommended' },
  { value: 'favorited', label: 'Most Favorited' },
  { value: 'calendar', label: 'Calendar (Upcoming)' },
  { value: 'recently_aired', label: 'Recently Aired' },
  { value: 'boxoffice', label: 'Box Office' },
];

const communityMetrics = [
  { value: 'watched', label: 'Unique Viewers' },
  { value: 'played', label: 'Total Plays' },
  { value: 'collected', label: 'Library Adds' },
];

describe('traktCapabilities', () => {
  it('normalizes community_stats to watched', () => {
    expect(normalizeTraktListType('community_stats')).toBe('watched');
    expect(normalizeTraktListType(undefined)).toBe('trending');
  });

  it('resolves browse type by list type', () => {
    expect(getBrowseTypeForListType('recommended')).toBe('discover');
    expect(getBrowseTypeForListType('played')).toBe('community');
    expect(getBrowseTypeForListType('recently_aired')).toBe('calendar');
    expect(getBrowseTypeForListType('boxoffice')).toBe('other');
  });

  it('builds community options from metrics labels', () => {
    const options = getListTypeOptionsForBrowseType({
      browseType: 'community',
      listTypes,
      communityMetrics,
      isMovie: true,
    });

    expect(options.map((o) => o.value)).toEqual(['favorited', 'watched', 'played', 'collected']);
    expect(options.find((o) => o.value === 'watched')?.label).toBe('Unique Viewers');
  });

  it('hides movie-only browse options for series', () => {
    const browseTypes = getAvailableBrowseTypes({
      listTypes,
      communityMetrics,
      isMovie: false,
    });

    expect(browseTypes.map((o) => o.value)).not.toContain('other');
  });

  it('returns default option per browse type', () => {
    const defaultCommunity = getDefaultListTypeForBrowseType({
      browseType: 'community',
      listTypes,
      communityMetrics,
      isMovie: true,
    });

    expect(defaultCommunity).toBe('favorited');
  });

  it('exposes option capability checks', () => {
    expect(supportsTraktPeriod('recommended')).toBe(true);
    expect(supportsTraktPeriod('popular')).toBe(false);
    expect(supportsTraktCalendarSettings('calendar')).toBe(true);
    expect(supportsTraktCalendarSettings('trending')).toBe(false);
    expect(supportsTraktAdvancedFilters('boxoffice')).toBe(false);
    expect(supportsTraktAdvancedFilters('trending')).toBe(true);
  });
});
