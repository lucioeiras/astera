import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { TextInput } from 'react-native';

import { formatInline, formatLine } from '@/lib/noteFormatting';
import type { NoteRichTextInputHandle, NoteRichTextInputProps } from './NoteRichTextInput.types';
import { translate } from '@/lib/i18n';

export const NoteRichTextInput = forwardRef<NoteRichTextInputHandle, NoteRichTextInputProps>(
  function NoteRichTextInput(
    { value, onChangeMarkdown, onSelectionChange, placeholder, placeholderTextColor },
    ref
  ) {
    const inputRef = useRef<TextInput>(null);
    const selectionRef = useRef({ start: 0, end: 0 });
    const [selection, setSelection] = useState(selectionRef.current);

    useImperativeHandle(
      ref,
      () => ({
        focus: () => inputRef.current?.focus(),
        getMarkdown: async () => value,
        setMarkdown: onChangeMarkdown,
        format: (action, currentSelection = selectionRef.current) => {
          const result =
            action === 'bold' || action === 'italic'
              ? formatInline(value, currentSelection, action === 'bold' ? '**' : '*')
              : formatLine(value, currentSelection, action);
          selectionRef.current = result.selection;
          setSelection(result.selection);
          onChangeMarkdown(result.text);
        },
      }),
      [onChangeMarkdown, value]
    );

    return (
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={onChangeMarkdown}
        selection={selection}
        onSelectionChange={(event) => {
          selectionRef.current = event.nativeEvent.selection;
          setSelection(event.nativeEvent.selection);
          onSelectionChange?.(event.nativeEvent.selection);
        }}
        placeholder={placeholder}
        placeholderTextColor={placeholderTextColor}
        multiline
        autoFocus
        textAlignVertical="top"
        className="flex-1 w-full font-sans text-3xl text-theme-foreground leading-10 px-8 pt-8 pb-32"
        style={{ borderWidth: 0, backgroundColor: 'transparent' }}
        underlineColorAndroid="transparent"
        accessibilityLabel={translate('Note text')}
        testID="note-rich-text-input"
      />
    );
  }
);
