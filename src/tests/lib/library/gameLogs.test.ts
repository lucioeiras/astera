import { saveGameLog } from '@/lib/library/gameLogs';
import type { GameItem, GamePlayLog, NoteItem } from '@/lib/library/types';

const log: GamePlayLog = {
  id: 'entry',
  date: '2026-10-01',
  createdAt: '2026-10-01T12:00:00Z',
  noteId: 'note',
};
const game: GameItem = {
  id: 'game',
  type: 'game',
  title: 'Game',
  cover: '',
  version: 1,
  createdAt: '',
  updatedAt: '',
  progressStatus: 'in-progress',
  playLogs: [log],
};
const note: NoteItem = {
  id: 'note',
  type: 'note',
  text: 'Old note',
  version: 1,
  createdAt: '',
  updatedAt: '',
  linkedItemId: game.id,
};
const operations = () => ({
  items: [note],
  addNote: jest.fn().mockResolvedValue({ id: 'new-note' }),
  updateItem: jest.fn().mockResolvedValue(undefined),
  deleteItem: jest.fn().mockResolvedValue(undefined),
});

it('adds another entry on the same day without a note or changing status', async () => {
  const ops = operations();
  await saveGameLog(game, log.date, '', undefined, ops);
  expect(ops.addNote).not.toHaveBeenCalled();
  const update = ops.updateItem.mock.calls[0][1];
  expect(update.playLogs).toHaveLength(2);
  expect(update.playLogs[1]).toMatchObject({ date: log.date });
  expect(update.progressStatus).toBeUndefined();
});
it('creates a note linked to the game and cleans it up if saving fails', async () => {
  const ops = operations();
  ops.updateItem.mockRejectedValueOnce(new Error('write failed'));
  await expect(saveGameLog(game, log.date, ' New note ', undefined, ops)).rejects.toThrow(
    'write failed'
  );
  expect(ops.addNote).toHaveBeenCalledWith('New note', game.id);
  expect(ops.deleteItem).toHaveBeenCalledWith('new-note');
});
it('restores an edited note if saving the game fails', async () => {
  const ops = operations();
  ops.updateItem.mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error('write failed'));
  await expect(saveGameLog(game, '2026-10-02', 'Updated', log, ops)).rejects.toThrow(
    'write failed'
  );
  expect(ops.updateItem).toHaveBeenLastCalledWith(note.id, { text: 'Old note' });
});
it('edits a completed game entry and preserves its identity', async () => {
  const ops = operations();
  await saveGameLog({ ...game, progressStatus: 'completed' }, '2026-10-02', 'Updated', log, ops);
  expect(ops.updateItem).toHaveBeenLastCalledWith(game.id, {
    playLogs: [{ ...log, date: '2026-10-02' }],
  });
});
it('removes a cleared note only after the log is saved', async () => {
  const ops = operations();
  await saveGameLog(game, log.date, '', log, ops);
  expect(ops.updateItem).toHaveBeenCalledWith(game.id, {
    playLogs: [{ ...log, noteId: undefined }],
  });
  expect(ops.deleteItem).toHaveBeenCalledWith(note.id);
  expect(ops.updateItem.mock.invocationCallOrder[0]).toBeLessThan(
    ops.deleteItem.mock.invocationCallOrder[0]
  );
});
it('recreates missing linked notes', async () => {
  const ops = { ...operations(), items: [] };
  await saveGameLog(game, log.date, 'Restored', log, ops);
  expect(ops.updateItem).toHaveBeenLastCalledWith(game.id, {
    playLogs: [{ ...log, noteId: 'new-note' }],
  });
});
it('preserves notes if saving a cleared entry fails', async () => {
  const ops = operations();
  ops.updateItem.mockRejectedValueOnce(new Error('write failed'));
  await expect(saveGameLog(game, log.date, '', log, ops)).rejects.toThrow('write failed');
  expect(ops.deleteItem).not.toHaveBeenCalled();
});
it('rejects impossible dates and new entries outside Playing', async () => {
  const ops = operations();
  await expect(saveGameLog(game, '2026-02-30', '', undefined, ops)).rejects.toThrow('valid date');
  await expect(
    saveGameLog({ ...game, progressStatus: 'completed' }, log.date, '', undefined, ops)
  ).rejects.toThrow('Playing');
  expect(ops.updateItem).not.toHaveBeenCalled();
});
