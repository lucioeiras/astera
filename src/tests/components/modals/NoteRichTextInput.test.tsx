import { Keyboard, StyleSheet } from 'react-native';
import { createRef } from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { NoteRichTextInput } from '@/components/modals/NoteRichTextInput';
import type { NoteRichTextInputHandle } from '@/components/modals/NoteRichTextInput.types';
import type { NoteEditorDOMProps } from '@/components/modals/NoteEditor.dom';
import { LibraryAssetContext } from '@/lib/library/assetContext';
import * as Clipboard from 'expo-clipboard';
import { loadEditorFonts } from '@/lib/noteEditor/fonts';

let mockDOM: NoteEditorDOMProps;
const mockDOMRender = jest.fn();
const mockDOMFocus = jest.fn();
const mockColors = {
  canvas: '#fff',
  surface: '#ededf0',
  heading: '#111',
  strongBorder: '#ccc',
  blueSoft: '#00f',
  muted: '#888',
};
jest.mock('@/lib/theme', () => ({ useAppTheme: () => ({ colors: mockColors }) }));
jest.mock('@/components/modals/NoteEditor.dom', () => {
  const { View } = jest.requireActual('react-native');
  const React = jest.requireActual<typeof import('react')>('react');
  return {
    __esModule: true,
    default: function MockNoteEditorDOM(props: NoteEditorDOMProps) {
      React.useImperativeHandle(props.ref, () => ({ focus: mockDOMFocus }), []);
      mockDOMRender();
      mockDOM = props;
      return <View testID="dom-document" />;
    },
  };
});
jest.mock('expo-clipboard', () => ({ getImageAsync: jest.fn() }));
jest.mock('@/lib/noteEditor/fonts', () => ({ loadEditorFonts: jest.fn(async () => null) }));
jest.mock('expo-file-system', () => ({
  File: jest.fn().mockImplementation(() => ({ base64: async () => 'AQI=' })),
}));
const props = {
  value: 'Original',
  placeholder: 'Type here...',
  placeholderTextColor: '#888',
  onChangeMarkdown: jest.fn(),
  onImportImage: jest.fn(async () => 'images/photo.png'),
  onError: jest.fn(),
};

beforeEach(() => jest.clearAllMocks());
it('waits for DOM initialization and returns acknowledged Markdown', async () => {
  const ref = createRef<NoteRichTextInputHandle>();
  await render(<NoteRichTextInput {...props} ref={ref} />);
  let read!: Promise<string>;
  await act(async () => {
    read = ref.current!.getMarkdown();
  });
  expect(mockDOM.request).toBeNull();
  await act(() => mockDOM.onReady());
  expect(mockDOM.request?.command).toEqual({ method: 'getMarkdown' });
  await act(() => mockDOM.onResult({ id: mockDOM.request!.id, value: 'Latest' }));
  await expect(read).resolves.toBe('Latest');
});
it('keeps a recovery snapshot and restores it after a WebView process reload', async () => {
  const onChange = jest.fn();
  const view = await render(<NoteRichTextInput {...props} onChangeMarkdown={onChange} />);
  await act(() => mockDOM.onReady());
  await act(() => mockDOM.onChange('**Unsaved edit**'));
  expect(onChange).toHaveBeenCalledWith('**Unsaved edit**');
  await act(async () => {
    (mockDOM.dom?.onContentProcessDidTerminate as () => void)();
  });
  expect(mockDOM.value).toBe('**Unsaved edit**');
  expect(mockDOM.request).toBeNull();
  expect(view.getByTestId('dom-document')).toBeTruthy();
});
it('replaces external content through a command and does not reset on echoed changes', async () => {
  const view = await render(<NoteRichTextInput {...props} />);
  await act(() => mockDOM.onReady());
  await act(() => mockDOM.onChange('Typing'));
  await view.rerender(<NoteRichTextInput {...props} value="Typing" />);
  expect(mockDOM.request).toBeNull();
  await view.rerender(<NoteRichTextInput {...props} value="Lyrics" />);
  await waitFor(() =>
    expect(mockDOM.request?.command).toEqual({ method: 'setMarkdown', markdown: 'Lyrics' })
  );
  await act(() => mockDOM.onResult({ id: mockDOM.request!.id }));
});
it('uses one importer and consults native clipboard only on a DOM paste request', async () => {
  jest
    .mocked(Clipboard.getImageAsync)
    .mockResolvedValue({ data: 'data:image/png;base64,AQI=', size: { width: 1, height: 1 } });
  await render(<NoteRichTextInput {...props} />);
  expect(Clipboard.getImageAsync).not.toHaveBeenCalled();
  await expect(mockDOM.onReadClipboardImage()).resolves.toBe('data:image/png;base64,AQI=');
  const asset = { uri: 'data:image/png;base64,AQI=', mimeType: 'image/png' };
  await expect(mockDOM.onImportImage(asset)).resolves.toBe('images/photo.png');
  expect(props.onImportImage).toHaveBeenCalledWith(asset);
});
it('resolves safe relative images for display without modifying Markdown', async () => {
  await render(
    <LibraryAssetContext.Provider value="file:///library">
      <NoteRichTextInput {...props} />
    </LibraryAssetContext.Provider>
  );
  await expect(mockDOM.onResolveImage('images/photo.jpg')).resolves.toBe(
    'data:image/jpeg;base64,AQI='
  );
  await expect(mockDOM.onResolveImage('images/../../private.png')).resolves.toBe('');
  expect(props.onChangeMarkdown).not.toHaveBeenCalled();
});
it('offers recovery on initialization failure', async () => {
  const view = await render(<NoteRichTextInput {...props} />);
  await act(() => mockDOM.onError());
  expect(view.getByLabelText('Retry editor')).toBeTruthy();
  await fireEvent.press(view.getByLabelText('Retry editor'));
  expect(view.queryByLabelText('Retry editor')).toBeNull();
});

