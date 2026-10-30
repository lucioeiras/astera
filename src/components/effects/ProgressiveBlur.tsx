import { useAppTheme } from '@/lib/theme';
import { colorWithAlpha } from '@/lib/theme/palette';
import MaskedView from '@react-native-masked-view/masked-view';
import { BlurView, type BlurTint } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactElement } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ProgressiveBlurProps = {
  /**
   * Height of the progressive blur overlay in points.
   * @default 160
   */
  height?: number;
  /**
   * Blur intensity (1 to 100).
   * @default 100
   */
  intensity?: number;
  /**
   * Blur tint.
   * @default Current theme
   */
  tint?: BlurTint;
  /**
   * Maximum opacity of the theme gradient layer at the bottom (0 to 1).
   * Increases contrast and readability of tab bar items over bright content.
   * @default 0.85
   */
  darkLayerOpacity?: number;
  /**
   * Whether to add safe area bottom inset to the height.
   * @default true
   */
  includeBottomInset?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function ProgressiveBlur({
  height = 160,
  intensity = 100,
  tint,
  darkLayerOpacity = 0.85,
  includeBottomInset = true,
  style,
}: ProgressiveBlurProps): ReactElement {
  const { colors, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();
  const totalHeight = height + (includeBottomInset ? insets.bottom : 0);
  const maxDarkOpacity = Math.min(Math.max(darkLayerOpacity, 0), 1);

  return (
    <View
      pointerEvents="none"
      aria-hidden={true}
      style={[styles.container, { height: totalHeight }, style]}
    >
      <MaskedView
        style={StyleSheet.absoluteFill}
        maskElement={
          <LinearGradient
            colors={[
              'rgba(0, 0, 0, 0)',
              'rgba(0, 0, 0, 0.05)',
              'rgba(0, 0, 0, 0.4)',
              'rgba(0, 0, 0, 0.6)',
              'rgba(0, 0, 0, 0.8)',
              'rgba(0, 0, 0, 1)',
            ]}
            locations={[0, 0.2, 0.4, 0.6, 0.8, 1]}
            style={StyleSheet.absoluteFill}
          />
        }
      >
        <BlurView
          intensity={intensity}
          tint={tint ?? (isDark ? 'dark' : 'light')}
          style={StyleSheet.absoluteFill}
        />
      </MaskedView>

      {maxDarkOpacity > 0 && (
        <LinearGradient
          colors={[
            colorWithAlpha(colors.canvas, '00'),
            colorWithAlpha(
              colors.canvas,
              Math.round(maxDarkOpacity * 0.4 * 255)
                .toString(16)
                .padStart(2, '0')
            ),
            colorWithAlpha(
              colors.canvas,
              Math.round(maxDarkOpacity * 0.6 * 255)
                .toString(16)
                .padStart(2, '0')
            ),
            colorWithAlpha(
              colors.canvas,
              Math.round(maxDarkOpacity * 0.8 * 255)
                .toString(16)
                .padStart(2, '0')
            ),
            colorWithAlpha(
              colors.canvas,
              Math.round(maxDarkOpacity * 255)
                .toString(16)
                .padStart(2, '0')
            ),
          ]}
          locations={[0, 0.35, 0.65, 0.85, 1]}
          style={StyleSheet.absoluteFill}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
    zIndex: 10,
  },
});
