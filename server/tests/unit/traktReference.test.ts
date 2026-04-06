import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockedTraktFetch } = vi.hoisted(() => ({
  mockedTraktFetch: vi.fn(),
}));

vi.mock('../../src/services/trakt/client.ts', () => ({
  traktFetch: mockedTraktFetch,
}));

import {
  getGenresByType,
  resetReferenceCachesForTests,
} from '../../src/services/trakt/reference.ts';

describe('trakt reference genres', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetReferenceCachesForTests();
  });

  it('fetches and returns movie/show genres from trakt endpoints', async () => {
    mockedTraktFetch.mockImplementation((path: string) => {
      if (path === '/genres/movies') {
        return Promise.resolve([
          { name: 'Action', slug: 'action' },
          { name: 'Short', slug: 'short' },
        ]);
      }
      if (path === '/genres/shows') {
        return Promise.resolve([
          { name: 'Reality', slug: 'reality' },
          { name: 'Soap', slug: 'soap' },
        ]);
      }
      return Promise.resolve([]);
    });

    const result = await getGenresByType('client-id');

    expect(result.movie.map((g) => g.slug)).toEqual(['action', 'short']);
    expect(result.series.map((g) => g.slug)).toEqual(['reality', 'soap']);
    expect(mockedTraktFetch).toHaveBeenCalledWith('/genres/movies', 'client-id');
    expect(mockedTraktFetch).toHaveBeenCalledWith('/genres/shows', 'client-id');
  });

  it('falls back to static type split when trakt fetch fails', async () => {
    mockedTraktFetch.mockRejectedValue(new Error('network'));

    const result = await getGenresByType('client-id');

    expect(result.series.some((g) => g.slug === 'soap')).toBe(true);
    expect(result.series.some((g) => g.slug === 'reality')).toBe(true);
    expect(result.movie.some((g) => g.slug === 'soap')).toBe(false);
    expect(result.movie.some((g) => g.slug === 'reality')).toBe(false);
    expect(result.movie.some((g) => g.slug === 'short')).toBe(true);
  });
});
