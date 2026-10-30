import { ITEM_TYPES, type LibraryItem, type LibraryItemType } from './types';

export const TRACKABLE_TYPES = ['book', 'movie', 'tvshow', 'game', 'article', 'youtube'] as const;
export type TrackableType = (typeof TRACKABLE_TYPES)[number];

export const CARD_TYPE_LABELS: Record<LibraryItemType, string> = {
  note: 'Notes',
  quote: 'Quotes',
  image: 'Images',
  video: 'Videos',
  pdf: 'PDFs',
  audio: 'Records',
  link: 'Links',
  article: 'Articles',
  youtube: 'YouTube',
  tiktok: 'TikTok',
  tweet: 'Tweets',
  reddit: 'Reddit',
  book: 'Books',
  music: 'Music',
  movie: 'Movies',
  tvshow: 'TV Shows',
  game: 'Games',
};

export function validDate(value: unknown): Date | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  const day = value.match(/^(\d{4}-\d{2}-\d{2})(?:T|$)/)?.[1];
  if (day && !parseDayKey(day)) return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
}

export function localDayKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function parseDayKey(value: unknown): Date | null {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(0);
  date.setFullYear(year, month - 1, day);
  date.setHours(0, 0, 0, 0);
  return localDayKey(date) === value ? date : null;
}

export function matchesAddedDay(item: LibraryItem, day: string): boolean {
  const date = validDate(item.createdAt);
  return !!date && localDayKey(date) === day;
}

export function getLibraryActivity(items: LibraryItem[], currentYear: number) {
  const byDay: Record<string, number> = {};
  const byType = Object.fromEntries(ITEM_TYPES.map((type) => [type, 0])) as Record<
    LibraryItemType,
    number
  >;
  let firstSaved: Date | null = null;
  let completed = 0;
  const years = new Set([currentYear]);
  for (const item of items) {
    byType[item.type]++;
    const created = validDate(item.createdAt);
    if (created) {
      const key = localDayKey(created);
      byDay[key] = (byDay[key] ?? 0) + 1;
      if (!firstSaved || created < firstSaved) firstSaved = created;
    }
    if ('progressStatus' in item && item.progressStatus === 'completed') {
      completed++;
      const date = validDate(item.completedAt);
      if (date) years.add(date.getFullYear());
    }
  }
  return {
    total: items.length,
    firstSaved,
    completed,
    byDay,
    byType,
    activeDays: Object.keys(byDay).length,
    years: [...years].sort((a, b) => b - a),
  };
}

export function getMonthlyCompletions(
  items: LibraryItem[],
  year: number,
  type: TrackableType | null
) {
  const buckets = Array.from(
    { length: 12 },
    () => [] as { item: LibraryItem; timestamp: number }[]
  );
  let undated = 0;
  for (const item of items) {
    if (type && item.type !== type) continue;
    if (!('progressStatus' in item) || item.progressStatus !== 'completed') continue;
    const date = validDate(item.completedAt);
    if (!date) undated++;
    else if (date.getFullYear() === year) {
      buckets[date.getMonth()].push({ item, timestamp: date.getTime() });
    }
  }
  const months = buckets.map((bucket) =>
    bucket
      .sort((a, b) => a.timestamp - b.timestamp || a.item.id.localeCompare(b.item.id))
      .map(({ item }) => item)
  );
  return { months, undated };
}

/** Stable intensity thresholds shared across all years. */
export function additionLevel(count: number): number {
  return count <= 0 ? 0 : count === 1 ? 1 : count <= 3 ? 2 : count <= 6 ? 3 : 4;
}

export function getAdditionYears(byDay: Record<string, number>, currentYear: number): number[] {
  const years = new Set([currentYear]);
  for (const key of Object.keys(byDay)) {
    const date = parseDayKey(key);
    if (date && byDay[key] > 0) years.add(date.getFullYear());
  }
  return [...years].sort((a, b) => b - a);
}

export function getYearWeeks(year: number, mondayFirst: boolean): (string | null)[][] {
  const first = new Date(year, 0, 1);
  const offset = (first.getDay() + (mondayFirst ? 6 : 0)) % 7;
  const days = new Date(year, 1, 29).getMonth() === 1 ? 366 : 365;
  return Array.from({ length: Math.ceil((offset + days) / 7) }, (_, week) =>
    Array.from({ length: 7 }, (_, weekday) => {
      const index = week * 7 + weekday - offset;
      return index < 0 || index >= days ? null : localDayKey(new Date(year, 0, index + 1));
    })
  );
}

export type CompletionEntry = {
  id: string;
  item: LibraryItem;
  day: string | null;
  timestamp: number | null;
  seasonNumber?: number;
  seasonName?: string;
  rating?: number;
  comments?: string;
};

export function getCompletionTimeline(
  items: LibraryItem[],
  type: TrackableType | null
): CompletionEntry[] {
  const entries: CompletionEntry[] = [];
  for (const item of items) {
    if (type && item.type !== type) continue;
    if (item.type === 'tvshow') {
      for (const season of item.seasons) {
        if (season.progressStatus !== 'completed') continue;
        const date = validDate(season.completedAt);
        entries.push({
          id: `${item.id}:season:${season.seasonNumber}`,
          item,
          day: date ? localDayKey(date) : null,
          timestamp: date?.getTime() ?? null,
          seasonNumber: season.seasonNumber,
          seasonName: season.name,
          rating: season.review?.rating,
          comments: season.review?.comments,
        });
      }
    } else if ('progressStatus' in item && item.progressStatus === 'completed') {
      const date = validDate(item.completedAt);
      const review = 'review' in item ? item.review : undefined;
      entries.push({
        id: item.id,
        item,
        day: date ? localDayKey(date) : null,
        timestamp: date?.getTime() ?? null,
        rating: review?.rating,
        comments: review?.comments,
      });
    }
  }
  return entries.sort((a, b) => {
    if (a.timestamp === null && b.timestamp !== null) return 1;
    if (b.timestamp === null && a.timestamp !== null) return -1;
    return (b.timestamp ?? 0) - (a.timestamp ?? 0) || a.id.localeCompare(b.id);
  });
}