it('applies theme and locale changes without resetting the document', async () => {
  const view = await render(<NoteRichTextInput {...props} />);
  await act(() => mockDOM.onReady());
  await act(() => mockDOM.onChange('In progress'));
  mockColors.canvas = '#111';
  await view.rerender(
    <NoteRichTextInput {...props} value="In progress" placeholder="Escreva aqui" />
  );
  expect(mockDOM.colors.background).toBe('#111');
  expect(mockDOM.placeholder).toBe('Escreva aqui');
  expect(mockDOM.request).toBeNull();
  mockColors.canvas = '#fff';
});
it('applies an external replacement received during slow initialization', async () => {
  const view = await render(<NoteRichTextInput {...props} />);
  await view.rerender(<NoteRichTextInput {...props} value="New source" />);
  await act(() => mockDOM.onReady());
  expect(mockDOM.request?.command).toEqual({ method: 'setMarkdown', markdown: 'New source' });
  await act(() => mockDOM.onResult({ id: mockDOM.request!.id }));
});

it('awaits DOM blur before dismissing the native keyboard', async () => {
  const dismiss = jest.spyOn(Keyboard, 'dismiss').mockImplementation(() => {});
  const ref = createRef<NoteRichTextInputHandle>();
  try {
    await render(<NoteRichTextInput {...props} ref={ref} />);
    await act(() => mockDOM.onReady());
    let blurred!: Promise<void>;
    await act(async () => {
      blurred = ref.current!.blur();
    });
    expect(mockDOM.request?.command).toEqual({ method: 'blur' });
    expect(dismiss).not.toHaveBeenCalled();
    await act(() => mockDOM.onResult({ id: mockDOM.request!.id }));
    await blurred;
    expect(dismiss).toHaveBeenCalledTimes(1);
  } finally {
    dismiss.mockRestore();
  }
});

