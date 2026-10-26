import { useMemo } from 'react';
import { useAppTheme, type ThemeColors } from '@/lib/theme';
import { decodeHTML } from 'entities';
import { Image as ExpoImage } from 'expo-image';
import { Disc } from 'lucide-react-native';
import { useState } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { VinylRecord } from '../effects/VinylRecord';

type MusicCardProps = {
  title: string;
  artist: string;
  cover: string;
  hideTitleAndAuthor?: boolean;
  subtleVinylShadow?: boolean;
};

export const MusicCard = ({
  title,
  artist,
  cover,
  hideTitleAndAuthor = false,
  subtleVinylShadow = false,
}: MusicCardProps) => {
  const { colors: themeColors } = useAppTheme();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);
  const [containerWidth, setContainerWidth] = useState(() =>
    Math.round((Dimensions.get('window').width - 32) / 2)
  );

  const sleeveSize = Math.max(100, Math.round(containerWidth * 0.78));
  const discSize = Math.max(90, Math.round(sleeveSize * 0.94));
  const discLeft = Math.max(0, containerWidth - discSize);
  const discTop = Math.round((sleeveSize - discSize) / 2);

  return (
    <View className="w-full items-center">
      {/* Vinyl Peek Container (Album jacket on left, vinyl sliding out to the right) */}
      <View
        testID="music-showcase-container"
        onLayout={(e) => {
          const w = e.nativeEvent.layout.width;
          if (w > 0 && Math.abs(w - containerWidth) > 2) {
            setContainerWidth(w);
          }
        }}
        style={[styles.showcaseContainer, { height: sleeveSize }]}
      >
        {/* Vinyl Record (Layered behind jacket, emerging to the right) */}
        <View
          testID="music-vinyl-wrapper"
          style={[
            styles.discWrapper,
            {
              left: discLeft,
              top: discTop,
            },
          ]}
        >
          <VinylRecord
            size={discSize}
            coverUri={cover}
            style={subtleVinylShadow ? styles.subtleVinylShadow : undefined}
          />
        </View>

        {/* Album Jacket Sleeve (Layered in front on the left) */}
        <View
          testID="music-album-sleeve"
          style={[
            styles.sleeve,
            {
              width: sleeveSize,
              height: sleeveSize,
              left: 0,
              top: 0,
            },
          ]}
        >
          {cover ? (
            <ExpoImage
              source={{ uri: cover }}
              style={styles.coverImage}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <View style={styles.fallbackCover}>
              <Disc size={40} color={themeColors.muted} strokeWidth={2} />
            </View>
          )}

          {/* Right edge sleeve slit opening indicator */}
          <View style={styles.sleeveOpeningEdge} />
        </View>
      </View>

      {!hideTitleAndAuthor && (
        <View className="w-full gap-1.5 my-3">
          <Text
            className="font-sans-medium text-sm leading-snug text-theme-foreground text-center"
            numberOfLines={2}
          >
            {decodeHTML(title)}
          </Text>

          <Text className="font-sans text-xs text-theme-secondary text-center" numberOfLines={1}>
            {decodeHTML(artist)}
          </Text>
        </View>
      )}
    </View>
  );
};

const createStyles = (themeColors: ThemeColors) =>
  StyleSheet.create({
    subtleVinylShadow: {
      shadowColor: '#71717a',
      shadowOffset: { width: 1, height: 2 },
      shadowOpacity: 0.55,
      shadowRadius: 4,
      elevation: 8,
    },
    showcaseContainer: {
      width: '100%',
      position: 'relative',
      backgroundColor: 'transparent',
      overflow: 'visible',
    },
    discWrapper: {
      position: 'absolute',
      zIndex: 1,
    },
    sleeve: {
      position: 'absolute',
      zIndex: 2,
      borderRadius: 6,
      overflow: 'hidden',
      backgroundColor: themeColors.surface,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.08)',
      shadowColor: '#000000',
      shadowOffset: { width: 5, height: 2 },
      shadowOpacity: 0.55,
      shadowRadius: 6,
      elevation: 6,
    },
    coverImage: {
      width: '100%',
      height: '100%',
      borderRadius: 5,
    },
    fallbackCover: {
      width: '100%',
      height: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: themeColors.raised,
    },
    sleeveOpeningEdge: {
      position: 'absolute',
      right: 0,
      top: 0,
      bottom: 0,
      width: 3,
      backgroundColor: 'rgba(0, 0, 0, 0.35)',
    },
  });
