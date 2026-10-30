import { isNoteImageUri, NOTE_IMAGE_PATTERN } from '@/lib/noteImages';
import { NOTE_BODY_TYPOGRAPHY, NOTE_HEADING_TYPOGRAPHY } from '@/lib/noteTypography';
import { useAppTheme, type ThemeColors } from '@/lib/theme';
import { openExternalLink } from '@/lib/linkOpening';
import { Check } from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { MarkdownNoteImage } from './MarkdownNoteImage';

type MarkdownNoteProps = {
  markdown: string;
  onEdit?: () => void;
  onMarkdownChange?: (markdown: string) => void;
  compact?: boolean;
};

const HEADING_STYLES = (themeColors: ThemeColors) =>
  NOTE_HEADING_TYPOGRAPHY.map((heading, index) => ({
    ...heading,
    color: [
      themeColors.foreground,
      themeColors.foreground,
      themeColors.bright,
      themeColors.bright,
      themeColors.heading,
      themeColors.body,
    ][index],
  }));

function renderInline(value: string, themeColors: ThemeColors) {
  const parts = value.split(/(\[[^\]]+\]\(https?:\/\/[^\s)]+\)|\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g);
  return parts.map((part, index) => {
    const link = /^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/.exec(part);
    const bold = part.startsWith('**') && part.endsWith('**');
    const italic = !bold && part.startsWith('*') && part.endsWith('*');
    const code = part.startsWith('`') && part.endsWith('`');
    return (
      <Text
        key={index}
        accessibilityRole={link ? 'link' : undefined}
        onPress={link ? () => void openExternalLink(link[2]).catch(() => undefined) : undefined}
        style={[
          link
            ? {
                color: themeColors.secondary,
                textDecorationLine: 'underline',
                textDecorationColor: 'rgba(113, 113, 122, 0.45)',
              }
            : null,
          bold ? { fontWeight: '700' } : null,
          italic ? { fontStyle: 'italic' } : null,
          code ? { fontFamily: 'monospace', color: themeColors.blueSoft } : null,
        ]}
      >
        {link ? link[1] : bold || italic || code ? part.slice(bold ? 2 : 1, bold ? -2 : -1) : part}
      </Text>
    );
  });
}

