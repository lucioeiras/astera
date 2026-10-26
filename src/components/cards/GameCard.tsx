import { useAppTheme } from '@/lib/theme';
import { decodeHTML } from 'entities';
import { Image as ExpoImage } from 'expo-image';
import { cssInterop } from 'nativewind';
import { Gamepad2 } from 'lucide-react-native';
import { Text, View } from 'react-native';

import type { MediaProgressStatus } from '@/lib/library/types';

import { ProgressStatus } from './ProgressStatus';

cssInterop(ExpoImage, { className: 'style' });

type GameCardProps = {
  title: string;
  cover: string;
  hideTitleAndAuthor?: boolean;
  progressStatus?: MediaProgressStatus;
};

export const GameCard = ({
  title,
  cover,
  hideTitleAndAuthor = false,
  progressStatus,
}: GameCardProps) => {
  const { colors: themeColors } = useAppTheme();
  return (
    <View className="w-full">
      <View
        testID="game-cover-container"
        className="w-full overflow-hidden rounded-xl bg-theme-surface"
        style={{ aspectRatio: 1 }}
      >
        {cover ? (
          <ExpoImage source={{ uri: cover }} className="w-full h-full" contentFit="cover" />
        ) : (
          <View className="flex-1 items-center justify-center">
            <Gamepad2 size={44} color={themeColors.muted} strokeWidth={2} />
          </View>
        )}
      </View>

      {!hideTitleAndAuthor && (
        <View className="w-full my-3 gap-2">
          <Text
            className="font-sans-semibold text-sm leading-snug text-theme-foreground text-center"
            numberOfLines={2}
          >
            {decodeHTML(title)}
          </Text>
          <ProgressStatus type="game" status={progressStatus} />
        </View>
      )}
    </View>
  );
};
