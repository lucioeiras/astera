import { useMemo } from 'react';
import { useAppTheme, type ThemeColors } from '@/lib/theme';
import { decodeHTML } from 'entities';
import { Image as ExpoImage } from 'expo-image';
import { cssInterop } from 'nativewind';
import { memo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { MediaProgressStatus } from '@/lib/library/types';

import { ProgressStatus } from './ProgressStatus';

cssInterop(ExpoImage, { className: 'style' });

type MovieCardProps = {
  title: string;
  hideTitleAndAuthor?: boolean;
  poster: string;
  releaseYear?: string;
  voteAverage?: number;
  genres?: string[];
  runtime?: number;
  progressStatus?: MediaProgressStatus;
  onAspectRatioChange?: (ratio: number) => void;
};

type FilmPerforationsProps = {
  height: number;
};

const FilmPerforations = memo(function FilmPerforations({ height }: FilmPerforationsProps) {
  const { colors: themeColors } = useAppTheme();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);
  const effectiveHeight = height > 0 ? height : 240;
  const paddingY = 8;
  const usableHeight = Math.max(0, effectiveHeight - paddingY * 2);
  const pitch = 20;
  const count = Math.max(2, Math.floor(usableHeight / pitch));

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.perforationsOverlay]}>
      <View style={{ height: usableHeight }} className="justify-between items-center">
        {Array.from({ length: count }).map((_, i) => (
          <View key={`left-${i}`} style={styles.sprocketHole} />
        ))}
      </View>
      <View style={{ height: usableHeight }} className="justify-between items-center">
        {Array.from({ length: count }).map((_, i) => (
          <View key={`right-${i}`} style={styles.sprocketHole} />
        ))}
      </View>
    </View>
  );
});

export const MovieCard = ({
  title,
  hideTitleAndAuthor = false,
  poster,
  releaseYear,
  genres,
  runtime,
  progressStatus,
  onAspectRatioChange,
}: MovieCardProps) => {
  const [aspectRatio, setAspectRatio] = useState(2 / 3);
  const [posterHeight, setPosterHeight] = useState(0);

  const cleanTitle = title ? decodeHTML(title) : 'Untitled Movie';
  const genreText =
    genres && genres.length > 0 ? genres.slice(0, 2).map(decodeHTML).join(', ') : undefined;

  const metaParts: string[] = [];
  if (releaseYear) metaParts.push(releaseYear);
  if (runtime) metaParts.push(`${runtime} min`);
  if (!releaseYear && !runtime && genreText) metaParts.push(genreText);

  return (
    <View className="w-full overflow-hidden">
      <View
        className="w-full relative overflow-hidden"
        onLayout={(e) => {
          const h = e.nativeEvent.layout.height;
          if (h > 0) {
            setPosterHeight(h);
          }
        }}
      >
        <ExpoImage
          source={{ uri: poster }}
          className="w-full bg-theme-surface rounded-md"
          style={{ aspectRatio }}
          contentFit="cover"
          transition={200}
          onLoad={(e) => {
            if (e.source.width && e.source.height) {
              setAspectRatio(e.source.width / e.source.height);
              onAspectRatioChange?.(e.source.width / e.source.height);
            }
          }}
        />

        {/* Film Strip Sprocket Perforations */}
        <FilmPerforations height={posterHeight} />
      </View>

      {!hideTitleAndAuthor && (
        <View className="w-full gap-1.5 my-3 items-center">
          <Text
            className="flex-1 font-sans-medium text-sm leading-[1.3] text-theme-foreground text-center"
            numberOfLines={2}
          >
            {cleanTitle}
          </Text>

          <ProgressStatus type="movie" status={progressStatus} />
        </View>
      )}
    </View>
  );
};

const createStyles = (themeColors: ThemeColors) =>
  StyleSheet.create({
    perforationsOverlay: {
      paddingVertical: 8,
      paddingHorizontal: 8,
      flexDirection: 'row',
      justifyContent: 'space-between',
      zIndex: 10,
    },
    sprocketHole: {
      width: 6,
      height: 8.5,
      borderRadius: 2,
      backgroundColor: themeColors.canvas,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: 'rgba(255, 255, 255, 0.12)',
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.35,
      shadowRadius: 1,
      elevation: 2,
    },
  });