it('does not resend the document on typing or changes to native callbacks', async () => {
  const view = await render(<NoteRichTextInput {...props} />);
  await act(() => mockDOM.onReady());
  const renders = mockDOMRender.mock.calls.length;
  await act(() => mockDOM.onChange('Typing a longer document'));
  const updatedCallback = jest.fn();
  await view.rerender(
    <NoteRichTextInput
      {...props}
      value="Typing a longer document"
      onChangeMarkdown={updatedCallback}
    />
  );
  expect(mockDOMRender).toHaveBeenCalledTimes(renders);
  expect(mockDOM.value).toBe('Original');
  await act(() => mockDOM.onChange('Next edit'));
  expect(updatedCallback).toHaveBeenCalledWith('Next edit');
});

it('starts reading fonts while the WebView is still initializing', async () => {
  await render(<NoteRichTextInput {...props} />);
  expect(loadEditorFonts).toHaveBeenCalledTimes(1);
  expect(mockDOM.request).toBeNull();
});

it('notifies the modal after connecting the ready editor so it can request focus', async () => {
  const ref = createRef<NoteRichTextInputHandle>();
  const onReady = jest.fn(() => {
    void ref.current!.focus();
  });
  await render(<NoteRichTextInput {...props} ref={ref} onReady={onReady} />);
  expect(onReady).not.toHaveBeenCalled();
  await act(() => mockDOM.onReady());
  expect(onReady).toHaveBeenCalledTimes(1);
  expect(mockDOMFocus).toHaveBeenCalledWith(expect.any(Number), false);
  expect(mockDOM.request).toBeNull();
  await act(() => mockDOM.onResult({ id: mockDOMFocus.mock.calls[0][0] }));
});

it('waits for initialization then focuses through the native imperative call with an acknowledgement', async () => {
  const ref = createRef<NoteRichTextInputHandle>();
  await render(<NoteRichTextInput {...props} ref={ref} />);
  let focused!: Promise<void>;
  let acknowledged = false;
  await act(async () => {
    focused = ref.current!.focus(true).then(() => {
      acknowledged = true;
    });
  });
  expect(mockDOMFocus).not.toHaveBeenCalled();
  await act(() => mockDOM.onReady());
  expect(mockDOMFocus).toHaveBeenCalledWith(expect.any(Number), true);
  expect(mockDOM.request).toBeNull();
  expect(acknowledged).toBe(false);
  await act(() => mockDOM.onResult({ id: mockDOMFocus.mock.calls[0][0] }));
  await focused;
  expect(acknowledged).toBe(true);
});

it('covers initial WebView painting and recovery with the active dark background', async () => {
  const originalCanvas = mockColors.canvas;
  mockColors.canvas = '#111';
  try {
    const view = await render(<NoteRichTextInput {...props} />);
    const loading = view.getByTestId('note-editor-loading');
    expect(StyleSheet.flatten(loading.props.style)).toEqual(
      expect.objectContaining({
        backgroundColor: '#111',
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
      })
    );
    expect(loading.props.pointerEvents).toBe('none');
    expect(mockDOM.dom?.style).toEqual(expect.objectContaining({ backgroundColor: '#111' }));
    expect(mockDOM.dom?.containerStyle).toEqual(
      expect.objectContaining({ backgroundColor: '#111' })
    );
    await act(() => mockDOM.onReady());
    expect(view.queryByTestId('note-editor-loading')).toBeNull();
    await act(async () => {
      (mockDOM.dom?.onContentProcessDidTerminate as () => void)();
    });
    expect(
      StyleSheet.flatten(view.getByTestId('note-editor-loading').props.style).backgroundColor
    ).toBe('#111');
  } finally {
    mockColors.canvas = originalCanvas;
  }
});

it('exposes insertion commands only when supported and forwards requests to the host', async () => {
  const view = await render(<NoteRichTextInput {...props} />);
  expect(mockDOM.slashCommands.map(({ action }) => action)).not.toContain('image');
  const onInsert = jest.fn(async () => {});
  await view.rerender(<NoteRichTextInput {...props} onInsert={onInsert} />);
  expect(mockDOM.slashCommands.map(({ action }) => action)).toEqual(
    expect.arrayContaining(['image', 'lyrics'])
  );
  await mockDOM.onInsert('image');
  await mockDOM.onInsert('lyrics');
  expect(onInsert.mock.calls).toEqual([['image'], ['lyrics']]);
});
