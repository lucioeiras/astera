import { Pressable, View } from 'react-native';

import { ItemCard } from '@/components/cards/ItemCard';
import { getRelatedCardTitle } from '@/lib/library/related';
import type { LibraryItem } from '@/lib/library/types';

type Props = {
  item: LibraryItem;
  selected?: boolean;
  disabled?: boolean;
  onPress: () => void;
};

/** The entire preview has one action, including cards with interactive media. */
export function RelatedCardTile({ item, selected, disabled = false, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole={selected === undefined ? 'button' : 'checkbox'}
      accessibilityLabel={getRelatedCardTitle(item)}
      accessibilityState={{
        disabled,
        ...(selected === undefined ? {} : { checked: selected }),
      }}
      style={{ paddingHorizontal: 8, paddingBottom: 16, width: '100%' }}
    >
      <View
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <ItemCard
          item={item}
          compactAudioWaveform
          isEditing={selected !== undefined}
          isSelected={selected}
        />
      </View>
    </Pressable>
  );
}
