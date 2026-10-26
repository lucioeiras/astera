import { useAppTheme } from '@/lib/theme';
import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { getRelatedItems } from '@/lib/library/related';
import type { LibraryItem } from '@/lib/library/types';
import { Share2 } from 'lucide-react-native';
import { RelatedCardTile } from './RelatedCardTile';
import { LocalizedText } from '@/components/LocalizedText';

export function RelatedCardsSection({ item, items }: { item: LibraryItem; items: LibraryItem[] }) {
  const { colors: themeColors } = useAppTheme();
  const related = getRelatedItems(item, items);
  if (!related.length) return null;

  return (
    <View className="py-6 border-t border-theme-raised gap-6" testID="related-cards-section">
      <View className="flex-row items-center gap-2 px-6">
        <Share2 size={16} color={themeColors.heading} />
        <Text className="font-sans-semibold text-sm tracking-wider uppercase text-theme-heading">
          <LocalizedText>Related cards (</LocalizedText>
          {related.length}
          <LocalizedText>)</LocalizedText>
        </Text>
      </View>

      <View className="flex-row px-2">
        {[0, 1].map((column) => (
          <View key={column} className="flex-1">
            {related
              .filter((_, index) => index % 2 === column)
              .map((card) => (
                <RelatedCardTile
                  key={card.id}
                  item={card}
                  onPress={() =>
                    router.push({
                      pathname: '/card/[id]',
                      params: { id: card.id },
                    })
                  }
                />
              ))}
          </View>
        ))}
      </View>
    </View>
  );
}
