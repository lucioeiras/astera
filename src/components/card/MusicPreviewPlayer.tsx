import { useAppTheme } from '@/lib/theme';
import { useVideoPlayer } from 'expo-video';
import { PauseIcon, PlayIcon } from 'phosphor-react-native';
import { useEffect, useState } from 'react';
import { Pressable, Text } from 'react-native';
import { translate, useLocalization } from '@/lib/i18n';

export function MusicPreviewPlayer({
  previewUrl,
  onPlayingChange,
  playerRef,
}: {
  previewUrl: string;
  onPlayingChange?: (isPlaying: boolean) => void;
  playerRef?: React.MutableRefObject<{
    play: () => void;
    pause: () => void;
    playing: boolean;
  } | null>;
}) {
  const { colors: themeColors } = useAppTheme();
  useLocalization();
  const [isPlaying, setIsPlaying] = useState(false);
  const player = useVideoPlayer(previewUrl, (p) => {
    p.loop = false;
  });

  useEffect(() => {
    if (playerRef) {
      playerRef.current = player;
    }
    return () => {
      if (playerRef) {
        playerRef.current = null;
      }
    };
  }, [player, playerRef]);

  useEffect(() => {
    const sub = player.addListener('playingChange', (event) => {
      setIsPlaying(event.isPlaying);
      onPlayingChange?.(event.isPlaying);
    });
    return () => {
      sub.remove();
      onPlayingChange?.(false);
    };
  }, [player, onPlayingChange]);

  const togglePlay = () => {
    if (player.playing) {
      player.pause();
    } else {
      player.play();
    }
  };

  return (
    <Pressable
      onPress={togglePlay}
      className="flex-row items-center gap-2.5 px-5 py-2.5 rounded-full bg-rose-600/20 border border-rose-500/40 active:opacity-80 mt-3"
    >
      {isPlaying ? (
        <PauseIcon size={16} color={themeColors.pink} weight="fill" />
      ) : (
        <PlayIcon size={16} color={themeColors.pink} weight="fill" />
      )}
      <Text className="font-sans-medium text-sm text-theme-pink">
        {translate(isPlaying ? 'Pause preview' : 'Play 30s preview')}
      </Text>
    </Pressable>
  );
}
