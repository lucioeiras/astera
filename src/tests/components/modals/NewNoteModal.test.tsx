import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { Alert, StyleSheet, View as MockView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { saveNoteImage } from '@/lib/library/noteImages';
import { NewNoteModal } from '@/components/modals/NewNoteModal';

const mockFocus = jest.fn(async () => {});
const mockEditorMount = jest.fn();
const mockEditorUnmount = jest.fn();
const mockReadMarkdown = jest.fn();
const mockCaptureSelection = jest.fn(async () => {});
const mockInsertImage = jest.fn();
const mockBlur = jest.fn(async () => {});
const mockFormat = jest.fn(async () => {});
jest.mock('@/components/modals/NoteRichTextInput', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const { TextInput } = jest.requireActual('react-native');
  return {
    NoteRichTextInput: React.forwardRef(function Editor(
      props: import('@/components/modals/NoteRichTextInput.types').NoteRichTextInputProps,
      ref
    ) {
      React.useEffect(() => {
        mockEditorMount();
        return mockEditorUnmount;
      }, []);
      const text = React.useRef(props.value);
      text.current = props.value;
      React.useImperativeHandle(ref, () => ({
        focus: mockFocus,
        blur: mockBlur,
        captureSelection: mockCaptureSelection,
        getMarkdown: async () => (await mockReadMarkdown()) ?? text.current,
        insertImage: async (uri: string) => {
          mockInsertImage(uri);
          props.onChangeMarkdown(`${text.current}\n\n![](${uri})`);
        },
        format: mockFormat,
      }));
      return (
        <TextInput
          {...{ onEditorReady: props.onReady }}
          testID="note-rich-text-input"
          placeholder={props.placeholder}
          value={props.value}
          onChangeText={props.onChangeMarkdown}
        />
      );
    }),
  };
});
jest.mock('@/components/ActionFooter', () => ({
  ActionFooter: ({
    children,
    horizontalScroll,
    onDismissKeyboard,
  }: {
    children: React.ReactNode;
    horizontalScroll: boolean;
    onDismissKeyboard?: () => void;
  }) => (
    <MockView
      {...{ onDismissKeyboard }}
      accessibilityLabel={horizontalScroll ? 'scrolling footer' : 'centered footer'}
    >
      {children}
    </MockView>
  ),
}));
let mockLibraryReady = true;
const mockGetTags = jest.fn(() => []);
const mockAddTextItem = jest.fn();
const mockUpdateItem = jest.fn();
jest.mock('expo-image-picker', () => ({ launchImageLibraryAsync: jest.fn() }));
jest.mock('@/lib/library/noteImages', () => ({ saveNoteImage: jest.fn() }));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));
jest.mock('@/hooks/useLibrary', () => ({
  useLibrary: () => ({
    source: { kind: 'local' },
    addMusicItem: jest.fn(),
    addTextItem: mockAddTextItem,
    updateItem: mockUpdateItem,
    getTags: mockGetTags,
    state: mockLibraryReady ? { status: 'ready', result: { items: [] } } : { status: 'loading' },
  }),
}));
jest.mock('@/lib/tags/autoTags', () => ({
  generateAutoTags: () => [],
  generateAutoTagsAsync: () => Promise.resolve([]),
}));

const note = {
  id: 'note-1',
  version: 1 as const,
  type: 'note' as const,
  text: '- [ ] task\n> quote',
  title: 'Title',
  tags: ['reading'],
  linkedItemId: 'book-1',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};