export function MarkdownNote({
  markdown,
  onEdit,
  onMarkdownChange,
  compact = false,
}: MarkdownNoteProps) {
  const { colors: themeColors } = useAppTheme();
  const headingStyles = useMemo(() => HEADING_STYLES(themeColors), [themeColors]);
  const blocks = markdown.split(/\n\s*\n/);
  const blockOffsets = blocks.map((_, blockIndex) =>
    blocks.slice(0, blockIndex).reduce((offset, previousBlock) => {
      const blockStart = markdown.indexOf(previousBlock, offset);
      const blockEnd = blockStart + previousBlock.length;
      const separator = /^\n\s*\n/.exec(markdown.slice(blockEnd))?.[0] ?? '';
      return blockEnd + separator.length;
    }, 0)
  );
  const content = (
    <View testID="markdown-note-content" className="w-full gap-4" style={{ flexShrink: 0 }}>
      {blocks.map((block, index) => {
        const blockStart = blockOffsets[index];
        const lines = block.split('\n');
        return (
          <View key={index} className="gap-1">
            {lines.map((line, lineIndex) => {
              const currentLineStart =
                blockStart +
                lines
                  .slice(0, lineIndex)
                  .reduce((offset, previousLine) => offset + previousLine.length + 1, 0);
              const heading = /^(#{1,6})\s+(.*)$/.exec(line);
              const images = Array.from(line.matchAll(NOTE_IMAGE_PATTERN));
              if (images.length > 0) {
                let offset = 0;
                const textFragment = (fragment: string, offset: number) => (
                  <MarkdownNote
                    markdown={fragment}
                    compact={compact}
                    onMarkdownChange={
                      onMarkdownChange
                        ? (next) =>
                            onMarkdownChange(
                              markdown.slice(0, currentLineStart + offset) +
                                next +
                                markdown.slice(currentLineStart + offset + fragment.length)
                            )
                        : undefined
                    }
                  />
                );
                return (
                  <View key={lineIndex} className="gap-2">
                    {images.map((image, imageIndex) => {
                      const start = offset;
                      const preceding = line.slice(start, image.index);
                      offset = image.index + image[0].length;
                      return (
                        <View key={imageIndex} className="gap-2">
                          {preceding ? textFragment(preceding, start) : null}
                          {isNoteImageUri(image[2]) ? (
                            <MarkdownNoteImage uri={image[2]} alt={image[1]} compact={compact} />
                          ) : (
                            <Text style={{ ...NOTE_BODY_TYPOGRAPHY, color: themeColors.heading }}>
                              {image[1] || 'Image'}
                            </Text>
                          )}
                        </View>
                      );
                    })}
                    {offset < line.length ? textFragment(line.slice(offset), offset) : null}
                  </View>
                );
              }
              const legacyTaskList = /^\s*[-*+]\s+\[([ xX])\]\s+(.*)$/.exec(line);
              const symbolTaskList = /^\s*(?:[-*+]\s+)?([☐☑])\s+(.*)$/.exec(line);
              const taskList = legacyTaskList ?? symbolTaskList;
              const orderedList = /^\s*(\d+)[.)]\s+(.*)$/.exec(line);
              const unorderedList = /^\s*[-*+]\s+(.*)$/.exec(line);
              const list = taskList ?? orderedList ?? unorderedList;
              const quote = /^>\s?(.*)$/.exec(line);
              const value =
                heading?.[2] ??
                legacyTaskList?.[2] ??
                symbolTaskList?.[2] ??
                orderedList?.[2] ??
                unorderedList?.[1] ??
                quote?.[1] ??
                line;
              const headingStyle = heading ? headingStyles[heading[1].length - 1] : undefined;
              const isTaskChecked = Boolean(
                legacyTaskList ? legacyTaskList[1].trim() : symbolTaskList?.[1] === '☑'
              );
              const textStyle = {
                fontSize: compact
                  ? heading
                    ? Math.max(15, (headingStyle?.fontSize ?? 25) - 10)
                    : 15
                  : (headingStyle?.fontSize ?? NOTE_BODY_TYPOGRAPHY.fontSize),
                lineHeight: compact
                  ? heading
                    ? Math.max(20, (headingStyle?.lineHeight ?? 32) - 10)
                    : list
                      ? 24
                      : 26
                  : list
                    ? (headingStyle?.lineHeight ?? NOTE_BODY_TYPOGRAPHY.lineHeight) - 4
                    : (headingStyle?.lineHeight ?? NOTE_BODY_TYPOGRAPHY.lineHeight),
                fontFamily: headingStyle?.fontFamily ?? NOTE_BODY_TYPOGRAPHY.fontFamily,
                color: quote ? themeColors.secondary : (headingStyle?.color ?? themeColors.heading),
              };
              if (taskList) {
                const checkbox = (
                  <View
                    className={`items-center justify-center ${
                      isTaskChecked
                        ? 'border-theme-foreground bg-theme-foreground'
                        : 'border-theme-muted bg-transparent'
                    }`}
                    style={{
                      width: compact ? 20 : 24,
                      height: compact ? 20 : 24,
                      borderWidth: compact ? 1.5 : 2,
                      borderRadius: compact ? 5 : 6,
                    }}
                  >
                    {isTaskChecked && (
                      <Check size={compact ? 13 : 16} color={themeColors.inverse} strokeWidth={2} />
                    )}
                  </View>
                );
                return (
                  <View
                    key={lineIndex}
                    className={`flex-row items-start ${compact ? 'gap-2.5' : 'gap-3'} py-1`}
                    style={{ paddingLeft: 0 }}
                  >
                    {onMarkdownChange ? (
                      <Pressable
                        onPress={(event) => {
                          event.stopPropagation();
                          const updatedLine = legacyTaskList
                            ? line.replace(
                                /^(\s*[-*+]\s+\[)[ xX](\]\s+)(.*)$/,
                                `$1${isTaskChecked ? ' ' : 'x'}$2$3`
                              )
                            : line.replace(/[☐☑]/, isTaskChecked ? '☐' : '☑');
                          onMarkdownChange(
                            markdown.slice(0, currentLineStart) +
                              updatedLine +
                              markdown.slice(currentLineStart + line.length)
                          );
                        }}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: isTaskChecked }}
                        accessibilityLabel={
                          isTaskChecked ? 'Mark task incomplete' : 'Mark task complete'
                        }
                        hitSlop={8}
                        className="items-center justify-center"
                        style={{
                          width: compact ? 20 : 24,
                          height: compact ? 20 : 24,
                          marginTop: 2,
                        }}
                      >
                        {checkbox}
                      </Pressable>
                    ) : (
                      <View
                        className="items-center justify-center"
                        style={{
                          width: compact ? 20 : 24,
                          height: compact ? 20 : 24,
                          marginTop: 2,
                        }}
                      >
                        {checkbox}
                      </View>
                    )}
                    <Text
                      testID={`markdown-task-text-${lineIndex}`}
                      className="flex-1 font-sans text-theme-foreground"
                      style={{
                        ...textStyle,
                        color: isTaskChecked ? themeColors.secondary : themeColors.foreground,
                        textDecorationLine: isTaskChecked ? 'line-through' : 'none',
                      }}
                    >
                      {renderInline(value, themeColors)}
                    </Text>
                  </View>
                );
              }
              return (
                <Text
                  key={lineIndex}
                  testID={heading ? `markdown-heading-${heading[1].length}` : 'markdown-body-text'}
                  className="font-sans text-theme-foreground"
                  style={{
                    ...textStyle,
                    borderLeftWidth: quote ? 2 : 0,
                    borderLeftColor: themeColors.strongBorder,
                    paddingLeft: quote ? 12 : list ? 20 : 0,
                  }}
                >
                  {orderedList ? `${orderedList[1]}. ` : unorderedList ? '• ' : null}
                  {renderInline(value, themeColors)}
                </Text>
              );
            })}
          </View>
        );
      })}
    </View>
  );

  if (!onEdit || onMarkdownChange) return content;

  return (
    <Pressable onPress={onEdit} accessibilityRole="button">
      {content}
    </Pressable>
  );
}
