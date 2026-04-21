export interface TraktIds {
  trakt: number;
  slug: string;
  imdb?: string;
  tmdb?: number;
  tvdb?: number;
}

export interface TraktMovie {
  title: string;
  year?: number;
  ids: TraktIds;
  tagline?: string;
  overview?: string;
  released?: string;
  runtime?: number;
  country?: string;
  trailer?: string;
  status?: string;
  rating?: number;
  votes?: number;
  language?: string;
  genres?: string[];
  certification?: string;
}

export interface TraktShow {
  title: string;
  year?: number;
  ids: TraktIds;
  overview?: string;
  first_aired?: string;
  runtime?: number;
  certification?: string;
  network?: string;
  country?: string;
  trailer?: string;
  status?: string;
  rating?: number;
  votes?: number;
  language?: string;
  genres?: string[];
  aired_episodes?: number;
  seasons?: number;
}

export interface TraktTrendingMovie {
  watchers: number;
  movie: TraktMovie;
}

export interface TraktTrendingShow {
  watchers: number;
  show: TraktShow;
}

export interface TraktPlayedMovie {
  watcher_count: number;
  play_count: number;
  collected_count: number;
  movie: TraktMovie;
}

export interface TraktPlayedShow {
  watcher_count: number;
  play_count: number;
  collected_count: number;
  show: TraktShow;
}

export interface TraktAnticipatedMovie {
  list_count: number;
  movie: TraktMovie;
}

export interface TraktAnticipatedShow {
  list_count: number;
  show: TraktShow;
}

export interface TraktBoxOfficeMovie {
  revenue: number;
  movie: TraktMovie;
}

export interface TraktFavoritedMovie {
  user_count: number;
  movie: TraktMovie;
}

export interface TraktFavoritedShow {
  user_count: number;
  show: TraktShow;
}

export interface TraktSearchResult {
  type: string;
  score: number;
  movie?: TraktMovie;
  show?: TraktShow;
}

export interface TraktWatchlistItem {
  rank: number;
  id: number;
  listed_at: string;
  type: string;
  movie?: TraktMovie;
  show?: TraktShow;
}

export interface TraktRatedItem {
  rated_at: string;
  rating: number;
  type: string;
  movie?: TraktMovie;
  show?: TraktShow;
}

export interface TraktCalendarMovie {
  released: string;
  movie: TraktMovie;
}

export interface TraktCalendarShow {
  first_aired: string;
  episode: {
    season: number;
    number: number;
    title: string;
    ids: TraktIds;
  };
  show: TraktShow;
}

export interface TraktListItem {
  rank: number;
  id: number;
  listed_at: string;
  type: string;
  movie?: TraktMovie;
  show?: TraktShow;
}

export interface TraktNetwork {
  name: string;
  country?: string;
  ids: {
    trakt: number;
    tmdb?: number;
  };
}

export interface TraktGenre {
  name: string;
  slug: string;
}

export const TRAKT_LIST_TYPES = [
  { value: 'trending', label: 'Trending Now', group: 'Discovery' },
  { value: 'popular', label: 'Most Popular', group: 'Discovery' },
  { value: 'anticipated', label: 'Most Anticipated', group: 'Discovery' },
  { value: 'recommended', label: 'Recommended', group: 'Discovery' },
  { value: 'favorited', label: 'Most Favorited', group: 'Rankings' },
  { value: 'community_stats', label: 'Community Stats', group: 'Rankings' },
  { value: 'calendar', label: 'Upcoming Releases', group: 'Schedule' },
  { value: 'recently_aired', label: 'Recently Aired', group: 'Schedule' },
  { value: 'boxoffice', label: 'Box Office', group: 'Other' },
] as const;

export const TRAKT_COMMUNITY_METRICS = [
  { value: 'watched', label: 'Unique Viewers' },
  { value: 'played', label: 'Total Plays' },
  { value: 'collected', label: 'Library Adds' },
] as const;

