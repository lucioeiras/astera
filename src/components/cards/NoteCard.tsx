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

export const NoteCard = ({ text, title, linkedItem, onMarkdownChange }: NoteProps) => {
  return (
    <View className="w-full items-center">
      <View className="w-full bg-theme-surface/80 rounded-xl">
        <View className="p-5">
          <MarkdownNote markdown={text} compact onMarkdownChange={onMarkdownChange} />
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
