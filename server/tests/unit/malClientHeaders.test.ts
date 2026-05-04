import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockFetch } = vi.hoisted(() => ({
  mockFetch: vi.fn(),
}));

vi.stubGlobal('fetch', mockFetch);

vi.mock('../../src/version.ts', () => ({
  ADDON_VERSION: '9.9.9-test',
}));

import { jikanFetch } from '../../src/services/mal/client.ts';

describe('mal client outbound headers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        pagination: {
          last_visible_page: 1,
          has_next_page: false,
          current_page: 1,
          items: { count: 0, total: 0, per_page: 25 },
        },
        data: [],
      }),
    });
  });

  it('sends a user agent and accept header to Jikan', async () => {
    await jikanFetch('/top/anime?page=1');

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [, options] = mockFetch.mock.calls[0] as [string, { headers: Record<string, string> }];

    expect(options.headers.Accept).toBe('application/json');
    expect(options.headers['User-Agent']).toBe(
      'TMDB-Discover-Plus/9.9.9-test (+https://github.com/semi-column/tmdb-discover-plus)'
    );
  });
});
