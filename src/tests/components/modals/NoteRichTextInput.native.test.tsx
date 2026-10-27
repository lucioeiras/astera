import { createRef } from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import { StyleSheet, View as MockView } from 'react-native';

import { NoteRichTextInput } from '@/components/modals/NoteRichTextInput.native';
import type { NoteRichTextInputHandle } from '@/components/modals/NoteRichTextInput.types';
import { palettes as mockPalettes } from '@/lib/theme/palette';

let mockIsDark = false;
jest.mock('@/lib/theme', () => ({
  useAppTheme: () => ({
    colors: mockPalettes[mockIsDark ? 'dark' : 'light'],
  }),
}));
jest.mock('react-native-enriched-markdown', () => ({
  EnrichedMarkdownTextInput: (props: object) => <MockView {...props} />,
}));

beforeEach(() => {
  mockIsDark = false;
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
    mockPalettes.light.foreground
  );
  expect(view.getByTestId('note-rich-text-input').props.markdownStyle.h1.color).toBe(
    mockPalettes.light.foreground
  );
  mockIsDark = true;
  await view.rerender(<NoteRichTextInput {...props} />);
  expect(StyleSheet.flatten(view.getByTestId('note-rich-text-input').props.style).color).toBe(
    mockPalettes.dark.foreground
  );
  expect(view.getByTestId('note-rich-text-input').props.markdownStyle.h1.color).toBe(
    mockPalettes.dark.foreground
  );
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
