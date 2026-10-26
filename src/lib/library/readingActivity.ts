import { getLogActivity } from './logActivity';
import type { BookItem, LibraryItem } from './types';

export function getReadingActivity(items: LibraryItem[], year: number, today = new Date()) {
  const activity = getLogActivity(items, year, today, 'book');
  return {
    bestStreak: activity.bestStreak,
    bestStreakDays: activity.bestStreakDays,
    byDay: activity.byDay as Record<string, BookItem[]>,
    readingDays: activity.activeDays,
  };
}
