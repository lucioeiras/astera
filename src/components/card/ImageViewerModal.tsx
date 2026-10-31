import { ThemedModal as Modal } from '@/components/ThemedModal';
import { translate, useLocalization } from '@/lib/i18n';
import { useAppTheme } from '@/lib/theme';
import { Image as ExpoImage } from 'expo-image';
import { X } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const AnimatedExpoImage = Animated.createAnimatedComponent(ExpoImage);

export function ImageViewerModal({
  uri,
  visible,
  onClose,
}: {
  uri: string;
  visible: boolean;
  onClose: () => void;
}) {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  useLocalization();
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const scale = useSharedValue(1);
  const pinchStartScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const panStartX = useSharedValue(0);
  const panStartY = useSharedValue(0);

  const pinch = Gesture.Pinch()
    .onStart(() => {
      pinchStartScale.value = scale.value;
    })
    .onUpdate((event) => {
      scale.value = Math.max(1, Math.min(pinchStartScale.value * event.scale, 5));
      if (scale.value === 1) {
        translateX.value = 0;
        translateY.value = 0;
      }
    });

  const pan = Gesture.Pan()
    .onStart(() => {
      panStartX.value = translateX.value;
      panStartY.value = translateY.value;
    })
    .onUpdate((event) => {
      if (scale.value <= 1) return;
      const maxX = (viewport.width * (scale.value - 1)) / 2;
      const maxY = (viewport.height * (scale.value - 1)) / 2;
      translateX.value = Math.max(-maxX, Math.min(maxX, panStartX.value + event.translationX));
      translateY.value = Math.max(-maxY, Math.min(maxY, panStartY.value + event.translationY));
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd((_, success) => {
      if (!success) return;
      if (scale.value > 1) {
        scale.value = 1;
        translateX.value = 0;
        translateY.value = 0;
      } else {
        scale.value = 2.5;
      }
    });

  const gesture = Gesture.Simultaneous(pinch, pan, doubleTap);
  const imageStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 bg-black" onLayout={(event) => setViewport(event.nativeEvent.layout)}>
        <GestureDetector gesture={gesture}>
          <Animated.View className="flex-1 items-center justify-center">
            <AnimatedExpoImage
              source={{ uri }}
              contentFit="contain"
              accessibilityRole="image"
              accessibilityLabel={translate('Image preview')}
              style={[{ width: '100%', height: '100%' }, imageStyle]}
            />
          </Animated.View>
        </GestureDetector>
        <Pressable
          onPress={onClose}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={translate('Close image')}
          className="absolute right-4 h-11 w-11 items-center justify-center rounded-full bg-black/60"
          style={{ top: insets.top + 12 }}
        >
          <X size={24} color={colors.foreground} />
        </Pressable>
      </View>
    </Modal>
  );
}
