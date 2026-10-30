import {
  additionLevel,
  getAdditionYears,
  getCompletionTimeline,
  getYearWeeks,
} from '@/lib/library/activity';
import type { BookItem, TvShowItem } from '@/lib/library/types';

const book: BookItem = {
  id: 'book',
  type: 'book',
  version: 1,
  title: 'Book',
  isbn: '',
  authors: [],
  createdAt: '',
  updatedAt: '',
  progressStatus: 'completed',
  completedAt: '2024-03-02T12:00:00',
  review: { rating: 4.5, comments: 'Loved it' },
};
it('builds complete calendar years with locale week alignment', () => {
  const leap = getYearWeeks(2024, true).flat().filter(Boolean);
  expect(leap).toHaveLength(366);
  expect(new Set(leap).size).toBe(366);
  expect(leap).toContain('2024-02-29');
  expect(getYearWeeks(2023, false)[0][0]).toBe('2023-01-01');
  expect(getYearWeeks(2023, true)[0][6]).toBe('2023-01-01');
  expect(getYearWeeks(2023, true).flat().filter(Boolean)).toHaveLength(365);
});
it('uses fixed intensity levels and ignores invalid addition dates', () => {
  expect([0, 1, 2, 3, 4, 6, 7, 100].map(additionLevel)).toEqual([0, 1, 2, 2, 3, 3, 4, 4]);
  expect(getAdditionYears({ '2020-02-29': 1, '2023-02-29': 2, invalid: 1 }, 2026)).toEqual([
    2026, 2020,
  ]);
});
it('sorts by local completion date with stable ties and undated entries last', () => {
  const entries = getCompletionTimeline(
    [
      book,
      { ...book, id: 'a' },
      { ...book, id: 'old', completedAt: '2024-03-01T12:00:00' },
      { ...book, id: 'invalid', completedAt: '2024-02-30' },
      { ...book, id: 'missing', completedAt: undefined },
      { ...book, id: 'not-done', progressStatus: 'in-progress' },
    ],
    null
  );
  expect(entries.map((entry) => entry.id)).toEqual(['a', 'book', 'old', 'invalid', 'missing']);
  expect(entries[0]).toMatchObject({ day: '2024-03-02', rating: 4.5, comments: 'Loved it' });
  expect(entries[3].day).toBeNull();
  expect(getCompletionTimeline([book], 'movie')).toEqual([]);
});
it('uses completed seasons regardless of series status and never duplicates the series', () => {
  const show: TvShowItem = {
    id: 'tv',
    type: 'tvshow',
    version: 1,
    createdAt: '',
    updatedAt: '',
    title: 'Series',
    tmdbId: 1,
    poster: '',
    progressStatus: 'in-progress',
    seasons: [
      {
        seasonNumber: 1,
        name: 'First',
        progressStatus: 'completed',
        completedAt: '2024-03-03T12:00:00',
        review: { comments: 'Great season' },
      },
      { seasonNumber: 2, name: 'Second', progressStatus: 'completed' },
      { seasonNumber: 3, name: 'Third', progressStatus: 'want' },
    ],
  };
  const entries = getCompletionTimeline([book, show], 'tvshow');
  expect(entries.map((entry) => entry.id)).toEqual(['tv:season:1', 'tv:season:2']);
  expect(entries[0]).toMatchObject({
    seasonNumber: 1,
    comments: 'Great season',
    rating: undefined,
  });
  expect(entries[1].day).toBeNull();
});
