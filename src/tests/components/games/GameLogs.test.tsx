import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { GameLogs } from '@/components/games/GameLogs';
import type { GameItem } from '@/lib/library/types';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  SafeAreaView: require('react-native').View,
}));
const game: GameItem = {
  id: 'g',
  type: 'game',
  title: 'Game',
  cover: '',
  version: 1,
  createdAt: '',
  updatedAt: '',
  progressStatus: 'in-progress',
};
const callbacks = () => ({
  onSave: jest.fn().mockResolvedValue(undefined),
  onDelete: jest.fn().mockResolvedValue(undefined),
  getNoteText: (id: string) => (id === 'note' ? 'A remembered moment' : undefined),
});
const logs = [
  { id: 'old', date: '2026-10-01', createdAt: '2026-10-01T12:00:00Z' },
  { id: 'new', date: '2026-10-01', createdAt: '2026-10-01T18:00:00Z', noteId: 'note' },
];
beforeEach(() => {
  jest.useFakeTimers().setSystemTime(new Date(2026, 9, 3, 12));
});
afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

it('opens on today and saves a date without a note', async () => {
  const props = callbacks();
  await render(<GameLogs game={game} {...props} openOnMount />);
  expect(screen.queryByLabelText('Current page')).toBeNull();
  await fireEvent.press(screen.getByLabelText('Save play log'));
  expect(props.onSave).toHaveBeenCalledWith('2026-10-03', '', undefined);
  await waitFor(() => expect(screen.queryByLabelText('Save play log')).toBeNull());
});
it('opens empty days and supports changing the date and note', async () => {
  const props = callbacks();
  await render(<GameLogs game={game} {...props} />);
  expect(screen.getByText('No play logs yet.')).toBeTruthy();
  await fireEvent.press(screen.getByLabelText('October 1'));
  await fireEvent.press(within(screen.getByTestId('game-log-modal')).getByLabelText('October 2'));
  await fireEvent.changeText(screen.getByLabelText('Play note'), '  A new moment  ');
  await fireEvent.press(screen.getByLabelText('Save play log'));
  expect(props.onSave).toHaveBeenCalledWith('2026-10-02', 'A new moment', undefined);
});
it('lists every entry newest first and edits a selected entry', async () => {
  const props = callbacks();
  await render(<GameLogs game={{ ...game, playLogs: logs }} {...props} />);
  await fireEvent.press(screen.getByLabelText('October 1, play logged, note available'));
  expect(screen.getByText('A remembered moment')).toBeTruthy();
  expect(screen.getByText('No note')).toBeTruthy();
  await fireEvent.press(screen.getByLabelText('Edit play log 1'));
  expect(screen.getByLabelText('Play note').props.value).toBe('A remembered moment');
  await fireEvent.changeText(screen.getByLabelText('Play note'), 'Changed');
  await fireEvent.press(screen.getByLabelText('Save play log'));
  expect(props.onSave).toHaveBeenCalledWith(logs[1].date, 'Changed', logs[1]);
});
it('adds another entry on the selected day', async () => {
  const props = callbacks();
  await render(<GameLogs game={{ ...game, playLogs: logs }} {...props} />);
  await fireEvent.press(screen.getByLabelText('October 1, play logged, note available'));
  await fireEvent.press(screen.getByLabelText('Add play log'));
  await fireEvent.press(screen.getByLabelText('Save play log'));
  expect(props.onSave).toHaveBeenCalledWith('2026-10-01', '', undefined);
});
it('allows editing and confirmed deletion after completion, but no new entries', async () => {
  const props = callbacks();
  const alert = jest.spyOn(Alert, 'alert');
  await render(
    <GameLogs
      game={{ ...game, progressStatus: 'completed', playLogs: logs }}
      {...props}
      openOnMount
    />
  );
  expect(screen.queryByLabelText('Save play log')).toBeNull();
  await fireEvent.press(screen.getByLabelText('October 2'));
  expect(screen.queryByLabelText('Save play log')).toBeNull();
  await fireEvent.press(screen.getByLabelText('October 1, play logged, note available'));
  expect(screen.queryByLabelText('Add play log')).toBeNull();
  await fireEvent.press(screen.getByLabelText('Edit play log 2'));
  await fireEvent.press(screen.getByLabelText('Remove play log'));
  expect(props.onDelete).not.toHaveBeenCalled();
  await act(async () => {
    await alert.mock.calls[0][2]?.find((button) => button.style === 'destructive')?.onPress?.();
  });
  expect(props.onDelete).toHaveBeenCalledWith(logs[0]);
});
it('keeps the form open on save failure and lets the user retry', async () => {
  const props = callbacks();
  props.onSave.mockRejectedValueOnce(new Error('Could not save play log.'));
  await render(<GameLogs game={game} {...props} openOnMount />);
  await fireEvent.changeText(screen.getByLabelText('Play note'), 'Keep this');
  await fireEvent.press(screen.getByLabelText('Save play log'));
  expect(screen.getByText('Could not save play log.')).toBeTruthy();
  expect(screen.getByLabelText('Play note').props.value).toBe('Keep this');
  await fireEvent.press(screen.getByLabelText('Save play log'));
  expect(props.onSave).toHaveBeenCalledTimes(2);
});
it('shows deletion errors and preserves the form', async () => {
  const props = callbacks();
  props.onDelete.mockRejectedValueOnce(new Error('Could not remove play log.'));
  const alert = jest.spyOn(Alert, 'alert');
  await render(<GameLogs game={{ ...game, playLogs: logs }} {...props} />);
  await fireEvent.press(screen.getByLabelText('October 1, play logged, note available'));
  await fireEvent.press(screen.getByLabelText('Edit play log 1'));
  await fireEvent.press(screen.getByLabelText('Remove play log'));
  await act(async () => {
    await alert.mock.calls[0][2]?.find((button) => button.style === 'destructive')?.onPress?.();
  });
  expect(screen.getByText('Could not remove play log.')).toBeTruthy();
  expect(screen.getByLabelText('Play note').props.value).toBe('A remembered moment');
});
