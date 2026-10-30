import { ScrollView } from 'react-native';
import { getYearWeeks, localDayKey } from '@/lib/library/activity';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { AdditionHeatmap } from '@/components/profile/AdditionHeatmap';
import { CompletionTimeline } from '@/components/profile/CompletionTimeline';
import type { BookItem } from '@/lib/library/types';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({ router: { push: (...args: unknown[]) => mockPush(...args) } }));
const book: BookItem = {
  id: 'book',
  type: 'book',
  version: 1,
  title: 'A book',
  authors: [],
  isbn: '',
  createdAt: '',
  updatedAt: '',
  progressStatus: 'completed',
  completedAt: '2024-01-02T12:00:00',
  review: { rating: 4.5, comments: 'Complete review text' },
};
beforeEach(() => jest.clearAllMocks());
it('opens a heatmap day and allows selecting a past addition year', async () => {
  const onPressDate = jest.fn();
  await render(<AdditionHeatmap byDay={{ '2024-01-02': 4 }} onPressDate={onPressDate} />);
  await fireEvent.press(screen.getByLabelText(`Activity year: ${new Date().getFullYear()}`));
  await fireEvent.press(screen.getByLabelText('2024'));
  await fireEvent.press(screen.getByTestId('heatmap-day-2024-01-02'));
  expect(onPressDate).toHaveBeenCalledWith('2024-01-02');
  expect(screen.queryByTestId('heatmap-day-2024-02-29')).toBeTruthy();
});
it('shows reviews, undated cards, image fallback, and opens the card', async () => {
  await render(
    <CompletionTimeline
      items={[book, { ...book, id: 'undated', completedAt: undefined, review: undefined }]}
    />
  );
  expect(screen.getByLabelText('4.5 out of 5 stars')).toBeTruthy();
  expect(screen.getByText('Complete review text')).toBeTruthy();
  expect(screen.getByText('Undated')).toBeTruthy();
  expect(screen.getByTestId('completion-cover-fallback-book')).toBeTruthy();
  await fireEvent.press(screen.getAllByLabelText('Open A book')[0]);
  expect(mockPush).toHaveBeenCalledWith({ pathname: '/card/[id]', params: { id: 'book' } });
});
it('loads more entries and resets the limit when the filter changes', async () => {
  const items = Array.from({ length: 32 }, (_, i) => ({
    ...book,
    id: `book-${String(i).padStart(2, '0')}`,
  }));
  await render(<CompletionTimeline items={items} />);
  expect(screen.queryByTestId('timeline-entry-book-30')).toBeNull();
  await fireEvent.press(screen.getByLabelText('Show more'));
  expect(screen.getByTestId('timeline-entry-book-30')).toBeTruthy();
  await fireEvent.press(screen.getByLabelText('Movies'));
  expect(screen.getByText('No completions recorded for this selection.')).toBeTruthy();
  await fireEvent.press(screen.getByLabelText('Movies'));
  expect(screen.queryByTestId('timeline-entry-book-30')).toBeNull();
});
it('disables future days', async () => {
  const nextYear = new Date().getFullYear() + 1;
  const onPressDate = jest.fn();
  await render(<AdditionHeatmap byDay={{ [`${nextYear}-01-01`]: 1 }} onPressDate={onPressDate} />);
  await fireEvent.press(screen.getByLabelText(`Activity year: ${nextYear - 1}`));
  await fireEvent.press(screen.getByLabelText(String(nextYear)));
  await fireEvent.press(screen.getByTestId(`heatmap-day-${nextYear}-01-01`));
  expect(onPressDate).not.toHaveBeenCalled();
});

it('centers the current week after measuring the chart', async () => {
  const scrollTo = jest.spyOn(ScrollView.prototype, 'scrollTo').mockImplementation(() => {});
  try {
    await render(<AdditionHeatmap byDay={{}} onPressDate={jest.fn()} />);
    const chart = screen.getByLabelText('Annual additions');
    const weeks = getYearWeeks(new Date().getFullYear(), false);
    const width = weeks.length * 16;
    const index = weeks.findIndex((week) => week.includes(localDayKey(new Date())));
    await fireEvent(chart, 'layout', { nativeEvent: { layout: { width: 280 } } });
    await fireEvent(chart, 'contentSizeChange', width, 136);
    expect(scrollTo).toHaveBeenLastCalledWith({
      x: Math.max(0, Math.min(index * 16 + 8 - 140, width - 280)),
      animated: false,
    });
  } finally {
    scrollTo.mockRestore();
  }
});

it('groups completions by month and shows individual days beside covers', async () => {
  await render(
    <CompletionTimeline
      items={[
        book,
        { ...book, id: 'same-month', completedAt: '2024-01-15T12:00:00' },
        { ...book, id: 'next-month', completedAt: '2024-02-03T12:00:00' },
      ]}
    />
  );
  expect(screen.getAllByText('January 2024')).toHaveLength(1);
  expect(screen.getAllByText('February 2024')).toHaveLength(1);
  expect(screen.getByText('2')).toBeTruthy();
  expect(screen.getByText('15')).toBeTruthy();
  expect(screen.getByText('3')).toBeTruthy();
  expect(screen.queryByText(/Rating:/)).toBeNull();
});
