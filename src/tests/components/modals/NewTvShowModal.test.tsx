import { act, fireEvent, render, waitFor } from '@testing-library/react-native';

import { NewTvShowModal } from '@/components/modals/NewTvShowModal';

const mockAddTvShowItem = jest.fn();
const mockSearch = jest.fn();
const mockDetails = jest.fn();

jest.mock('@/hooks/useLibrary', () => ({
  useLibrary: () => ({ addTvShowItem: mockAddTvShowItem, getTags: () => [] }),
}));
jest.mock('@/lib/movies/tmdb', () => ({
  getBackdropUrl: (path: string) => `backdrop:${path}`,
  getPosterUrl: (path: string) => (path ? `poster:${path}` : ''),
  getReleaseYear: (date: string) => date?.slice(0, 4) ?? '',
  getTmdbKeyInfo: jest.fn().mockResolvedValue({ key: 'key', source: 'custom' }),
  getTmdbTvShowDetails: (...args: unknown[]) => mockDetails(...args),
  searchTmdbTvShows: (...args: unknown[]) => mockSearch(...args),
}));
jest.mock('@/lib/tags/autoTags', () => ({ generateAutoTags: () => ['tvshow'] }));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

describe('NewTvShowModal', () => {
  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('searches TMDB and saves every season with independent initial statuses', async () => {
    jest.useFakeTimers();
    mockSearch.mockResolvedValue([
      { id: 42, name: 'Example show', first_air_date: '2020-01-01', poster_path: '/poster' },
    ]);
    const details = {
      id: 42,
      name: 'Example show',
      original_name: 'Original show',
      first_air_date: '2020-01-01',
      poster_path: '/poster',
      backdrop_path: '/backdrop',
      overview: 'Overview',
      vote_average: 8.5,
      genres: [{ id: 1, name: 'Drama' }],
      seasons: [
        {
          id: 8,
          season_number: 0,
          name: 'Specials',
          poster_path: null,
          air_date: null,
          episode_count: 1,
        },
        {
          id: 9,
          season_number: 1,
          name: 'Season 1',
          poster_path: '/season',
          air_date: '2020-01-01',
          episode_count: 8,
        },
      ],
    };
    mockDetails.mockResolvedValue(details);
    mockAddTvShowItem.mockResolvedValue({ id: 'saved', type: 'tvshow' });

    const { getByLabelText, getByText } = await render(
      <NewTvShowModal visible onClose={jest.fn()} />
    );
    await fireEvent.changeText(getByLabelText('Search TV shows'), 'Example');
    await act(async () => {
      jest.advanceTimersByTime(350);
      await Promise.resolve();
    });
    await fireEvent.press(getByText('Example show'));
    await waitFor(() => expect(getByLabelText('Save TV show')).toBeTruthy());
    await fireEvent.press(getByLabelText('Save TV show'));
    await waitFor(() => expect(mockAddTvShowItem).toHaveBeenCalled());

    const payload = mockAddTvShowItem.mock.calls[0][0];
    expect(payload).toMatchObject({
      tmdbId: 42,
      title: 'Example show',
      releaseYear: '2020',
      seasons: [
        { seasonNumber: 0, progressStatus: 'want' },
        { seasonNumber: 1, progressStatus: 'want' },
      ],
    });
    expect(payload.seasons).toHaveLength(2);
    expect(payload.seasons[1].poster).toBe('poster:/season');
  });
});
