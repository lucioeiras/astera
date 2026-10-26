import { getLogActivity } from '@/lib/library/logActivity';
import type { BookItem, GameItem } from '@/lib/library/types';
const base = { version: 1 as const, createdAt: '', updatedAt: '', title: 'Title', cover: '' };
const book: BookItem = {
  ...base,
  id: 'book',
  type: 'book',
  authors: [],
  isbn: '',
  readingLogs: ['2026-09-30', '2026-10-02'].map((date) => ({
    id: date,
    date,
    page: 1,
    createdAt: '',
  })),
};
const game: GameItem = {
  ...base,
  id: 'game',
  type: 'game',
  progressStatus: 'completed',
  playLogs: [
    '2026-10-01',
    '2026-10-02',
    '2026-10-02',
    '2026-10-04',
    '2026-02-30',
    '2025-12-31',
  ].map((date, index) => ({ id: String(index), date, createdAt: '' })),
};
const today = new Date(2026, 9, 3);
it('combines consecutive reading and playing days across months and deduplicates cards', () => {
  const result = getLogActivity([book, game], 2026, today);
  expect(result.bestStreak).toBe(3);
  expect(result.activeDays).toBe(3);
  expect(result.byDay['2026-10-02'].map((item) => item.id)).toEqual(['book', 'game']);
  expect(result.byDay['2026-10-04']).toBeUndefined();
  expect(result.byDay['2026-02-30']).toBeUndefined();
  expect(result.byDay['2025-12-31']).toBeUndefined();
});
it('recalculates for each filter regardless of current card status', () => {
  expect(getLogActivity([book, game], 2026, today, 'book').bestStreak).toBe(1);
  const result = getLogActivity([book, game], 2026, today, 'game');
  expect(result.bestStreak).toBe(2);
  expect(result.activeDays).toBe(2);
  expect(result.byDay['2026-09-30']).toBeUndefined();
});
it('handles leap days and year boundaries', () => {
  const dates = ['2024-02-28', '2024-02-29', '2024-03-01', '2023-12-31'];
  const item = { ...game, playLogs: dates.map((date) => ({ id: date, date, createdAt: '' })) };
  expect(getLogActivity([item], 2024, new Date(2024, 11, 31)).bestStreak).toBe(3);
  expect(getLogActivity([item], 2023, today).activeDays).toBe(1);
  expect(getLogActivity([], 2026, today).bestStreak).toBe(0);
});
