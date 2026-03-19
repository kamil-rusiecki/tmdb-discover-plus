import { TMDB_SOURCE } from './tmdb.source';
import { IMDB_SOURCE } from './imdb.source';

const SOURCE_REGISTRY = new Map([
  [TMDB_SOURCE.id, TMDB_SOURCE],
  [IMDB_SOURCE.id, IMDB_SOURCE],
]);

export function getSource(id) {
  return SOURCE_REGISTRY.get(id ?? 'tmdb') ?? SOURCE_REGISTRY.get('tmdb');
}

export function getAllSources() {
  return Array.from(SOURCE_REGISTRY.values());
}

export { TMDB_SOURCE, IMDB_SOURCE };
