import { ThemedModal as Modal } from '@/components/ThemedModal';
import { translate, useLocalization } from '@/lib/i18n';
import { Image as ExpoImage } from 'expo-image';
import { X } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const AnimatedExpoImage = Animated.createAnimatedComponent(ExpoImage);

type ImageSourceRect = { x: number; y: number; width: number; height: number };

export function ImageViewerModal({
  uri,
  visible,
  sourceRect,
  onClose,
}: {
  uri: string;
  visible: boolean;
  sourceRect: ImageSourceRect | null;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  useLocalization();
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const hasLoadedRef = useRef(false);
  const hasStartedRef = useRef(false);
  const scale = useSharedValue(1);
  const pinchStartScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const panStartX = useSharedValue(0);
  const panStartY = useSharedValue(0);
  const left = useSharedValue(sourceRect?.x ?? 0);
  const top = useSharedValue(sourceRect?.y ?? 0);
  const width = useSharedValue(sourceRect?.width ?? 0);
  const height = useSharedValue(sourceRect?.height ?? 0);
  const backdropOpacity = useSharedValue(0);

  const animateIntoView = () => {
    if (!sourceRect || !viewport.width || !viewport.height || hasStartedRef.current) return;
    hasStartedRef.current = true;
    const fitScale = Math.min(
      viewport.width / sourceRect.width,
      viewport.height / sourceRect.height
    );
    const targetWidth = sourceRect.width * fitScale;
    const targetHeight = sourceRect.height * fitScale;
    const config = { duration: 340, easing: Easing.out(Easing.cubic) };

    left.value = withTiming((viewport.width - targetWidth) / 2, config);
    top.value = withTiming((viewport.height - targetHeight) / 2, config);
    width.value = withTiming(targetWidth, config);
    height.value = withTiming(targetHeight, config);
    backdropOpacity.value = withTiming(1, config);
  };

  const handleImageLoad = () => {
    hasLoadedRef.current = true;
    setIsImageLoaded(true);
    animateIntoView();
  };

  const handleLayout = (event: { nativeEvent: { layout: { width: number; height: number } } }) => {
    const nextViewport = event.nativeEvent.layout;
    setViewport(nextViewport);
    if (hasLoadedRef.current && !hasStartedRef.current && sourceRect) {
      const fitScale = Math.min(
        nextViewport.width / sourceRect.width,
        nextViewport.height / sourceRect.height
      );
      hasStartedRef.current = true;
      const targetWidth = sourceRect.width * fitScale;
      const targetHeight = sourceRect.height * fitScale;
      const config = { duration: 340, easing: Easing.out(Easing.cubic) };
      left.value = withTiming((nextViewport.width - targetWidth) / 2, config);
      top.value = withTiming((nextViewport.height - targetHeight) / 2, config);
      width.value = withTiming(targetWidth, config);
      height.value = withTiming(targetHeight, config);
      backdropOpacity.value = withTiming(1, config);
    }
  };

  const closeViewer = () => {
    if (!sourceRect || !hasStartedRef.current) {
      onClose();
      return;
    }
    const config = { duration: 240, easing: Easing.in(Easing.cubic) };
    left.value = withTiming(sourceRect.x, config);
    top.value = withTiming(sourceRect.y, config);
    width.value = withTiming(sourceRect.width, config);
    height.value = withTiming(sourceRect.height, config, (finished) => {
      if (finished) runOnJS(onClose)();
    });
    scale.value = withTiming(1, config);
    translateX.value = withTiming(0, config);
    translateY.value = withTiming(0, config);
    backdropOpacity.value = withTiming(0, config);
  };

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
    position: 'absolute',
    left: left.value,
    top: top.value,
    width: width.value,
    height: height.value,
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));
  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdropOpacity.value }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={closeViewer}
    >
      <View className="flex-1" onLayout={handleLayout}>
        <Animated.View
          pointerEvents="none"
          className="absolute inset-0 bg-black"
          style={backdropStyle}
        />
        <GestureDetector gesture={gesture}>
          <View className="flex-1">
            <AnimatedExpoImage
              source={{ uri }}
              contentFit="contain"
              accessibilityRole="image"
              accessibilityLabel={translate('Image preview')}
              onLoad={handleImageLoad}
              onError={handleImageLoad}
              style={imageStyle}
            />
          </View>
        </GestureDetector>
        {isImageLoaded && (
          <Pressable
            onPress={closeViewer}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={translate('Close image')}
            className="absolute right-4 h-11 w-11 items-center justify-center rounded-full bg-black/60"
            style={{ top: insets.top + 12 }}
          >
            <X size={24} color="#FFFFFF" />
          </Pressable>
        )}
      </View>
    </Modal>
  );
}