describe('NewNoteModal visual editor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockReadMarkdown.mockReset();
  });
  it('imports a picked image before inserting its relative reference', async () => {
    jest.mocked(ImagePicker.launchImageLibraryAsync).mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file:///photo.png', width: 10, height: 10 }],
    });
    jest.mocked(saveNoteImage).mockResolvedValue('images/attachment.png');
    mockAddTextItem.mockResolvedValue({ type: 'note', id: 'note' });
    const view = await render(<NewNoteModal visible initialText="Task" onClose={jest.fn()} />);
    await fireEvent.press(view.getByLabelText('Open text formatting'));
    await fireEvent.press(view.getByLabelText('Insert image'));
    expect(mockCaptureSelection).toHaveBeenCalledTimes(1);
    expect(mockInsertImage).toHaveBeenCalledWith('images/attachment.png');
    await fireEvent.press(view.getByLabelText('Save note'));
    expect(mockAddTextItem).toHaveBeenCalledWith(
      'Task\n\n![](images/attachment.png)',
      undefined,
      expect.anything()
    );
  });
  it('does not insert or replace selected text when the picker is canceled', async () => {
    jest
      .mocked(ImagePicker.launchImageLibraryAsync)
      .mockResolvedValue({ canceled: true, assets: null });
    const view = await render(<NewNoteModal visible initialText="Original" onClose={jest.fn()} />);
    await fireEvent.press(view.getByLabelText('Open text formatting'));
    await fireEvent.press(view.getByLabelText('Insert image'));
    expect(saveNoteImage).not.toHaveBeenCalled();
    expect(mockInsertImage).not.toHaveBeenCalled();
    expect(view.getByTestId('note-rich-text-input').props.value).toBe('Original');
  });
  it('keeps the form and selected text on image storage failure', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    jest.mocked(ImagePicker.launchImageLibraryAsync).mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file:///photo.png', width: 10, height: 10 }],
    });
    jest.mocked(saveNoteImage).mockRejectedValueOnce(new Error('disk full'));
    const view = await render(<NewNoteModal visible initialText="Original" onClose={jest.fn()} />);
    await fireEvent.press(view.getByLabelText('Open text formatting'));
    await fireEvent.press(view.getByLabelText('Insert image'));
    expect(alert).toHaveBeenCalledWith('Error', 'Could not insert image. Please try again.');
    expect(mockInsertImage).not.toHaveBeenCalled();
    expect(view.getByLabelText('Save note')).toBeEnabled();
    alert.mockRestore();
  });
  it('keeps the primary footer centered with image insertion inside formatting only', async () => {
    const view = await render(<NewNoteModal visible initialText="Note" onClose={jest.fn()} />);
    expect(view.getByLabelText('centered footer')).toBeTruthy();
    expect(view.queryByLabelText('Insert image')).toBeNull();
    expect(view.queryByLabelText('Paste image')).toBeNull();
    expect(view.queryByLabelText('Preview markdown')).toBeNull();
    expect(view.queryByTestId('note-editor-scroll')).toBeNull();
    await fireEvent.press(view.getByLabelText('Open text formatting'));
    expect(view.getByLabelText('scrolling footer')).toBeTruthy();
    expect(view.getByLabelText('Insert image')).toBeTruthy();
    await fireEvent.press(view.getByLabelText('Bold'));
    expect(mockFormat).toHaveBeenCalledWith('bold');
    await fireEvent.press(view.getByLabelText('Cancel formatting'));
    expect(view.getByLabelText('centered footer')).toBeTruthy();
  });
  it('awaits the latest Markdown instead of saving a delayed host snapshot', async () => {
    mockReadMarkdown.mockResolvedValue('Last keystroke');
    mockUpdateItem.mockResolvedValue(note);
    const onClose = jest.fn();
    const view = await render(<NewNoteModal visible editingItem={note} onClose={onClose} />);
    expect(mockUpdateItem).not.toHaveBeenCalled();
    await fireEvent.press(view.getByLabelText('Save note'));
    expect(mockUpdateItem).toHaveBeenCalledWith(note.id, {
      text: 'Last keystroke',
      title: 'Title',
      tags: ['reading'],
      autoTags: undefined,
      linkedItemId: 'book-1',
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
  it('keeps the form open when the editor cannot confirm a save', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    mockReadMarkdown.mockRejectedValueOnce(new Error('reload'));
    const onClose = jest.fn();
    const view = await render(<NewNoteModal visible editingItem={note} onClose={onClose} />);
    await fireEvent.press(view.getByLabelText('Save note'));
    await waitFor(() => expect(view.getByLabelText('Save note')).toBeEnabled());
    expect(mockUpdateItem).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    expect(alert).toHaveBeenCalledWith('Error', 'Could not save note. Please try again.');
    alert.mockRestore();
  });
  it('preserves existing Markdown and metadata when saved without editing', async () => {
    mockUpdateItem.mockResolvedValue(note);
    const view = await render(<NewNoteModal visible editingItem={note} onClose={jest.fn()} />);
    await fireEvent.press(view.getByLabelText('Save note'));
    expect(mockUpdateItem).toHaveBeenCalledWith(
      note.id,
      expect.objectContaining({ text: note.text, tags: note.tags, linkedItemId: note.linkedItemId })
    );
  });
});

it('opens the editor without querying SQLite tags before the library is ready', async () => {
  mockLibraryReady = false;
  mockGetTags.mockClear();
  try {
    const view = await render(<NewNoteModal visible initialText="Draft" onClose={jest.fn()} />);
    expect(view.getByTestId('note-rich-text-input')).toBeTruthy();
    expect(mockGetTags).not.toHaveBeenCalled();
  } finally {
    mockLibraryReady = true;
  }
});

it('routes keyboard dismissal to the visual editor in both footer modes', async () => {
  mockBlur.mockClear();
  const view = await render(<NewNoteModal visible initialText="Draft" onClose={jest.fn()} />);
  await fireEvent(view.getByLabelText('centered footer'), 'dismissKeyboard');
  expect(mockBlur).toHaveBeenCalledTimes(1);
  await fireEvent.press(view.getByLabelText('Open text formatting'));
  await fireEvent(view.getByLabelText('scrolling footer'), 'dismissKeyboard');
  expect(mockBlur).toHaveBeenCalledTimes(2);
});

it('keeps the editor mounted and laid out while switching information tabs', async () => {
  mockEditorMount.mockClear();
  mockEditorUnmount.mockClear();
  const view = await render(
    <NewNoteModal visible initialText="Keep my draft" onClose={jest.fn()} />
  );
  await fireEvent.press(view.getByLabelText('Note info'));
  const pane = view.getByTestId('note-editor-pane', { includeHiddenElements: true });
  const hiddenStyle = StyleSheet.flatten(pane.props.style);
  expect(hiddenStyle.display).toBeUndefined();
  expect(hiddenStyle.flex).toBe(1);
  expect(pane.props.pointerEvents).toBe('none');
  await fireEvent.press(view.getByLabelText('Back to note editor'));
  expect(view.getByTestId('note-rich-text-input').props.value).toBe('Keep my draft');
  expect(mockEditorMount).toHaveBeenCalledTimes(1);
  expect(mockEditorUnmount).not.toHaveBeenCalled();
});

it.each([false, true])(
  'focuses a note after slow editor initialization (editing: %s)',
  async (editing) => {
    mockFocus.mockClear();
    const view = await render(
      <NewNoteModal visible editingItem={editing ? note : undefined} onClose={jest.fn()} />
    );
    mockFocus.mockClear();
    await fireEvent(view.getByTestId('note-rich-text-input'), 'editorReady');
    expect(mockFocus).toHaveBeenCalledWith(editing);
  }
);

it('requests focus again once modal presentation finishes', async () => {
  const view = await render(<NewNoteModal visible onClose={jest.fn()} />);
  await fireEvent(view.getByTestId('note-rich-text-input'), 'editorReady');
  mockFocus.mockClear();
  await fireEvent(view.getByTestId('note-editor-modal'), 'show');
  expect(mockFocus).toHaveBeenCalledWith(false);
});

it('does not steal focus from information fields when the editor recovers', async () => {
  const view = await render(<NewNoteModal visible initialText="Draft" onClose={jest.fn()} />);
  await fireEvent.press(view.getByLabelText('Note info'));
  mockFocus.mockClear();
  await fireEvent(
    view.getByTestId('note-rich-text-input', { includeHiddenElements: true }),
    'editorReady'
  );
  expect(mockFocus).not.toHaveBeenCalled();
});
