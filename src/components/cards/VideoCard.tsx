import { useVideoPlayer, VideoView } from 'expo-video';
import { Play } from 'lucide-react-native';
import { memo, useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { translate } from '@/lib/i18n';

export const VideoCard = memo(function VideoCard({ uri, title }: { uri: string; title?: string }) {
  const player = useVideoPlayer(uri, (instance) => {
    instance.loop = false;
  });
  const [aspectRatio, setAspectRatio] = useState(16 / 9);
  const [isPlaying, setIsPlaying] = useState(player.playing);

  useEffect(() => {
    const updateAspectRatio = (size: { width: number; height: number } | null | undefined) => {
      if (size && size.width > 0 && size.height > 0) {
        setAspectRatio(size.width / size.height);
      }
    };

    updateAspectRatio(player.videoTrack?.size);
    setIsPlaying(player.playing);
    const subscription = player.addListener('videoTrackChange', ({ videoTrack }) => {
      updateAspectRatio(videoTrack?.size);
    });
    const playbackSubscription = player.addListener('playingChange', ({ isPlaying: playing }) => {
      setIsPlaying(playing);
    });

    return () => {
      subscription.remove();
      playbackSubscription.remove();
    };
  }, [player]);

  return (
    <View className="w-full">
      <View className="relative w-full overflow-hidden rounded-xl bg-theme-surface">
        <VideoView
          player={player}
          nativeControls
          contentFit="contain"
          style={{ width: '100%', aspectRatio }}
        />
        {!isPlaying && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={translate('Play video')}
            onPress={() => player.play()}
            className="absolute inset-0 bg-black/50 items-center justify-center"
          >
            <Play size={36} color="#FFFFFF" fill="#FFFFFF" />
          </Pressable>
        )}
      </View>
      {title ? (
        <Text
          className="font-sans-medium text-center text-xs text-theme-secondary leading-[1.6] mt-3"
          numberOfLines={2}
        >
          {title}
        </Text>
      ) : null}
    </View>
  );
});
