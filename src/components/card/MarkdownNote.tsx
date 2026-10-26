import { useAppTheme, type ThemeColors } from '@/lib/theme';
import { useMemo } from 'react';
import { Check } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

type MarkdownNoteProps = {
  markdown: string;
  onEdit?: () => void;
  onMarkdownChange?: (markdown: string) => void;
  compact?: boolean;
};

const HEADING_STYLES = (themeColors: ThemeColors) => [
  {
    fontSize: 34,
    lineHeight: 64,
    fontFamily: 'InstrumentSans_700Bold',
    color: themeColors.foreground,
  },
  {
    fontSize: 29,
    lineHeight: 48,
    fontFamily: 'InstrumentSans_700Bold',
    color: themeColors.foreground,
  },
  {
    fontSize: 25,
    lineHeight: 40,
    fontFamily: 'InstrumentSans_600SemiBold',
    color: themeColors.bright,
  },
  {
    fontSize: 22,
    lineHeight: 36,
    fontFamily: 'InstrumentSans_600SemiBold',
    color: themeColors.bright,
  },
  {
    fontSize: 20,
    lineHeight: 30,
    fontFamily: 'InstrumentSans_500Medium',
    color: themeColors.heading,
  },
  {
    fontSize: 18,
    lineHeight: 28,
    fontFamily: 'InstrumentSans_500Medium',
    color: themeColors.body,
  },
];

function renderInline(value: string, themeColors: ThemeColors) {
  const parts = value.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g);
  return parts.map((part, index) => {
    const bold = part.startsWith('**') && part.endsWith('**');
    const italic = !bold && part.startsWith('*') && part.endsWith('*');
    const code = part.startsWith('`') && part.endsWith('`');
    return (
      <Text
        key={index}
        style={[
          bold ? { fontWeight: '700' } : null,
          italic ? { fontStyle: 'italic' } : null,
          code ? { fontFamily: 'monospace', color: themeColors.blueSoft } : null,
        ]}
      >
        {bold || italic || code ? part.slice(bold ? 2 : 1, bold ? -2 : -1) : part}
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
    <View
      className="w-full gap-4"
      style={compact ? { maxHeight: 176, overflow: 'hidden' } : undefined}
    >
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
                  : (headingStyle?.fontSize ?? 18),
                lineHeight: compact
                  ? heading
                    ? Math.max(20, (headingStyle?.lineHeight ?? 32) - 10)
                    : 26
                  : (headingStyle?.lineHeight ?? 32),
                fontFamily: headingStyle?.fontFamily ?? 'InstrumentSans_400Regular',
                color: quote ? themeColors.secondary : (headingStyle?.color ?? themeColors.body),
              };
              if (taskList) {
                const checkbox = (
                  <View
                    className={`h-6 w-6 items-center justify-center rounded-md border-2 ${
                      isTaskChecked
                        ? 'border-theme-foreground bg-theme-foreground'
                        : 'border-theme-muted bg-transparent'
                    }`}
                  >
                    {isTaskChecked && (
                      <Check size={16} color={themeColors.inverse} strokeWidth={2.5} />
                    )}
                  </View>
                );
                return (
                  <View
                    key={lineIndex}
                    className="flex-row items-center gap-2 py-1"
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
                        className="h-6 w-6 items-center justify-center"
                      >
                        {checkbox}
                      </Pressable>
                    ) : (
                      <View className="h-6 w-6 items-center justify-center">{checkbox}</View>
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
