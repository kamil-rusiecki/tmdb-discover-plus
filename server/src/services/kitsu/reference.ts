import {
  KITSU_SUBTYPES,
  KITSU_STATUSES,
  KITSU_AGE_RATINGS,
  KITSU_SORT_OPTIONS,
  KITSU_SEASONS,
  KITSU_CATEGORIES,
} from './types.ts';

export function getCategories(): Array<{ id: number; slug: string; title: string }> {
  return KITSU_CATEGORIES;
}

export function getSubtypes(): readonly { value: string; label: string }[] {
  return KITSU_SUBTYPES;
}

export function getStatuses(): readonly { value: string; label: string }[] {
  return KITSU_STATUSES;
}

export function getAgeRatings(): readonly { value: string; label: string }[] {
  return KITSU_AGE_RATINGS;
}

export function getSortOptions(): readonly { value: string; label: string }[] {
  return KITSU_SORT_OPTIONS;
}

export function getSeasons(): readonly string[] {
  return KITSU_SEASONS;
}
