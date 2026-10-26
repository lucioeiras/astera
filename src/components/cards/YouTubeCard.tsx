import { decodeHTML } from 'entities';
import { Image as ExpoImage } from 'expo-image';
import { cssInterop } from 'nativewind';
import { YoutubeLogoIcon } from 'phosphor-react-native';
import { Play } from 'lucide-react-native';
import { Text, View } from 'react-native';

import type { YouTubeItem } from '@/lib/library/types';

import { ProgressStatus } from './ProgressStatus';
import { LocalizedText } from '@/components/LocalizedText';

cssInterop(ExpoImage, { className: 'style' });

type YouTubeCardProps = {
  videoTitle: string;
  thumbnail: string;
  progressStatus?: YouTubeItem['progressStatus'];
  compactHeight?: number;
};

export const YouTubeCard = ({
  videoTitle,
  thumbnail,
  progressStatus,
  compactHeight,
}: YouTubeCardProps) => {
  const compact = compactHeight !== undefined;

  return (
    <View
      testID="youtube-card-base"
      className="w-full rounded-xl bg-theme-canvas"
      style={compact ? { height: compactHeight } : undefined}
    >
      <View
        testID="youtube-thumbnail-container"
        className="relative w-full rounded-t-xl overflow-hidden"
        style={compact ? { height: compactHeight / 2 } : { aspectRatio: 16 / 9 }}
      >
        <ExpoImage source={{ uri: thumbnail }} className="w-full h-full" contentFit="cover" />
        <View className="absolute inset-0 bg-black/50 items-center justify-center">
          <Play size={compact ? 24 : 36} color="#FFFFFF" fill="#FFFFFF" />
        </View>
      </View>

      <View
        testID={compact ? 'pinned-title-container' : 'youtube-title-container'}
        className={`w-full bg-theme-pink/10 rounded-b-xl ${compact ? 'justify-center px-3' : 'p-5 gap-3'}`}
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
          {decodeHTML(videoTitle)}
        </Text>

        {!compact && (
          <>
            <ProgressStatus type="youtube" status={progressStatus} align="start" />
            <View className="flex-row items-center gap-2 mt-2">
              <YoutubeLogoIcon size={14} color="#F43F5E" weight="fill" />
              <Text className="font-sans-semibold text-sm text-theme-pink">
                <LocalizedText>YouTube</LocalizedText>
              </Text>
            </View>
          </>
        )}
      </View>
    </View>
  );
};
