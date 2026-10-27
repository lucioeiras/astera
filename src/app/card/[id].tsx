import { useAppTheme } from '@/lib/theme';
import { BlurView } from 'expo-blur';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Keyboard,
  PanResponder,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CardDetailContent } from '@/components/card/CardDetailContent';
import { useLibrary } from '@/hooks/useLibrary';
import type { LibraryItemType } from '@/lib/library/types';

const SCREEN_HEIGHT = Dimensions.get('window').height;

export default function CardDetailScreen() {
  const { colors: themeColors, isDark } = useAppTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { state, selectTag, selectCardType, setSearchQuery, clearSearchTag } = useLibrary();

  const item = useMemo(() => {
    if (state.status !== 'ready') return null;
    return state.result.items.find((i) => i.id === id) ?? null;
  }, [state, id]);

  const [translateY] = useState(() => new Animated.Value(0));
  const [isDismissing, setIsDismissing] = useState(false);

  const dismissScreen = useCallback(() => {
    if (isDismissing) return;
    setIsDismissing(true);
    Animated.timing(translateY, {
      toValue: SCREEN_HEIGHT,
      duration: 220,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished) {
        setIsDismissing(false);
        return;
      }
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/board');
      }
    });
  }, [isDismissing, translateY]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) => {
          return gestureState.dy > 8 && Math.abs(gestureState.dx) < Math.abs(gestureState.dy);
        },
        onPanResponderMove: (_, gestureState) => {
          if (gestureState.dy > 0) {
            translateY.setValue(gestureState.dy);
          }
        },
        onPanResponderRelease: (_, gestureState) => {
          if (gestureState.dy > 120 || gestureState.vy > 0.6) {
            dismissScreen();
          } else {
            Animated.spring(translateY, {
              toValue: 0,
              bounciness: 4,
              useNativeDriver: true,
            }).start();
          }
        },
      }),
    [translateY, dismissScreen]
  );

  const handleSelectTag = useCallback(
    (tag: string) => {
      if (isDismissing) return;
      setIsDismissing(true);
      selectTag(tag);
      Animated.timing(translateY, {
        toValue: SCREEN_HEIGHT,
        duration: 200,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (!finished) {
          setIsDismissing(false);
          return;
        }
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace('/board');
        }
      });
    },
    [isDismissing, translateY, selectTag]
  );

  const handleSelectType = useCallback(
    (type: LibraryItemType, label: string) => {
      if (isDismissing) return;
      setIsDismissing(true);
      selectCardType(type, label);
      Animated.timing(translateY, {
        toValue: SCREEN_HEIGHT,
        duration: 200,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (!finished) {
          setIsDismissing(false);
          return;
        }
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace('/board');
        }
      });
    },
    [isDismissing, translateY, selectCardType]
  );

  const handleSelectFolder = useCallback(
    (name: string) => {
      if (isDismissing) return;
      setIsDismissing(true);
      setSearchQuery('');
      clearSearchTag();
      Animated.timing(translateY, {
        toValue: SCREEN_HEIGHT,
        duration: 200,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (!finished) {
          setIsDismissing(false);
          return;
        }
        router.replace({
          pathname: '/board',
          params: { folderKind: 'tag', folderKey: name },
        });
      });
    },
    [isDismissing, translateY, setSearchQuery, clearSearchTag]
  );

  if (!item) {
    return (
      <View className="flex-1 bg-black/70 items-center justify-center">
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    );
  }

  return (
    <View style={StyleSheet.absoluteFill} className="flex-1">
      {/* Background Blur + Dark Layer */}
      <BlurView intensity={64} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: themeColors.canvas + (item?.type === 'note' ? 'E6' : '66') },
        ]}
      />

      <Animated.View
        style={[
          styles.animatedContainer,
          {
            paddingTop: Math.max(insets.top, 12),
            transform: [{ translateY }],
          },
        ]}
      >
        {/* Swipe Down Drag Handle Area */}
        <Pressable
          onPress={() => Keyboard.dismiss()}
          {...panResponder.panHandlers}
          className="w-full items-center py-2"
        >
          <View className="w-12 h-1.5 rounded-full bg-theme-muted/70 active:bg-theme-body" />
        </Pressable>

        <CardDetailContent
          key={item.id}
          item={item}
          onDismiss={dismissScreen}
          onSelectTag={handleSelectTag}
          onSelectFolder={handleSelectFolder}
          onSelectType={handleSelectType}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  animatedContainer: {
    flex: 1,
    width: '100%',
  },
});
