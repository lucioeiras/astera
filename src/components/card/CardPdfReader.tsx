import { ThemedModal as Modal } from '@/components/ThemedModal';
import { useAppTheme } from '@/lib/theme';
import { X } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { PdfPreview } from '@/components/PdfPreview';
import type { LibraryItem } from '@/lib/library/types';
import { translate, useLocalization } from '@/lib/i18n';

type PdfItem = Extract<LibraryItem, { type: 'pdf' }>;

export function CardPdfReader({
  item,
  visible,
  onClose,
  topInset,
}: {
  item: PdfItem;
  visible: boolean;
  onClose: () => void;
  topInset: number;
}) {
  const { colors: themeColors } = useAppTheme();
  useLocalization();
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-theme-canvas" style={{ paddingTop: topInset }}>
        <View className="h-14 flex-row items-center px-4 border-b border-theme-raised">
          <Pressable
            onPress={onClose}
            hitSlop={12}
            className="w-10 h-10 items-center justify-center"
            accessibilityRole="button"
            accessibilityLabel={translate('Close PDF')}
          >
            <X size={22} color={themeColors.foreground} />
          </Pressable>
          <Text
            className="flex-1 font-sans-medium text-base text-theme-foreground text-center"
            numberOfLines={1}
          >
            {item.originalFileName || item.title || translate('PDF Document')}
          </Text>
          <View className="w-10" />
        </View>
        <View className="flex-1">
          <PdfPreview uri={item.pdf} fullReader />
        </View>
      </View>
    </Modal>
  );
}
