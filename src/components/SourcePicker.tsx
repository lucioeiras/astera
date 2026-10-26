import { ThemedModal as Modal } from '@/components/ThemedModal';
import { useAppTheme } from '@/lib/theme';
import { FlashList, type ListRenderItemInfo } from '@shopify/flash-list';
import { Search, X } from 'lucide-react-native';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { ItemCard } from '@/components/cards/ItemCard';
import {
  getLinkableTitle,
  getLinkableTypeLabel,
  isLinkableItem,
  type LinkableItem,
} from '@/lib/library/links';
import type { LibraryItem } from '@/lib/library/types';
import { ActionFooter } from './ActionFooter';
import { ProgressiveBlur } from './effects/ProgressiveBlur';
import { LocalizedText } from '@/components/LocalizedText';
import { translate, useLocalization } from '@/lib/i18n';

type Props = {
  visible: boolean;
  items: LibraryItem[];
  selectedId?: string;
  onSelect: (id: string) => void;
  onClose: () => void;
};

export function SourcePicker({ visible, items, selectedId, onSelect, onClose }: Props) {
  const { colors: themeColors } = useAppTheme();
  useLocalization();
  const [query, setQuery] = useState('');
  const inputRef = useRef<TextInput>(null);
  const insets = useSafeAreaInsets();
  const matches = useMemo(() => {
    const search = query.trim().toLocaleLowerCase();
    return items
      .filter(isLinkableItem)
      .filter((item) =>
        `${getLinkableTitle(item)} ${getLinkableTypeLabel(item)}`
          .toLocaleLowerCase()
          .includes(search)
      );
  }, [items, query]);

  const choose = useCallback(
    (id: string) => {
      onSelect(id);
      setQuery('');
      onClose();
    },
    [onSelect, onClose]
  );

  const handleClear = () => {
    setQuery('');
    inputRef.current?.focus();
  };

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<LinkableItem>) => (
      <View style={styles.cardWrapper}>
        <ItemCard item={item} isSelected={selectedId === item.id} onPress={() => choose(item.id)} />
      </View>
    ),
    [selectedId, choose]
  );

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-theme-canvas" style={{ paddingTop: insets.top + 16 }}>
        {/* Header */}
        <View className="flex-row items-center justify-between px-6 mb-5">
          <Text className="font-sans-semibold text-2xl text-theme-foreground">
            <LocalizedText>Select source</LocalizedText>
          </Text>
        </View>

        {/* Search Bar */}
        <View className="flex-row items-center gap-4 border-t border-b border-theme-raised px-6 mb-4 py-5">
          <Search size={20} color={themeColors.heading} />
          <TextInput
            ref={inputRef}
            value={query}
            onChangeText={setQuery}
            placeholder={translate('Search your library')}
            placeholderTextColor={themeColors.muted}
            className="flex-1 font-sans text-xl text-theme-foreground leading-tight"
            autoCorrect={false}
            autoCapitalize="none"
            clearButtonMode="never"
          />
          {query.length > 0 && (
            <Pressable
              onPress={handleClear}
              hitSlop={10}
              className="p-1.5 rounded-full bg-theme-raised items-center justify-center active:opacity-70"
              accessibilityLabel={translate('Clear search')}
            >
              <X size={12} color={themeColors.heading} strokeWidth={2.5} />
            </Pressable>
          )}
        </View>

        {/* Grid */}
        <FlashList<LinkableItem>
          data={matches}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          numColumns={2}
          masonry
          optimizeItemArrangement
          extraData={selectedId}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.contentContainer}
          ListEmptyComponent={
            <Text className="font-sans text-sm text-theme-muted text-center">
              {translate(query.trim() ? 'No matching content' : 'No content available to link')}
            </Text>
          }
        />

        <ProgressiveBlur
          height={190}
          intensity={55}
          darkLayerOpacity={0.75}
          includeBottomInset={false}
        />

        <ActionFooter bottomInset={insets.bottom} overlay>
          <View className="items-center gap-3">
            <View className="flex-row items-center gap-2">
              <Button
                accessibilityLabel={translate('Cancel related cards')}
                icon={<X size={24} color={themeColors.foreground} strokeWidth={2.5} />}
                onPress={onClose}
                text={translate('Cancel')}
              />
            </View>
          </View>
        </ActionFooter>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    paddingHorizontal: 4,
    paddingTop: 8,
    paddingBottom: 120,
  },
  cardWrapper: {
    width: '100%',
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingBottom: 16,
  },
});
