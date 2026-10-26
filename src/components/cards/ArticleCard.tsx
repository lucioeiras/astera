import { decodeHTML } from 'entities';
import { Image as ExpoImage } from 'expo-image';
import { cssInterop } from 'nativewind';
import { Text, View } from 'react-native';

import type { ArticleItem } from '@/lib/library/types';

import { ProgressStatus } from './ProgressStatus';

cssInterop(ExpoImage, { className: 'style' });

type ArticleCardProps = {
  articleTitle: string;
  thumbnail: string;
  origin: string;
  progressStatus?: ArticleItem['progressStatus'];
  compactHeight?: number;
};

export const ArticleCard = ({
  articleTitle,
  thumbnail,
  origin,
  progressStatus,
  compactHeight,
}: ArticleCardProps) => {
  const compact = compactHeight !== undefined;

  return (
    <View className="w-full" style={compact ? { height: compactHeight } : undefined}>
      <ExpoImage
        testID="article-thumbnail"
        source={{ uri: thumbnail }}
        className="w-full h-40 rounded-t-xl"
        style={compact ? { height: compactHeight / 2 } : undefined}
      />

      <View
        testID={compact ? 'pinned-title-container' : undefined}
        className={`w-full bg-theme-surface/80 rounded-b-xl ${compact ? 'justify-center px-3' : 'p-5 gap-3'}`}
        style={compact ? { height: compactHeight / 2 } : undefined}
      >
        <Text
          className={
            compact
              ? 'font-sans-medium text-lg leading-6 text-theme-foreground'
              : 'font-sans-medium text-lg leading-[1.6] text-theme-foreground'
          }
          numberOfLines={compact ? 2 : 3}
        >
          {decodeHTML(articleTitle)}
        </Text>

        {!compact && (
          <>
            <View className="flex-row items-center gap-2 mt-1 mb-2">
              <Text className="font-sans-semibold text-sm text-theme-secondary" numberOfLines={1}>
                {decodeHTML(origin)}
              </Text>
            </View>
            <ProgressStatus type="article" status={progressStatus} align="start" />
          </>
        )}
      </View>
    </View>
  );
};
