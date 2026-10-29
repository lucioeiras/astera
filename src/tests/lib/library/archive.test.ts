import {
  archiveUpdates,
  filterArchivedItems,
  getArchiveDaysRemaining,
  getExpiredArchivedIds,
  isArchived,
  shouldAskToArchiveAfterCompletion,
} from '@/lib/library/archive';
import type { LibraryItem } from '@/lib/library/types';

const card = (id: string, archivedAt?: string): LibraryItem => ({
  id,
  version: 1,
  type: 'note',
  text: id,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  ...(archivedAt ? { archivedAt } : {}),
  tags: ['reading'],
});

it('adds and removes the reserved archive tag alongside the timestamp', () => {
  const archived = archiveUpdates(card('a'), '2026-01-02T00:00:00.000Z');
  expect(archived).toEqual({
    archivedAt: '2026-01-02T00:00:00.000Z',
    tags: ['reading', 'Archived'],
  });
  expect(archiveUpdates({ tags: archived.tags }, null)).toEqual({
    archivedAt: undefined,
    tags: ['reading'],
  });
  expect(isArchived(card('a', '2026-01-02T00:00:00.000Z'))).toBe(true);
});

it('keeps archived cards out of the normal board and includes them in the archive filter', () => {
  const items = [card('active'), card('archived', '2026-01-02T00:00:00.000Z')];
  expect(filterArchivedItems(items, false).map((item) => item.id)).toEqual(['active']);
  expect(filterArchivedItems(items, true).map((item) => item.id)).toEqual(['archived']);
});

it('asks about archiving only when a card is newly marked completed', () => {
  expect(shouldAskToArchiveAfterCompletion('completed', false)).toBe(true);
  expect(shouldAskToArchiveAfterCompletion('completed', true)).toBe(false);
  expect(shouldAskToArchiveAfterCompletion('in-progress', false)).toBe(false);
});

it('expires only archived cards at the configured retention and never expires by default', () => {
  const now = Date.parse('2026-01-10T00:00:00.000Z');
  const cards = [
    card('fresh', '2026-01-05T00:00:00.000Z'),
    card('expired', '2026-01-02T00:00:00.000Z'),
    card('active'),
  ];
  expect(getExpiredArchivedIds(cards, 7, now)).toEqual(['expired']);
  expect(getExpiredArchivedIds(cards, 0, now)).toEqual([]);
  expect(getExpiredArchivedIds([card('bad', 'invalid')], 7, now)).toEqual([]);
});

it('calculates remaining days and uses null for never', () => {
  expect(
    getArchiveDaysRemaining('2026-01-08T00:00:00.000Z', 7, Date.parse('2026-01-10T00:00:00.000Z'))
  ).toBe(5);
  expect(getArchiveDaysRemaining('2026-01-08T00:00:00.000Z', 0)).toBeNull();
});
