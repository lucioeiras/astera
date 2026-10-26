import { useAppTheme } from '@/lib/theme';
import { FolderPlusIcon, PushPinSimpleIcon, TrashSimpleIcon, XIcon } from 'phosphor-react-native';
import { Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { LocalizedText } from '@/components/LocalizedText';
import { translate, useLocalization } from '@/lib/i18n';

type CardSelectionBarProps = {
  visible: boolean;
  selectedCount: number;
  bottomOffset?: number;
  onDelete: () => void;
  onAddToFolder: () => void;
  pinActionLabel?: string;
  onTogglePin?: () => void;
  onCancel: () => void;
};

export function CardSelectionBar({
  visible,
  selectedCount,
  bottomOffset = 0,
  onDelete,
  onAddToFolder,
  pinActionLabel,
  onTogglePin,
  onCancel,
}: CardSelectionBarProps) {
  const { colors: themeColors } = useAppTheme();
  useLocalization();
  if (!visible) return null;

  const hasSelection = selectedCount > 0;

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        right: 0,
        bottom: bottomOffset,
        left: 0,
        alignItems: 'center',
      }}
    >
      <View className="items-center gap-3">
        <View className="flex-row items-center gap-2">
          <Button
            accessibilityLabel={translate('Cancel selection')}
            variant="secondary"
            icon={<XIcon size={24} color={themeColors.foreground} weight="bold" />}
            onPress={onCancel}
          />
          <Button
            accessibilityLabel={translate('Add selected cards to folder')}
            variant="secondary"
            contentColor={themeColors.foreground}
            icon={<FolderPlusIcon size={24} color={themeColors.foreground} weight="bold" />}
            disabled={!hasSelection}
            onPress={onAddToFolder}
          />
          {pinActionLabel && onTogglePin && (
            <Button
              accessibilityLabel={pinActionLabel}
              variant="secondary"
              contentColor={themeColors.foreground}
              icon={<PushPinSimpleIcon size={24} color={themeColors.foreground} weight="bold" />}
              disabled={!hasSelection}
              onPress={onTogglePin}
            />
          )}
          <Button
            accessibilityLabel={translate('Delete selected cards')}
            variant="secondary"
            shadowColor="#EF4444"
            shadowOpacity={hasSelection ? 0.2 : 0}
            icon={
              <TrashSimpleIcon
                size={24}
                color={hasSelection ? '#EF4444' : themeColors.secondary}
                weight="bold"
              />
            }
            disabled={!hasSelection}
            onPress={onDelete}
          />
        </View>

        <Text className="font-sans-medium text-base text-theme-foreground">
          {hasSelection ? (
            <>
              <Text className="text-theme-foreground font-sans-bold">
                {selectedCount}
                {'  '}
              </Text>
              <Text className="text-theme-secondary font-sans-semibold">
                {' '}
                <LocalizedText>selected</LocalizedText>
              </Text>
            </>
          ) : (
            <Text className="text-theme-secondary">
              <LocalizedText>Select cards</LocalizedText>
            </Text>
          )}
        </Text>
      </View>
    </View>
  );
}
