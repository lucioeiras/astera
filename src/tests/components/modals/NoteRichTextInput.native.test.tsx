import { createRef } from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import { StyleSheet, View as MockView } from 'react-native';

import { NoteRichTextInput } from '@/components/modals/NoteRichTextInput.native';
import { MarkdownNote } from '@/components/card/MarkdownNote';
import type { NoteRichTextInputHandle } from '@/components/modals/NoteRichTextInput.types';
import { palettes as mockPalettes } from '@/lib/theme/palette';

let mockIsDark = false;
const mockGetCaretRect = jest.fn();
jest.mock('@/lib/theme', () => ({
  useAppTheme: () => ({
    colors: mockPalettes[mockIsDark ? 'dark' : 'light'],
  }),
}));
jest.mock('react-native-enriched-markdown', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  return {
    EnrichedMarkdownTextInput: React.forwardRef(function MockEditor(props: object, ref) {
      React.useImperativeHandle(ref, () => ({ getCaretRect: mockGetCaretRect }));
      return <MockView {...props} />;
    }),
  };
});

beforeEach(() => {
  mockIsDark = false;
  mockGetCaretRect.mockReset().mockResolvedValue({ x: 0, y: 0, width: 1, height: 32 });
});

it('reports the final insertion position after pasted content is laid out', async () => {
  jest.useFakeTimers();
  try {
    const onCaretRectChange = jest.fn();
    const props = {
      value: 'Original note',
      onChangeMarkdown: jest.fn(),
      onCaretRectChange,
      placeholder: 'Write a note',
      placeholderTextColor: mockPalettes.light.muted,
    };
    const view = await render(<NoteRichTextInput {...props} />);
    await act(async () => {
      jest.advanceTimersByTime(20);
    });
    onCaretRectChange.mockClear();
    mockGetCaretRect.mockResolvedValue({ x: 0, y: 800, width: 1, height: 32 });

    const pasted = 'Original note\n' + 'Pasted paragraph\n'.repeat(30);
    await fireEvent(view.getByTestId('note-rich-text-input'), 'changeMarkdown', pasted);
    await view.rerender(<NoteRichTextInput {...props} value={pasted} />);
    await fireEvent(view.getByTestId('note-rich-text-input'), 'layout', {
      nativeEvent: { layout: { x: 0, y: 0, width: 390, height: 1000 } },
    });
    await act(async () => {
      jest.advanceTimersByTime(20);
    });
    expect(onCaretRectChange).toHaveBeenLastCalledWith({ x: 0, y: 800, width: 1, height: 32 });
  } finally {
    jest.useRealTimers();
  }
});

it('reports native cursor movement to the containing scroll view', async () => {
  const onCaretRectChange = jest.fn();
  const view = await render(
    <NoteRichTextInput
      value="Long note"
      onChangeMarkdown={jest.fn()}
      onCaretRectChange={onCaretRectChange}
      placeholder="Write a note"
      placeholderTextColor={mockPalettes.light.muted}
    />
  );
  await fireEvent(view.getByTestId('note-rich-text-input'), 'caretRectChange', {
    x: 0,
    y: 640,
    width: 1,
    height: 32,
  });
  expect(onCaretRectChange).toHaveBeenCalledWith({ x: 0, y: 640, width: 1, height: 32 });
  expect(view.getByTestId('note-rich-text-input').props.scrollEnabled).toBe(false);
});

it('tracks the insertion line in the plain Markdown fallback', async () => {
  const onCaretRectChange = jest.fn();
  const view = await render(
    <NoteRichTextInput
      value="- [ ] task"
      onChangeMarkdown={jest.fn()}
      onCaretRectChange={onCaretRectChange}
      placeholder="Write a note"
      placeholderTextColor={mockPalettes.light.muted}
    />
  );
  await fireEvent(
    view.getByTestId('note-caret-probe', { includeHiddenElements: true }),
    'textLayout',
    {
      nativeEvent: {
        lines: [
          { y: 64, height: 32 },
          { y: 96, height: 32 },
        ],
      },
    }
  );
  expect(onCaretRectChange).toHaveBeenCalledWith({ y: 96, height: 32 });
});

it('updates the native rich editor text and headings when the appearance changes', async () => {
  const props = {
    value: 'A note',
    onChangeMarkdown: jest.fn(),
    placeholder: 'Write a note',
    placeholderTextColor: mockPalettes.light.muted,
  };
  const view = await render(<NoteRichTextInput {...props} />);
  expect(StyleSheet.flatten(view.getByTestId('note-rich-text-input').props.style).color).toBe(
    mockPalettes.light.heading
  );
  expect(view.getByTestId('note-rich-text-input').props.markdownStyle.h1.color).toBe(
    mockPalettes.light.foreground
  );
  mockIsDark = true;
  await view.rerender(<NoteRichTextInput {...props} />);
  expect(StyleSheet.flatten(view.getByTestId('note-rich-text-input').props.style).color).toBe(
    mockPalettes.dark.heading
  );
  expect(view.getByTestId('note-rich-text-input').props.markdownStyle.h1.color).toBe(
    mockPalettes.dark.foreground
  );
});

it.each(['A note', '- [ ] task'])('matches preview typography for %s', async (value) => {
  const view = await render(
    <MockView>
      <MarkdownNote markdown="Preview paragraph" />
      <NoteRichTextInput
        value={value}
        onChangeMarkdown={jest.fn()}
        placeholder="Write a note"
        placeholderTextColor={mockPalettes.light.muted}
      />
    </MockView>
  );
  const previewStyle = StyleSheet.flatten(view.getByTestId('markdown-body-text').props.style);
  const editorStyle = StyleSheet.flatten(view.getByTestId('note-rich-text-input').props.style);
  expect(editorStyle).toMatchObject({
    fontFamily: previewStyle.fontFamily,
    fontSize: previewStyle.fontSize,
    lineHeight: previewStyle.lineHeight,
    color: previewStyle.color,
  });
});

it('keeps selection and formatting working in the plain editor for unsupported blocks', async () => {
  const ref = createRef<NoteRichTextInputHandle>();
  const onChangeMarkdown = jest.fn();
  const view = await render(
    <NoteRichTextInput
      ref={ref}
      value="- [ ] task"
      placeholder="Write a note"
      placeholderTextColor={mockPalettes.light.muted}
      onChangeMarkdown={onChangeMarkdown}
    />
  );
  const input = view.getByTestId('note-rich-text-input');
  await fireEvent(input, 'selectionChange', { nativeEvent: { selection: { start: 6, end: 10 } } });
  expect(view.getByTestId('note-rich-text-input').props.selection).toEqual({ start: 6, end: 10 });
  await act(async () => {
    ref.current?.format('bold');
  });
  expect(onChangeMarkdown).toHaveBeenCalledWith('- [ ] **task**');
  expect(view.getByTestId('note-rich-text-input').props.selection).toEqual({ start: 6, end: 14 });
});
