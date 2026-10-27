import { fireEvent, render } from '@testing-library/react-native';
import { ScrollView } from 'react-native';

import { NewNoteModal } from '@/components/modals/NewNoteModal';

// The package provides this native-component mock for Jest.
// eslint-disable-next-line @typescript-eslint/no-require-imports
jest.mock('react-native-enriched-markdown', () => require('react-native-enriched-markdown/jest'));

const mockAddTextItem = jest.fn();
const mockUpdateItem = jest.fn();

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));
jest.mock('@/hooks/useLibrary', () => ({
  useLibrary: () => ({
    addMusicItem: jest.fn(),
    addTextItem: mockAddTextItem,
    updateItem: mockUpdateItem,
    getTags: () => [],
    state: { status: 'ready', result: { items: [] } },
  }),
}));
jest.mock('@/lib/tags/autoTags', () => ({
  generateAutoTags: () => [],
  generateAutoTagsAsync: () => Promise.resolve([]),
}));

describe('NewNoteModal', () => {
  it('scrolls the active insertion line above the footer while typing', async () => {
    const scrollTo = jest.spyOn(ScrollView.prototype, 'scrollTo').mockImplementation(() => {});
    const animationFrame = jest
      .spyOn(globalThis, 'requestAnimationFrame')
      .mockImplementation((callback) => {
        callback(0);
        return 0;
      });
    try {
      const view = await render(
        <NewNoteModal visible initialText="A long note" onClose={jest.fn()} />
      );
      const scroll = view.getByTestId('note-editor-scroll');
      await fireEvent(scroll, 'layout', {
        nativeEvent: { layout: { height: 400, width: 390, x: 0, y: 0 } },
      });
      await fireEvent(scroll, 'contentSizeChange', 390, 1200);
      await fireEvent(view.getByTestId('note-rich-text-input'), 'caretRectChange', {
        x: 0,
        y: 700,
        width: 1,
        height: 32,
      });
      expect(scrollTo).toHaveBeenLastCalledWith({ y: 508, animated: false });
    } finally {
      scrollTo.mockRestore();
      animationFrame.mockRestore();
    }
  });

  it('switches the footer to formatting controls and back', async () => {
    const { getByLabelText, queryByLabelText } = await render(
      <NewNoteModal visible initialText="A note" onClose={jest.fn()} />
    );

    await fireEvent.press(getByLabelText('Open text formatting'));
    expect(getByLabelText('Bold')).toBeTruthy();
    expect(getByLabelText('Change line to H1')).toBeTruthy();
    expect(queryByLabelText('Add song lyrics')).toBeNull();

    await fireEvent.press(getByLabelText('Cancel formatting'));
    expect(getByLabelText('Open text formatting')).toBeTruthy();
    expect(getByLabelText('Add song lyrics')).toBeTruthy();
  });

  it('shows a live Markdown preview and returns to editing', async () => {
    const { getByLabelText, getByPlaceholderText, getByText } = await render(
      <NewNoteModal visible onClose={jest.fn()} />
    );

    await fireEvent.changeText(getByPlaceholderText('Type here...'), '# Live preview');
    await fireEvent.press(getByLabelText('Preview markdown'));

    expect(getByText('Live preview')).toBeTruthy();
    expect(getByLabelText('Edit markdown')).toBeTruthy();

    await fireEvent.press(getByLabelText('Edit markdown'));
    expect(getByPlaceholderText('Type here...').props.value).toBe('# Live preview');
  });

  it('updates an existing note through the note editor', async () => {
    const onClose = jest.fn();
    const editingItem = {
      id: 'note-1',
      version: 1 as const,
      type: 'note' as const,
      text: 'Original markdown',
      title: 'Original title',
      tags: ['reading'],
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };
    mockUpdateItem.mockResolvedValue({ ...editingItem, text: 'Updated markdown' });
    const { getByPlaceholderText, getByLabelText } = await render(
      <NewNoteModal visible editingItem={editingItem} onClose={onClose} />
    );

    expect(getByPlaceholderText('Type here...').props.value).toBe('Original markdown');
    await fireEvent.changeText(getByPlaceholderText('Type here...'), 'Updated markdown');
    await fireEvent.press(getByLabelText('Save note'));

    expect(mockUpdateItem).toHaveBeenCalledWith('note-1', {
      text: 'Updated markdown',
      title: 'Original title',
      tags: ['reading'],
      autoTags: undefined,
      linkedItemId: undefined,
    });
    expect(mockAddTextItem).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('preserves task and quote Markdown while editing a note', async () => {
    const editingItem = {
      id: 'note-markdown',
      version: 1 as const,
      type: 'note' as const,
      text: '- [ ] task\n> quote',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };
    mockUpdateItem.mockResolvedValue(editingItem);
    const { getByLabelText } = await render(
      <NewNoteModal visible editingItem={editingItem} onClose={jest.fn()} />
    );

    await fireEvent.press(getByLabelText('Save note'));

    expect(mockUpdateItem).toHaveBeenCalledWith(
      'note-markdown',
      expect.objectContaining({ text: '- [ ] task\n> quote' })
    );
  });
});
