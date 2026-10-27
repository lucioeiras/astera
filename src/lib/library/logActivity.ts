import { localDayKey, parseDayKey } from './activity';
import type { BookItem, GameItem, LibraryItem } from './types';

/** Logs use local YYYY-MM-DD dates, independent of their creation timestamps. */
export type LogActivityFilter = 'book' | 'game' | null;
export type LoggedItem = BookItem | GameItem;

export function getLogActivity(
  items: LibraryItem[],
  year: number,
  today = new Date(),
  filter: LogActivityFilter = null
) {
  const byDay: Record<string, LoggedItem[]> = {};
  const cutoff = localDayKey(today);
  for (const item of items) {
    if (item.type !== 'book' && item.type !== 'game') continue;
    if (filter && item.type !== filter) continue;
    const seen = new Set<string>();
    for (const log of (item.type === 'book' ? item.readingLogs : item.playLogs) ?? []) {
      const date = parseDayKey(log.date);
      if (!date || date.getFullYear() !== year || log.date > cutoff || seen.has(log.date)) continue;
      seen.add(log.date);
      (byDay[log.date] ??= []).push(item);
    }
  }
  const days = Object.keys(byDay).sort();
  let bestStreak = 0;
  let run: string[] = [];
  let bestStreakDays = new Set<string>();
  for (const day of days) {
    const previous = run.at(-1);
    let consecutive = false;
    if (previous) {
      const next = parseDayKey(previous)!;
      next.setDate(next.getDate() + 1);
      consecutive = localDayKey(next) === day;
    }
    run = consecutive ? [...run, day] : [day];
    if (run.length > bestStreak) {
      bestStreak = run.length;
      bestStreakDays = new Set(run);
    } else if (run.length === bestStreak) {
      for (const date of run) bestStreakDays.add(date);
    }
  }
  return { byDay, bestStreak, bestStreakDays, activeDays: days.length };
}
