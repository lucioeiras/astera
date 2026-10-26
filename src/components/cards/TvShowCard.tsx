import { useAppTheme } from '@/lib/theme';
import { decodeHTML } from 'entities';
import { Image as ExpoImage } from 'expo-image';
import { cssInterop } from 'nativewind';
import { useState } from 'react';
import { Text, View } from 'react-native';

import type { MediaProgressStatus } from '@/lib/library/types';

import { ProgressStatus } from './ProgressStatus';

cssInterop(ExpoImage, { className: 'style' });

type TvShowCardProps = {
  title: string;
  poster: string;
  progressStatus?: MediaProgressStatus;
  hideTitleAndAuthor?: boolean;
  onAspectRatioChange?: (ratio: number) => void;
};

export function TvShowCard({
  title,
  poster,
  progressStatus,
  hideTitleAndAuthor = false,
  onAspectRatioChange,
}: TvShowCardProps) {
  const { colors: themeColors } = useAppTheme();
  const [aspectRatio, setAspectRatio] = useState(2 / 3);
  const cleanTitle = title ? decodeHTML(title) : 'Untitled TV Show';

  return (
    <View className="w-full overflow-hidden">
      <View className="w-full relative overflow-hidden rounded-md">
        <ExpoImage
          source={{ uri: poster }}
          accessibilityLabel={`${cleanTitle} poster`}
          className="w-full bg-theme-surface rounded-md"
          style={{
            width: '100%',
            aspectRatio,
            backgroundColor: themeColors.surface,
          }}
          contentFit="cover"
          transition={200}
          onLoad={(event) => {
            if (event.source.width && event.source.height) {
              const ratio = event.source.width / event.source.height;
              setAspectRatio(ratio);
              onAspectRatioChange?.(ratio);
            }
          }}
        />
      </View>

      {!hideTitleAndAuthor && (
        <View className="w-full gap-1.5 my-3 items-center">
          <Text
            className="flex-1 font-sans-medium text-sm leading-[1.3] text-theme-foreground text-center"
            numberOfLines={2}
          >
            {cleanTitle}
          </Text>
          <ProgressStatus type="tvshow" status={progressStatus} />
        </View>
      )}
    </View>
  );
}
