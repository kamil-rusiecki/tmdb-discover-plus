export function formatRuntime(minutes: number | null | undefined): string | undefined {
  if (!minutes) return undefined;
  if (minutes < 60) return `${minutes}min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h${m}min` : `${h}h`;
}

export function generateSlug(
  type: string,
  title: string | null | undefined,
  id: string | number
): string {
  const safeTitle = (title || '').toLowerCase().replace(/ /g, '-');
  return `${type}/${safeTitle}-${id}`;
}
