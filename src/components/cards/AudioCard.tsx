import { useAppTheme } from '@/lib/theme';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { Pause, Play } from 'lucide-react-native';
import { memo, useMemo, useState } from 'react';
import { Pressable, Text, View, type LayoutChangeEvent } from 'react-native';

import { Button } from '@/components/Button';
import { buildAudioWaveform } from '@/lib/library/audioWaveform';
import { LocalizedText } from '@/components/LocalizedText';
import { translate } from '@/lib/i18n';

function timeLabel(milliseconds: number) {
  const seconds = Math.floor(Math.max(0, milliseconds) / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

const PLAYBACK_RATES = [1, 1.25, 1.5, 1.75, 2, 0.5] as const;

export const AudioCard = memo(function AudioCard({
  uri,
  title,
  waveform,
  showPlaybackRate = false,
  compactWaveform = false,
  stackedControls = false,
}: {
  uri: string;
  title?: string;
  waveform?: number[];
  showPlaybackRate?: boolean;
  compactWaveform?: boolean;
  stackedControls?: boolean;
}) {
  const { colors: themeColors } = useAppTheme();
  const player = useAudioPlayer(uri);
  const status = useAudioPlayerStatus(player);
  const duration = status.duration || 0;
  const current = status.currentTime || 0;
  const [playbackRate, setPlaybackRate] = useState(player.playbackRate || 1);
  const [waveformWidth, setWaveformWidth] = useState(0);
  const displayWaveform = useMemo(
    () => (waveform && compactWaveform ? buildAudioWaveform(waveform, 24) : waveform),
    [waveform, compactWaveform]
  );
  const rateLabel = `${playbackRate}x`;
  const progress = duration > 0 ? Math.min(1, current / duration) : 0;
  const playedBars = displayWaveform ? Math.floor(progress * displayWaveform.length) : 0;

  const changePlaybackRate = () => {
    const currentIndex = PLAYBACK_RATES.findIndex((rate) => rate === playbackRate);
    const nextRate = PLAYBACK_RATES[(currentIndex + 1) % PLAYBACK_RATES.length];
    setPlaybackRate(nextRate);
    player.setPlaybackRate(nextRate);
  };

  const togglePlayback = () => {
    if (status.playing) {
      player.pause();
      return;
    }

    player.setPlaybackRate(playbackRate);
    if (current >= duration && duration > 0) player.seekTo(0);
    player.play();
  };

  const waveformControl = (
    <Pressable
      testID="audio-waveform"
      accessibilityRole="button"
      accessibilityLabel={translate('Seek audio')}
      onLayout={(event: LayoutChangeEvent) => setWaveformWidth(event.nativeEvent.layout.width)}
      onPress={(event) => {
        if (duration <= 0 || waveformWidth <= 0) return;
        const ratio = Math.max(0, Math.min(1, event.nativeEvent.locationX / waveformWidth));
        void player.seekTo(ratio * duration);
      }}
      className={`h-8 ${stackedControls ? 'w-full justify-center' : 'flex-1'} flex-row items-center ${displayWaveform ? 'gap-[2px]' : ''}`}
    >
      {displayWaveform?.length ? (
        displayWaveform.map((amplitude, index) => (
          <View
            key={index}
            pointerEvents="none"
            style={{
              flex: 1,
              height: Math.max(3, (amplitude / 100) * (stackedControls ? 40 : 26)),
              borderRadius: 2,
              backgroundColor:
                index < playedBars ? themeColors.foreground : themeColors.strongBorder,
            }}
          />
        ))
      ) : (
        <View
          pointerEvents="none"
          className="h-1 w-full overflow-hidden rounded-full bg-theme-border"
        >
          <View className="h-full bg-theme-foreground" style={{ width: `${progress * 100}%` }} />
        </View>
      )}
    </Pressable>
  );

  const playButton = (
    <View
      testID={stackedControls ? 'audio-playback-button-wrapper' : undefined}
      className="h-12 w-12 shrink-0 items-center justify-center"
    >
      <Button
        size="small"
        variant={status.playing ? 'primary' : 'secondary'}
        accessibilityLabel={status.playing ? 'Pause audio' : 'Play audio'}
        onPress={togglePlayback}
        icon={
          status.playing ? (
            <Pause size={16} color={themeColors.canvas} fill={themeColors.canvas} />
          ) : (
            <Play size={16} color={themeColors.foreground} fill={themeColors.foreground} />
          )
        }
      />
    </View>
  );

  const timeText = (
    <Text
      className={`font-sans ${compactWaveform ? 'text-xs' : 'text-sm'} text-theme-body ${stackedControls ? 'text-center' : ''}`}
    >
      {timeLabel(current * 1000)} <LocalizedText>/ </LocalizedText>
      {timeLabel(duration * 1000)}
    </Text>
  );

  const playbackRateControl = showPlaybackRate ? (
    <Pressable
      onPress={changePlaybackRate}
      accessibilityRole="button"
      accessibilityLabel={translate('Playback speed %{speed}', {
        speed: rateLabel,
      })}
      className="min-w-16 items-center rounded-full bg-theme-canvas/80 px-2 py-1 active:opacity-70"
    >
      <Text className="font-sans-semibold text-lg text-theme-heading">{rateLabel}</Text>
    </Pressable>
  ) : null;

  return (
    <View className="w-full">
      <View className={`rounded-xl bg-theme-surface ${stackedControls ? 'h-full p-3' : 'p-4'}`}>
        {stackedControls ? (
          <View
            testID="audio-stacked-controls"
            className="h-full items-center justify-center gap-2"
          >
            {waveformControl}
            {timeText}
            {playButton}
          </View>
        ) : (
          <View className={`flex-row items-center ${compactWaveform ? 'gap-3' : 'gap-5'}`}>
            {playButton}
            <View className="flex-1 gap-1.5">
              <View className="flex-row items-center gap-5">{waveformControl}</View>
              {timeText}
            </View>
            {playbackRateControl}
          </View>
        )}
      </View>
      {title && (
        <Text
          className="font-sans-medium text-center text-xs text-theme-secondary leading-[1.6] mt-2"
          numberOfLines={2}
        >
          {title}
        </Text>
      )}
    </View>
  );
});
