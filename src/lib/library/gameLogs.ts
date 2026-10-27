import { parseDayKey } from './activity';
import type { GameItem, GamePlayLog, LibraryItem } from './types';

type NoteItem = Extract<LibraryItem, { type: 'note' }>;
type LogOperations = {
  items: LibraryItem[];
  addNote: (text: string, gameId: string) => Promise<{ id: string }>;
  updateItem: (id: string, updates: Partial<LibraryItem>) => Promise<unknown>;
  deleteItem: (id: string) => Promise<unknown>;
};

/** Save the linked note first and restore it if the game cannot be written. */
export async function saveGameLog(
  game: GameItem,
  date: string,
  text: string,
  existingLog: GamePlayLog | undefined,
  operations: LogOperations
) {
  if (!parseDayKey(date)) throw new Error('Choose a valid date.');
  if (!existingLog && game.progressStatus !== 'in-progress') {
    throw new Error('Set this game to Playing to add a log.');
  }
  const noteText = text.trim();
  const previousNote = operations.items.find(
    (item): item is NoteItem => item.type === 'note' && item.id === existingLog?.noteId
  );
  let noteId: string | undefined;
  let createdNoteId: string | undefined;
  let noteUpdated = false;
  try {
    if (noteText && previousNote) {
      noteId = previousNote.id;
      await operations.updateItem(noteId, { text: noteText });
      noteUpdated = true;
    } else if (noteText) {
      const note = await operations.addNote(noteText, game.id);
      noteId = createdNoteId = note.id;
    }
    const log: GamePlayLog = existingLog
      ? { ...existingLog, date, noteId }
      : {
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          date,
          createdAt: new Date().toISOString(),
          ...(noteId ? { noteId } : {}),
        };
    const logs = game.playLogs ?? [];
    await operations.updateItem(game.id, {
      playLogs: existingLog
        ? logs.map((entry) => (entry.id === existingLog.id ? log : entry))
        : [...logs, log],
    });
  } catch (error) {
    // Never log note contents or card data when recovery also fails.
    if (createdNoteId) await operations.deleteItem(createdNoteId).catch(() => undefined);
    if (noteUpdated && previousNote) {
      await operations
        .updateItem(previousNote.id, { text: previousNote.text })
        .catch(() => undefined);
    }
    throw error;
  }
  if (previousNote && !noteText) {
    await operations.deleteItem(previousNote.id).catch(() => undefined);
  }
}
