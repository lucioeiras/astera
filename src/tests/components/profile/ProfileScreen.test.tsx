import { fireEvent, render, screen } from '@testing-library/react-native';
import ProfileScreen from '@/app/(tabs)/profile';
import { localDayKey } from '@/lib/library/activity';
import type { LibraryItem } from '@/lib/library/types';
import type { LibraryState } from '@/hooks/useLibrary';

const mockNavigate = jest.fn(),
  mockPush = jest.fn(),
  mockSearch = jest.fn(),
  mockClearTag = jest.fn(),
  mockRefresh = jest.fn();
let mockState: LibraryState;
let mockSource = { kind: 'local', name: 'First library' };
jest.mock('expo-router', () => ({
  router: {
    navigate: (...args: unknown[]) => mockNavigate(...args),
    push: (...args: unknown[]) => mockPush(...args),
  },
}));
jest.mock('@/hooks/useLibrary', () => ({
  useLibrary: () => ({
    state: mockState,
    source: mockSource,
    currentFolderName: 'Test library',
    setSearchQuery: mockSearch,
    clearSearchTag: mockClearTag,
    refresh: mockRefresh,
  }),
}));
jest.mock('@/components/Button', () => ({
  Button: ({
    accessibilityLabel,
    onPress,
  }: {
    accessibilityLabel: string;
    onPress: () => void;
  }) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Pressable, Text } = require('react-native');
    return (
      <Pressable accessibilityLabel={accessibilityLabel} onPress={onPress}>
        <Text>{accessibilityLabel}</Text>
      </Pressable>
    );
  },
}));
const createdAt = new Date().toISOString();
const note: LibraryItem = {
  id: 'note',
  type: 'note',
  version: 1,
  text: 'test',
  createdAt,
  updatedAt: createdAt,
};
const ready = (items: LibraryItem[]) => {
  mockState = { status: 'ready', result: { items, issues: [], pendingDownloads: 0 } };
};
beforeEach(() => {
  jest.clearAllMocks();
  mockSource = { kind: 'local', name: 'First library' };
  ready([note]);
});
it('shows current-library stats and opens settings', async () => {
  await render(<ProfileScreen />);
  expect(screen.getByText('Test library')).toBeTruthy();
  expect(screen.queryByText('Saved cards')).toBeNull();
  expect(screen.getAllByText('Annual additions').length).toBeGreaterThan(0);
  expect(screen.getByText('Completion history')).toBeTruthy();
  await fireEvent.press(screen.getByLabelText('Settings'));
  expect(mockPush).toHaveBeenCalledWith('/settings');
});
it('opens a calendar day on the board and resets previous filters', async () => {
  await render(<ProfileScreen />);
  await fireEvent.press(screen.getAllByLabelText(/, 1 cards added$/)[0]);
  expect(mockSearch).toHaveBeenCalledWith('');
  expect(mockClearTag).toHaveBeenCalled();
  expect(mockNavigate).toHaveBeenCalledWith({
    pathname: '/board',
    params: {
      addedOn: localDayKey(new Date(createdAt)),
      activityToken: expect.any(String),
      folderKind: '',
      folderKey: '',
    },
  });
});
it('updates chart counts by year and type, with a notice for undated cards', async () => {
  const year = new Date().getFullYear();
  const book: LibraryItem = {
    ...note,
    id: 'book',
    type: 'book',
    title: 'Book',
    isbn: '123',
    authors: [],
    progressStatus: 'completed',
    completedAt: new Date(year - 1, 0, 15, 12).toISOString(),
  };
  ready([book, { ...book, id: 'legacy', completedAt: undefined }]);
  await render(<ProfileScreen />);
  expect(screen.getByText(/1 completed card\(s\) have no completion date/)).toBeTruthy();
  await fireEvent.press(screen.getByLabelText(`Year: ${year}`));
  await fireEvent.press(screen.getByLabelText(String(year - 1)));
  expect(screen.getByLabelText(`January ${year - 1}: 1 cards completed`)).toBeTruthy();
  await fireEvent.press(screen.getAllByLabelText('Movies')[0]);
  expect(screen.getByLabelText(`January ${year - 1}: 0 cards completed`)).toBeTruthy();
  expect(screen.queryByText(/have no completion date/)).toBeNull();
  await fireEvent.press(screen.getAllByLabelText('Movies')[0]);
  expect(screen.queryByLabelText('All types')).toBeNull();
  expect(screen.getByLabelText(`January ${year - 1}: 1 cards completed`)).toBeTruthy();
});
it('handles loading, errors, retry, and an empty library', async () => {
  mockState = { status: 'loading' };
  const view = await render(<ProfileScreen />);
  expect(screen.getByLabelText('Loading profile')).toBeTruthy();
  mockState = { status: 'error', error: 'test' };
  await view.rerender(<ProfileScreen />);
  await fireEvent.press(screen.getByLabelText('Retry loading library'));
  expect(mockRefresh).toHaveBeenCalled();
  ready([]);
  await view.rerender(<ProfileScreen />);
  expect(screen.getByText('Save your first card to start your library activity.')).toBeTruthy();
});
it('refreshes stats when the loaded library changes', async () => {
  const view = await render(<ProfileScreen />);
  ready([]);
  await view.rerender(<ProfileScreen />);
  expect(screen.queryByText('First card saved')).toBeNull();
  expect(screen.getByText('Save your first card to start your library activity.')).toBeTruthy();
});

it('keeps timeline filters independent and resets pagination on library change', async () => {
  const year = new Date().getFullYear();
  const book: LibraryItem = {
    ...note,
    type: 'book',
    title: 'Book',
    isbn: '',
    authors: [],
    progressStatus: 'completed',
    completedAt: new Date(year, 0, 1, 12).toISOString(),
  };
  ready(
    Array.from({ length: 32 }, (_, index) => ({
      ...book,
      id: `book-${String(index).padStart(2, '0')}`,
    }))
  );
  const view = await render(<ProfileScreen />);
  await fireEvent.press(screen.getAllByLabelText('Movies')[1]);
  expect(screen.queryByTestId('timeline-entry-book-00')).toBeNull();
  expect(screen.getByLabelText(`January ${year}: 32 cards completed`)).toBeTruthy();
  await fireEvent.press(screen.getAllByLabelText('Movies')[1]);
  await fireEvent.press(screen.getByLabelText('Show more'));
  expect(screen.getByTestId('timeline-entry-book-30')).toBeTruthy();
  mockSource = { kind: 'local', name: 'Second library' };
  await view.rerender(<ProfileScreen />);
  expect(screen.queryByTestId('timeline-entry-book-30')).toBeNull();
  expect(screen.getByTestId('timeline-entry-book-00')).toBeTruthy();
});
