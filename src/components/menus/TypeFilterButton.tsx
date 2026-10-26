import { YoutubeLogoIcon } from 'phosphor-react-native';
import type { ComponentType } from 'react';
import { useAppTheme } from '@/lib/theme';
import { Pressable, Text } from 'react-native';

export function TypeFilterButton({
  label,
  icon: Icon,
  selected,
  onPress,
}: {
  label: string;
  icon: ComponentType<{ size?: number; color?: string }>;
  selected: boolean;
  onPress: () => void;
}) {
  const { colors: themeColors } = useAppTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      className={`flex-row items-center gap-1.5 rounded-full border px-4 py-2 ${selected ? 'border-theme-foreground bg-theme-foreground' : 'border-theme-border'}`}
    >
      <Icon
        size={16}
        color={selected ? themeColors.inverse : themeColors.secondary}
        {...(Icon === YoutubeLogoIcon ? { weight: 'bold' as const } : { strokeWidth: 2.5 })}
      />
      <Text
        className={`font-sans-medium text-sm ${selected ? 'text-theme-inverse' : 'text-theme-body'}`}
      >
        {label}
      </Text>
    </Pressable>
  );
}
