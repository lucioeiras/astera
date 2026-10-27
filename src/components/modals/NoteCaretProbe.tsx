import { Platform, Text, View } from 'react-native';
import { NOTE_BODY_TYPOGRAPHY } from '@/lib/noteTypography';
import type { NoteCaretRect } from './NoteRichTextInput.types';

/** Measure the insertion line for the plain Markdown fallback on mobile. */
export function NoteCaretProbe({
  value,
  selectionEnd,
  onCaretRectChange,
}: {
  value: string;
  selectionEnd: number;
  onCaretRectChange?: (rect: NoteCaretRect) => void;
}) {
  if (!onCaretRectChange || Platform.OS === 'web') return null;
  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ position: 'absolute', top: 0, left: 0, right: 0, opacity: 0 }}
    >
      <Text
        testID="note-caret-probe"
        style={{ ...NOTE_BODY_TYPOGRAPHY, paddingHorizontal: 32 }}
        onTextLayout={({ nativeEvent }) => {
          const line = nativeEvent.lines.at(-1);
          if (line) onCaretRectChange({ y: line.y, height: line.height });
        }}
      >
        {value.slice(0, selectionEnd) + '\u200b'}
      </Text>
    </View>
  );
}