export const TRAKT_PERIODS = [
  { value: 'weekly', label: 'This Week' },
  { value: 'monthly', label: 'This Month' },
  { value: 'yearly', label: 'This Year' },
  { value: 'all', label: 'All Time' },
] as const;

export const TRAKT_CALENDAR_TYPES = [
  { value: 'movies', label: 'Theatrical Movies' },
  { value: 'dvd', label: 'Home Release (DVD/Digital)' },
  { value: 'streaming', label: 'Streaming Premieres' },
  { value: 'shows', label: 'Episode Airings' },
  { value: 'shows_new', label: 'New Show Premieres' },
  { value: 'shows_premieres', label: 'Season Premieres' },
  { value: 'shows_finales', label: 'Season/Series Finales' },
] as const;

export const TRAKT_SHOW_STATUSES = [
  { value: 'returning series', label: 'Returning Series' },
  { value: 'continuing', label: 'Continuing' },
  { value: 'in production', label: 'In Production' },
  { value: 'planned', label: 'Planned' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'pilot', label: 'Pilot' },
  { value: 'canceled', label: 'Canceled' },
  { value: 'ended', label: 'Ended' },
] as const;

export const TRAKT_GENRES: TraktGenre[] = [
  { name: 'Action', slug: 'action' },
  { name: 'Adventure', slug: 'adventure' },
  { name: 'Animation', slug: 'animation' },
  { name: 'Anime', slug: 'anime' },
  { name: 'Biography', slug: 'biography' },
  { name: 'Children', slug: 'children' },
  { name: 'Comedy', slug: 'comedy' },
  { name: 'Crime', slug: 'crime' },
  { name: 'Documentary', slug: 'documentary' },
  { name: 'Donghua', slug: 'donghua' },
  { name: 'Drama', slug: 'drama' },
  { name: 'Family', slug: 'family' },
  { name: 'Fantasy', slug: 'fantasy' },
  { name: 'Game Show', slug: 'game-show' },
  { name: 'History', slug: 'history' },
  { name: 'Holiday', slug: 'holiday' },
  { name: 'Home and Garden', slug: 'home-and-garden' },
  { name: 'Horror', slug: 'horror' },
  { name: 'Mini Series', slug: 'mini-series' },
  { name: 'Music', slug: 'music' },
  { name: 'Musical', slug: 'musical' },
  { name: 'Mystery', slug: 'mystery' },
  { name: 'News', slug: 'news' },
  { name: 'None', slug: 'none' },
  { name: 'Reality', slug: 'reality' },
  { name: 'Romance', slug: 'romance' },
  { name: 'Science Fiction', slug: 'science-fiction' },
  { name: 'Short', slug: 'short' },
  { name: 'Soap', slug: 'soap' },
  { name: 'Special Interest', slug: 'special-interest' },
  { name: 'Sporting Event', slug: 'sporting-event' },
  { name: 'Superhero', slug: 'superhero' },
  { name: 'Suspense', slug: 'suspense' },
  { name: 'Talk Show', slug: 'talk-show' },
  { name: 'Thriller', slug: 'thriller' },
  { name: 'War', slug: 'war' },
  { name: 'Western', slug: 'western' },
];

export const TRAKT_CERTIFICATIONS_MOVIES = [
  { value: 'g', label: 'G' },
  { value: 'pg', label: 'PG' },
  { value: 'pg-13', label: 'PG-13' },
  { value: 'r', label: 'R' },
  { value: 'nc-17', label: 'NC-17' },
  { value: 'nr', label: 'NR' },
] as const;

export const TRAKT_CERTIFICATIONS_SHOWS = [
  { value: 'tv-y', label: 'TV-Y' },
  { value: 'tv-y7', label: 'TV-Y7' },
  { value: 'tv-g', label: 'TV-G' },
  { value: 'tv-pg', label: 'TV-PG' },
  { value: 'tv-14', label: 'TV-14' },
  { value: 'tv-ma', label: 'TV-MA' },
  { value: 'nr', label: 'NR' },
] as const;
