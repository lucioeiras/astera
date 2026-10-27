import { useState } from 'react';
import { Text, View } from 'react-native';

import { MarkdownNote } from '@/components/card/MarkdownNote';
import { SourcePreview } from '@/components/SourcePreview';
import type { LinkableItem } from '@/lib/library/links';

type NoteProps = {
  text: string;
  title?: string;
  linkedItem?: LinkableItem;
  onMarkdownChange?: (markdown: string) => void;
};

const MAX_TEXT_HEIGHT = 312;

export const NoteCard = ({ text, title, linkedItem, onMarkdownChange }: NoteProps) => {
  const [isTextClipped, setIsTextClipped] = useState(false);

  return (
    <View className="w-full items-center">
      <View className="w-full bg-theme-surface/80 rounded-xl overflow-hidden">
        <View
          testID="note-card-text-container"
          className="px-5 pt-5"
          style={{ paddingBottom: isTextClipped ? 0 : 20 }}
        >
          <View
            testID="note-card-text-viewport"
            style={{ maxHeight: MAX_TEXT_HEIGHT, overflow: 'hidden' }}
          >
            <View
              testID="note-card-text-measurement"
              style={{ flexShrink: 0 }}
              onLayout={({ nativeEvent }) =>
                setIsTextClipped(nativeEvent.layout.height > MAX_TEXT_HEIGHT)
              }
            >
              <MarkdownNote markdown={text} compact onMarkdownChange={onMarkdownChange} />
            </View>
          </View>
        </View>

        {linkedItem && (
          <SourcePreview
            item={linkedItem}
            compact
            containerClassName="px-5 py-4 bg-theme-raised/50 gap-4 rounded-b-xl"
          />
        )}
      </View>

      {title && (
        <Text
          className="font-sans-medium text-xs text-theme-secondary leading-[1.6] text-center mt-3"
          numberOfLines={2}
        >
          {title}
        </Text>
      )}
    </View>
  );
};
