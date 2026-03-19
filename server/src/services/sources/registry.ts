import { TmdbSource } from './TmdbSource.ts';
import { ImdbSource } from './ImdbSource.ts';
import type { IDiscoverSource } from './types.ts';

const SOURCE_REGISTRY = new Map<string, IDiscoverSource>([
  ['tmdb', TmdbSource],
  ['imdb', ImdbSource],
]);

export function getSource(id: string | undefined): IDiscoverSource {
  return SOURCE_REGISTRY.get(id ?? 'tmdb') ?? TmdbSource;
}

export function getAllSources(): IDiscoverSource[] {
  return Array.from(SOURCE_REGISTRY.values());
}
