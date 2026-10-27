import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { Platform, TextInput, View } from 'react-native';
import { NoteCaretProbe } from './NoteCaretProbe';

import { formatInline, formatLine } from '@/lib/noteFormatting';
import type { NoteRichTextInputHandle, NoteRichTextInputProps } from './NoteRichTextInput.types';
import { translate } from '@/lib/i18n';
import { NOTE_BODY_TYPOGRAPHY } from '@/lib/noteTypography';
import { useAppTheme } from '@/lib/theme';

export const NoteRichTextInput = forwardRef<NoteRichTextInputHandle, NoteRichTextInputProps>(
  function NoteRichTextInput(
    {
      value,
      onChangeMarkdown,
      onSelectionChange,
      onCaretRectChange,
      placeholder,
      placeholderTextColor,
    },
    ref
  ) {
    const { colors } = useAppTheme();
    const inputRef = useRef<TextInput>(null);
    const selectionRef = useRef({ start: 0, end: 0 });
    const [selection, setSelection] = useState(selectionRef.current);
    const [contentHeight, setContentHeight] = useState(0);

    useImperativeHandle(
      ref,
      () => ({
        focus: () => inputRef.current?.focus(),
        getMarkdown: async () => value,
        setSelection: (start, end) => {
          selectionRef.current = { start, end };
          setSelection({ start, end });
        },
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
      <View style={{ flexGrow: 1, width: '100%' }}>
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
          scrollEnabled={false}
          onContentSizeChange={({ nativeEvent }) => {
            const height = Math.ceil(nativeEvent.contentSize.height);
            setContentHeight(height);
            if (Platform.OS === 'web' && selectionRef.current.end === value.length) {
              onCaretRectChange?.({
                y: Math.max(0, height - NOTE_BODY_TYPOGRAPHY.lineHeight),
                height: NOTE_BODY_TYPOGRAPHY.lineHeight,
              });
            }
          }}
          autoFocus={false}
          textAlignVertical="top"
          className="flex-1 w-full font-sans text-lg text-theme-foreground leading-8 px-8"
          style={{
            ...NOTE_BODY_TYPOGRAPHY,
            color: colors.heading,
            borderWidth: 0,
            backgroundColor: 'transparent',
            minHeight: contentHeight,
            paddingTop: 0,
            paddingBottom: 0,
          }}
          underlineColorAndroid="transparent"
          accessibilityLabel={translate('Note text')}
          testID="note-rich-text-input"
        />
        <NoteCaretProbe
          value={value}
          selectionEnd={selection.end}
          onCaretRectChange={onCaretRectChange}
        />
      </View>
    );
  }
);
