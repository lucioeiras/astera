import { useAppTheme } from '@/lib/theme';
import { colorWithAlpha } from '@/lib/theme/palette';
import { BlurView } from 'expo-blur';
import {
  ReactElement,
  ReactNode,
  cloneElement,
  createContext,
  isValidElement,
  useContext,
} from 'react';
import { Pressable, Text, View } from 'react-native';

export const ButtonSizeContext = createContext<'default' | 'small'>('default');

type ButtonProps = {
  accessibilityLabel: string;
  icon?: ReactNode;
  text?: string;
  onPress: () => void;
  disabled?: boolean;
  size?: 'default' | 'small';
  variant?: 'primary' | 'secondary';
  backgroundColor?: string;
  contentColor?: string;
  shadowColor?: string;
  shadowOpacity?: number;
  accessibilityRole?: 'button' | 'tab';
  selected?: boolean;
  iconSize?: number;
  textWeight?: 'medium' | 'semibold';
  compact?: boolean;
};

/** Rounded floating action with optional icon and text. */
export function Button({
  accessibilityLabel,
  icon,
  text,
  onPress,
  disabled = false,
  size,
  variant = 'secondary',
  backgroundColor,
  contentColor,
  shadowColor,
  shadowOpacity = 0,
  accessibilityRole = 'button',
  selected,
  iconSize,
  textWeight = 'semibold',
  compact = false,
}: ButtonProps) {
  const { colors: themeColors, isDark } = useAppTheme();
  const inheritedSize = useContext(ButtonSizeContext);
  const foreground =
    contentColor ?? (variant === 'primary' ? themeColors.canvas : themeColors.foreground);
  const isSmall = (size ?? inheritedSize) === 'small';
  const iconElement = isValidElement<{ size?: number; color?: string }>(icon) ? icon : undefined;
  const normalizedIcon =
    iconElement && 'size' in iconElement.props
      ? cloneElement(iconElement as ReactElement<{ size?: number; color?: string }>, {
          size: iconSize ?? (isSmall ? 20 : 24),
          color: foreground,
        })
      : icon;

  return (
    <View
      className="rounded-full"
      style={{
        flexGrow: 0,
        flexShrink: 0,
        flexBasis: 'auto',
        shadowColor: shadowColor ?? themeColors.foreground,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity,
        shadowRadius: 8,
        elevation: 6,
      }}
    >
      <Pressable
        onPress={onPress}
        disabled={disabled}
        className={`flex-row items-center justify-center overflow-hidden rounded-full active:opacity-80 disabled:opacity-50 ${isSmall ? (compact ? 'gap-1.5' : 'gap-2') : 'gap-3'} ${text ? (isSmall ? (compact ? 'px-3 py-2' : 'px-4 py-3') : 'px-6 py-4') : isSmall ? 'p-3' : 'p-4'} ${variant === 'secondary' && 'border border-theme-raised'}`}
        style={
          variant === 'primary'
            ? { backgroundColor: backgroundColor ?? themeColors.foreground }
            : undefined
        }
        accessibilityRole={accessibilityRole}
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{
          disabled,
          ...(selected === undefined ? {} : { selected }),
        }}
      >
        {variant === 'secondary' && (
          <>
            <BlurView
              intensity={48}
              tint={isDark ? 'dark' : 'light'}
              pointerEvents="none"
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                bottom: 0,
                left: 0,
              }}
            />
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                bottom: 0,
                left: 0,
                borderRadius: 999,
                backgroundColor: colorWithAlpha(themeColors.canvas, '33'),
              }}
            />
          </>
        )}
        {normalizedIcon}
        {text ? (
          <Text
            numberOfLines={1}
            style={{ color: foreground }}
            className={`font-sans-${textWeight} ${isSmall ? 'text-sm' : 'text-lg'}`}
          >
            {text}
          </Text>
        ) : null}
      </Pressable>
    </View>
  );
}
