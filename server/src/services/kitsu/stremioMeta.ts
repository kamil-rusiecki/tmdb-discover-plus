import { getEntryByKitsuId, kitsuIdToStremioId } from '../animeIdMap/index.ts';
import type { KitsuAnime } from './types.ts';
import type { StremioMetaPreview } from '../../types/stremio.ts';
import type { StremioLink } from '../../types/stremio.ts';
import type { ContentType } from '../../types/common.ts';
import { generateSlug } from '../common/stremioHelpers.ts';

export function kitsuToStremioMeta(
  anime: KitsuAnime,
  type: ContentType
): StremioMetaPreview | null {
  const mappedStremioId = kitsuIdToStremioId(anime.id);
  const stremioId = mappedStremioId || `kitsu:${anime.id}`;

  const mapEntry = getEntryByKitsuId(anime.id);
  const imdbId = mapEntry?.imdb_id || (stremioId.startsWith('tt') ? stremioId : null);
  const primaryId = imdbId || stremioId;
  const tmdbId = mapEntry?.themoviedb_id ?? 0;

  const title = anime.titles?.en || anime.title;

  const links: StremioLink[] = [];

  const releaseInfo: string[] = [];
  if (anime.startDate) {
    releaseInfo.push(anime.startDate.split('-')[0]);
  }
  if (anime.status === 'current') {
    releaseInfo.push('Airing');
  }

  const rating = anime.averageRating ? (anime.averageRating / 10).toFixed(1) : undefined;

  return {
    id: primaryId,
    tmdbId,
    imdbId,
    imdb_id: imdbId,
    type,
    name: title,
    slug: generateSlug(type, title, primaryId),
    poster: anime.poster,
    posterShape: 'poster',
    background: anime.cover,
    fanart: anime.cover,
    landscapePoster: null,
    description: anime.synopsis || '',
    genres: anime.categories,
    links: links.length > 0 ? links : undefined,
    releaseInfo: releaseInfo.join(' · '),
    imdbRating: rating,
    behaviorHints: {},
  };
}

export function batchConvertToStremioMeta(
  animeList: KitsuAnime[],
  type: ContentType
): StremioMetaPreview[] {
  const results: StremioMetaPreview[] = [];
  for (const anime of animeList) {
    const meta = kitsuToStremioMeta(anime, type);
    if (meta) results.push(meta);
  }
  return results;
}
