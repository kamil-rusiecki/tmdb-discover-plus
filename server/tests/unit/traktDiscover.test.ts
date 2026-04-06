import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockedTraktFetch } = vi.hoisted(() => ({
  mockedTraktFetch: vi.fn(),
}));

vi.mock('../../src/services/trakt/client.ts', () => ({
  traktFetch: mockedTraktFetch,
}));

import { discover, normalizeTraktListType } from '../../src/services/trakt/discover.ts';

function responseForListType(listType: string) {
  if (listType === 'trending') {
    return [{ watchers: 1, movie: { title: 'A', ids: { trakt: 1, slug: 'a' } } }];
  }
  if (listType === 'popular') {
    return [{ title: 'B', ids: { trakt: 2, slug: 'b' } }];
  }
  if (listType === 'anticipated') {
    return [{ list_count: 1, movie: { title: 'C', ids: { trakt: 3, slug: 'c' } } }];
  }
  if (listType === 'recommended' || listType === 'favorited') {
    return [{ user_count: 1, movie: { title: 'D', ids: { trakt: 4, slug: 'd' } } }];
  }
  if (listType === 'watched' || listType === 'played' || listType === 'collected') {
    return [
      {
        watcher_count: 1,
        play_count: 1,
        collected_count: 1,
        movie: { title: 'E', ids: { trakt: 5, slug: 'e' } },
      },
    ];
  }
  if (listType === 'boxoffice') {
    return [{ revenue: 1, movie: { title: 'F', ids: { trakt: 6, slug: 'f' } } }];
  }
  if (listType === 'calendar' || listType === 'recently_aired') {
    return [{ released: '2024-01-01', movie: { title: 'G', ids: { trakt: 7, slug: 'g' } } }];
  }
  return [];
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('trakt discover routing', () => {
  it('normalizes legacy community_stats list type', () => {
    expect(normalizeTraktListType('community_stats')).toBe('watched');
    expect(normalizeTraktListType(undefined)).toBe('trending');
  });

  it('applies endpoint filters to trending lists', async () => {
    mockedTraktFetch.mockResolvedValue([
      {
        watchers: 42,
        movie: {
          title: 'Test',
          ids: { trakt: 1, slug: 'test' },
        },
      },
    ]);

    await discover(
      {
        traktListType: 'trending',
        traktGenres: ['action'],
        traktRatingMin: 80,
      },
      'movie',
      1,
      'client-id'
    );

    expect(mockedTraktFetch).toHaveBeenCalledWith(
      expect.stringContaining('/movies/trending?page=1&limit=20&extended=full'),
      'client-id'
    );
    expect(mockedTraktFetch).toHaveBeenCalledWith(
      expect.stringContaining('genres=action'),
      'client-id'
    );
    expect(mockedTraktFetch).toHaveBeenCalledWith(
      expect.stringContaining('ratings=80-100'),
      'client-id'
    );
  });

  it('does not send filters to box office endpoint', async () => {
    mockedTraktFetch.mockResolvedValue([
      {
        revenue: 123,
        movie: {
          title: 'Box',
          ids: { trakt: 2, slug: 'box' },
        },
      },
    ]);

    await discover(
      {
        traktListType: 'boxoffice',
        traktGenres: ['action'],
        traktRatingMin: 80,
      },
      'movie',
      1,
      'client-id'
    );

    expect(mockedTraktFetch).toHaveBeenCalledWith('/movies/boxoffice?extended=full', 'client-id');
  });

  it('routes legacy community_stats to watched endpoint with filters', async () => {
    mockedTraktFetch.mockResolvedValue([
      {
        watcher_count: 10,
        play_count: 12,
        collected_count: 7,
        movie: {
          title: 'Watched',
          ids: { trakt: 3, slug: 'watched' },
        },
      },
    ]);

    await discover(
      {
        traktListType: 'community_stats',
        traktPeriod: 'monthly',
        traktVotesMin: 500,
      },
      'movie',
      1,
      'client-id'
    );

    expect(mockedTraktFetch).toHaveBeenCalledWith(
      expect.stringContaining('/movies/watched/monthly?page=1&limit=20&extended=full'),
      'client-id'
    );
    expect(mockedTraktFetch).toHaveBeenCalledWith(
      expect.stringContaining('votes=500-'),
      'client-id'
    );
  });

  it('does not append filter params for custom list endpoint', async () => {
    mockedTraktFetch.mockResolvedValue([
      {
        rank: 1,
        id: 1,
        listed_at: '2024-01-01T00:00:00.000Z',
        type: 'movie',
        movie: {
          title: 'List Item',
          ids: { trakt: 4, slug: 'list-item' },
        },
      },
    ]);

    await discover(
      {
        traktListType: 'list',
        traktListId: 'username',
        traktGenres: ['comedy'],
      },
      'movie',
      1,
      'client-id'
    );

    expect(mockedTraktFetch).toHaveBeenCalledWith(
      '/users/username/items/movies?page=1&limit=20&extended=full',
      'client-id'
    );
  });

  it.each([
    ['trending', '/movies/trending?'],
    ['popular', '/movies/popular?'],
    ['anticipated', '/movies/anticipated?'],
    ['recommended', '/movies/recommended/monthly?'],
    ['favorited', '/movies/favorited/monthly?'],
    ['watched', '/movies/watched/monthly?'],
    ['played', '/movies/played/monthly?'],
    ['collected', '/movies/collected/monthly?'],
    ['calendar', '/calendars/all/movies/'],
    ['recently_aired', '/calendars/all/movies/'],
    ['boxoffice', '/movies/boxoffice?extended=full'],
  ])('routes %s option to expected endpoint', async (listType, expectedPath) => {
    mockedTraktFetch.mockResolvedValue(responseForListType(listType));

    await discover(
      {
        traktListType: listType,
        traktPeriod: 'monthly',
        traktCalendarType: 'movies',
        traktCalendarDays: 7,
      },
      'movie',
      1,
      'client-id'
    );

    const firstUrl = String(mockedTraktFetch.mock.calls[0][0]);
    expect(firstUrl).toContain(expectedPath);
  });

  it('supports long-range upcoming calendar windows (12 months preset)', async () => {
    mockedTraktFetch.mockResolvedValue(responseForListType('calendar'));

    await discover(
      {
        traktListType: 'calendar',
        traktCalendarType: 'movies',
        traktCalendarDays: 365,
      },
      'movie',
      1,
      'client-id-12mo'
    );

    expect(mockedTraktFetch.mock.calls.length).toBeGreaterThan(1);
    expect(String(mockedTraktFetch.mock.calls[0][0])).toContain('/calendars/all/movies/');
  });

  it('applies Trakt Min Votes post-filter on calendar results', async () => {
    mockedTraktFetch.mockResolvedValue([
      {
        released: '2024-01-01',
        movie: {
          title: 'Low Votes',
          votes: 10,
          ids: { trakt: 71, slug: 'low-votes' },
        },
      },
      {
        released: '2024-01-02',
        movie: {
          title: 'High Votes',
          votes: 500,
          ids: { trakt: 72, slug: 'high-votes' },
        },
      },
    ]);

    const result = await discover(
      {
        traktListType: 'calendar',
        traktCalendarType: 'movies',
        traktCalendarDays: 7,
        traktVotesMin: 100,
      },
      'movie',
      1,
      'client-id'
    );

    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.title).toBe('High Votes');
  });

  it('applies Trakt Rating post-filter on calendar using 0-100 slider scale', async () => {
    mockedTraktFetch.mockResolvedValue([
      {
        released: '2024-01-01',
        movie: {
          title: 'Rated 7.9',
          rating: 7.9,
          ids: { trakt: 81, slug: 'rated-79' },
        },
      },
      {
        released: '2024-01-02',
        movie: {
          title: 'Rated 8.2',
          rating: 8.2,
          ids: { trakt: 82, slug: 'rated-82' },
        },
      },
    ]);

    const result = await discover(
      {
        traktListType: 'calendar',
        traktCalendarType: 'movies',
        traktCalendarDays: 7,
        traktRatingMin: 80,
      },
      'movie',
      1,
      'client-id'
    );

    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.title).toBe('Rated 8.2');
  });
});
