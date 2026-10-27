import { useAppTheme, type ThemeColors } from '@/lib/theme';
import {
  EnrichedMarkdownTextInput,
  type EnrichedMarkdownTextInputInstance,
  type StyleState,
} from 'react-native-enriched-markdown';
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { TextInput, View } from 'react-native';
import { NoteCaretProbe } from './NoteCaretProbe';
import type { TextStyle } from 'react-native';

import { formatInline, formatLine } from '@/lib/noteFormatting';
import type { NoteRichTextInputHandle, NoteRichTextInputProps } from './NoteRichTextInput.types';
import { translate } from '@/lib/i18n';
import { NOTE_BODY_TYPOGRAPHY } from '@/lib/noteTypography';

const INPUT_STYLE = (themeColors: ThemeColors): TextStyle => ({
  flex: 1,
  width: '100%',
  ...NOTE_BODY_TYPOGRAPHY,
  color: themeColors.heading,
  paddingHorizontal: 32,
  paddingTop: 0,
  paddingBottom: 0,
  backgroundColor: 'transparent',
});

function containsUnsupportedBlocks(markdown: string) {
  return /(^|\n)\s*>\s?/m.test(markdown) || /(^|\n)\s*[-*+]\s+\[[ xX]\]\s+/m.test(markdown);
}

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
    const { colors: themeColors } = useAppTheme();
    const inputRef = useRef<EnrichedMarkdownTextInputInstance>(null);
    const plainInputRef = useRef<TextInput>(null);
    const currentMarkdownRef = useRef(value);
    const selectionRef = useRef({ start: 0, end: 0 });
    const [textSelection, setTextSelection] = useState({ start: 0, end: 0 });
    const [plainContentHeight, setPlainContentHeight] = useState(0);
    const styleStateRef = useRef<StyleState | null>(null);
    const [plainMarkdownMode, setPlainMarkdownMode] = useState(() =>
      containsUnsupportedBlocks(value)
    );
    const caretFrame = useRef<number | null>(null);
    const caretRequest = useRef(0);
    const refreshNativeCaret = useCallback(() => {
      if (!onCaretRectChange) return;
      if (caretFrame.current !== null) cancelAnimationFrame(caretFrame.current);
      caretFrame.current = requestAnimationFrame(() => {
        caretFrame.current = null;
        const editor = inputRef.current;
        const request = ++caretRequest.current;
        // Paste can update the text and its layout without a separate cursor event.
        const result = editor?.getCaretRect?.();
        void result
          ?.then((rect) => {
            if (request === caretRequest.current && editor === inputRef.current) {
              onCaretRectChange(rect);
            }
          })
          .catch(() => undefined);
      });
    }, [onCaretRectChange]);

    useEffect(() => {
      if (!plainMarkdownMode) refreshNativeCaret();
      return () => {
        caretRequest.current += 1;
        if (caretFrame.current !== null) {
          cancelAnimationFrame(caretFrame.current);
          caretFrame.current = null;
        }
      };
    }, [value, plainMarkdownMode, refreshNativeCaret]);

    useEffect(() => {
      if (value !== currentMarkdownRef.current) {
        currentMarkdownRef.current = value;
        const unsupported = containsUnsupportedBlocks(value);
        setPlainMarkdownMode(unsupported);
        if (!unsupported) inputRef.current?.setValue(value);
      }
    }, [value]);

    useImperativeHandle(
      ref,
      () => ({
        focus: () =>
          plainMarkdownMode ? plainInputRef.current?.focus() : inputRef.current?.focus(),
        getMarkdown: async () =>
          plainMarkdownMode
            ? currentMarkdownRef.current
            : ((await inputRef.current?.getMarkdown()) ?? currentMarkdownRef.current),
        setSelection: (start, end) => {
          selectionRef.current = { start, end };
          setTextSelection({ start, end });
          if (!plainMarkdownMode) inputRef.current?.setSelection(start, end);
        },
        setMarkdown: (markdown) => {
          currentMarkdownRef.current = markdown;
          const unsupported = containsUnsupportedBlocks(markdown);
          setPlainMarkdownMode(unsupported);
          if (!unsupported) inputRef.current?.setValue(markdown);
          onChangeMarkdown(markdown);
        },
        format: (action, selection = selectionRef.current) => {
          if (plainMarkdownMode) {
            const current = currentMarkdownRef.current;
            const result =
              action === 'bold' || action === 'italic'
                ? formatInline(current, selection, action === 'bold' ? '**' : '*')
                : formatLine(current, selection, action);
            currentMarkdownRef.current = result.text;
            setPlainMarkdownMode(containsUnsupportedBlocks(result.text));
            selectionRef.current = result.selection;
            setTextSelection(result.selection);
            onSelectionChange?.(result.selection);
            onChangeMarkdown(result.text);
            return;
          }

          const editor = inputRef.current;
          if (!editor) return;
          if (action === 'bold') return editor.toggleBold();
          if (action === 'italic') return editor.toggleItalic();
          if (action === 'heading-1') return editor.toggleHeading(1);
          if (action === 'heading-2') return editor.toggleHeading(2);
          if (action === 'heading-3') return editor.toggleHeading(3);
          if (action === 'bullet') return editor.toggleUnorderedList();
          if (action === 'numbered') return editor.toggleOrderedList();
          if (action === 'paragraph') {
            const heading = styleStateRef.current?.heading;
            if (heading?.isActive) editor.toggleHeading(heading.level);
            return;
          }

          // The native input doesn't model task lists or blockquotes. Preserve
          // their Markdown through the plain editor until those blocks are removed.
          void editor.getMarkdown().then((markdown) => {
            const result = formatLine(markdown, selection, action);
            currentMarkdownRef.current = result.text;
            const unsupported = containsUnsupportedBlocks(result.text);
            setPlainMarkdownMode(unsupported);
            if (!unsupported) {
              editor.setValue(result.text);
              editor.setSelection(result.selection.start, result.selection.end);
            }
            selectionRef.current = result.selection;
            setTextSelection(result.selection);
            onChangeMarkdown(result.text);
          });
        },
      }),
      [onChangeMarkdown, onSelectionChange, plainMarkdownMode]
    );

    if (plainMarkdownMode) {
      return (
        <View style={{ flexGrow: 1, width: '100%' }}>
          <TextInput
            ref={plainInputRef}
            value={value}
            onChangeText={(markdown) => {
              currentMarkdownRef.current = markdown;
              setPlainMarkdownMode(containsUnsupportedBlocks(markdown));
              onChangeMarkdown(markdown);
            }}
            onSelectionChange={(event) => {
              selectionRef.current = event.nativeEvent.selection;
              setTextSelection(event.nativeEvent.selection);
              onSelectionChange?.(event.nativeEvent.selection);
            }}
            selection={textSelection}
            placeholder={placeholder}
            placeholderTextColor={placeholderTextColor}
            multiline
            scrollEnabled={false}
            onContentSizeChange={({ nativeEvent }) => {
              setPlainContentHeight(Math.ceil(nativeEvent.contentSize.height));
            }}
            autoFocus={false}
            textAlignVertical="top"
            className="flex-1 w-full font-sans text-lg text-theme-foreground leading-8 px-8"
            style={{ ...INPUT_STYLE(themeColors), minHeight: plainContentHeight, borderWidth: 0 }}
            underlineColorAndroid="transparent"
            accessibilityLabel={translate('Note text')}
            testID="note-rich-text-input"
          />
          <NoteCaretProbe
            value={value}
            selectionEnd={textSelection.end}
            onCaretRectChange={onCaretRectChange}
          />
        </View>
      );
    }

    return (
      <EnrichedMarkdownTextInput
        ref={inputRef}
        defaultValue={value}
        onChangeMarkdown={(markdown) => {
          currentMarkdownRef.current = markdown;
          if (containsUnsupportedBlocks(markdown)) setPlainMarkdownMode(true);
          onChangeMarkdown(markdown);
        }}
        onChangeSelection={(selection) => {
          selectionRef.current = selection;
          setTextSelection(selection);
          onSelectionChange?.(selection);
        }}
        onChangeState={(state) => {
          styleStateRef.current = state;
        }}
        placeholder={placeholder}
        placeholderTextColor={placeholderTextColor}
        multiline
        scrollEnabled={false}
        onCaretRectChange={(rect) => {
          caretRequest.current += 1;
          onCaretRectChange?.(rect);
        }}
        onLayout={refreshNativeCaret}
        autoFocus={false}
        markdownShortcuts
        style={INPUT_STYLE(themeColors)}
        markdownStyle={{
          h1: { fontSize: 34, fontWeight: '700', color: themeColors.foreground },
          h2: { fontSize: 29, fontWeight: '700', color: themeColors.foreground },
          h3: { fontSize: 25, fontWeight: '600', color: themeColors.bright },
          h4: { fontSize: 22, fontWeight: '600', color: themeColors.bright },
          h5: { fontSize: 20, fontWeight: '500', color: themeColors.heading },
          h6: { fontSize: 18, fontWeight: '500', color: themeColors.body },
          list: { itemSpacing: 4 },
        }}
        accessibilityLabel={translate('Note text')}
        testID="note-rich-text-input"
      />
    );
  }
);
