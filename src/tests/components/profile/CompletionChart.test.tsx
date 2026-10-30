import { fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';
import { CompletionChart } from '@/components/profile/CompletionChart';
import type { BookItem, LibraryItem } from '@/lib/library/types';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
const book: BookItem = {
  id: 'book',
  type: 'book',
  version: 1,
  title: 'Finished book',
  isbn: '123',
  authors: [],
  createdAt: '',
  updatedAt: '',
  progressStatus: 'completed',
  cover: 'file:///library/cover.jpg',
};
const emptyMonths = () => Array.from({ length: 12 }, () => [] as LibraryItem[]);
beforeEach(() => jest.clearAllMocks());
it('renders covers and thumbnails in each month and opens the selected card', async () => {
  const months = emptyMonths();
  months[0] = [
    book,
    {
      ...book,
      id: 'movie',
      type: 'movie',
      title: 'Finished movie',
      tmdbId: 1,
      poster: 'https://example.com/poster.jpg',
    },
  ];
  months[1] = [
    {
      ...book,
      id: 'game',
      type: 'game',
      title: 'Finished game',
      cover: 'https://example.com/game.jpg',
    },
    {
      ...book,
      id: 'article',
      type: 'article',
      progressStatus: 'completed',
      title: 'Finished article',
      url: 'https://example.com',
      origin: 'Example',
      thumbnail: 'https://example.com/article.jpg',
    },
    {
      ...book,
      id: 'youtube',
      type: 'youtube',
      progressStatus: 'completed',
      title: 'Finished video',
      url: 'https://example.com/video',
      thumbnail: 'https://example.com/video.jpg',
    },
  ];
  await render(<CompletionChart months={months} year={2026} />);
  expect(screen.getByLabelText('January 2026: 2 cards completed')).toBeTruthy();
  expect(screen.getByLabelText('February 2026: 3 cards completed')).toBeTruthy();
  expect(screen.getByText('5 cards completed in 2026')).toBeTruthy();
  expect(
    ['book', 'movie', 'game', 'article', 'youtube'].map(
      (id) => screen.getByTestId(`completion-cover-image-${id}`).props.source.uri
    )
  ).toEqual([
    book.cover,
    'https://example.com/poster.jpg',
    'https://example.com/game.jpg',
    'https://example.com/article.jpg',
    'https://example.com/video.jpg',
  ]);
  await fireEvent.press(screen.getByLabelText('Open Finished movie'));
  expect(router.push).toHaveBeenCalledWith({ pathname: '/card/[id]', params: { id: 'movie' } });
});
it('keeps cards without covers or with unavailable images visible and tappable', async () => {
  const months = emptyMonths();
  months[2] = [book, { ...book, id: 'no-cover', cover: undefined }];
  await render(<CompletionChart months={months} year={2026} />);
  expect(screen.getByTestId('completion-cover-fallback-no-cover')).toBeTruthy();
  await fireEvent(screen.getByTestId('completion-cover-image-book'), 'error', {
    nativeEvent: { error: 'offline' },
  });
  expect(screen.getByTestId('completion-cover-fallback-book')).toBeTruthy();
  expect(screen.getByLabelText('March 2026: 2 cards completed')).toBeTruthy();
});
it('keeps every cover in a busy month and retains empty month rows', async () => {
  const months = emptyMonths();
  months[11] = Array.from({ length: 30 }, (_, i) => ({
    ...book,
    id: String(i),
    title: `Book ${i}`,
  }));
  await render(<CompletionChart months={months} year={2026} />);
  expect(screen.getByLabelText('Open Book 29')).toBeTruthy();
  expect(screen.getByLabelText('December 2026: 30 cards completed')).toBeTruthy();
  expect(screen.getByLabelText('January 2026: 0 cards completed')).toBeTruthy();
});

it('compacts empty months while keeping completed covers full size', async () => {
  const months = emptyMonths();
  months[0] = [book];
  await render(<CompletionChart months={months} year={2026} />);
  expect(screen.getByTestId('completion-month-1')).toHaveStyle({ height: 80 });
  expect(screen.getByTestId('completion-month-2')).toHaveStyle({ height: 24 });
  expect(screen.getByTestId('completion-month-12')).toHaveStyle({ height: 24 });
});
