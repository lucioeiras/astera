import { useAppTheme, type ThemeColors } from '@/lib/theme';
import { Bookmark, CircleCheck, Clock, Ban } from 'lucide-react-native';
import { Text, View } from 'react-native';

import type { LibraryItem, MediaProgressStatus } from '@/lib/library/types';
import { translate, useLocalization } from '@/lib/i18n';

type TrackableItemType = Extract<LibraryItem, { progressStatus?: MediaProgressStatus }>['type'];

const labels = {
  book: {
    want: 'Want to read',
    'in-progress': 'Reading',
    completed: 'Read',
    abandoned: 'Abandoned',
  },
  movie: {
    want: 'Want to watch',
    'in-progress': 'Watching',
    completed: 'Watched',
    abandoned: 'Abandoned',
  },
  tvshow: {
    want: 'Want to watch',
    'in-progress': 'Watching',
    completed: 'Watched',
    abandoned: 'Abandoned',
  },
  game: {
    want: 'Want to play',
    'in-progress': 'Playing',
    completed: 'Played',
    abandoned: 'Abandoned',
  },
  article: {
    want: 'Want to read',
    'in-progress': 'Reading',
    completed: 'Read',
    abandoned: 'Abandoned',
  },
  youtube: {
    want: 'Want to watch',
    'in-progress': 'Watching',
    completed: 'Watched',
    abandoned: 'Abandoned',
  },
} as const;

const icons = {
  want: Bookmark,
  'in-progress': Clock,
  completed: CircleCheck,
  abandoned: Ban,
} as const;

const colors = (themeColors: ThemeColors) =>
  ({
    want: themeColors.blueSoft,
    'in-progress': themeColors.yellow,
    completed: themeColors.green,
    abandoned: themeColors.secondary,
  }) as const;

export function getProgressLabel(type: TrackableItemType, status: MediaProgressStatus): string {
  return translate(labels[type][status]);
}

export function ProgressStatus({
  type,
  status = 'want',
  align = 'center',
}: {
  type: TrackableItemType;
  status?: MediaProgressStatus;
  align?: 'center' | 'start';
}) {
  const { colors: themeColors } = useAppTheme();
  useLocalization();
  const currentStatus =
    (type === 'article' || type === 'youtube') && status === 'abandoned' ? 'want' : status;
  const Icon = icons[currentStatus];
  const color = colors(themeColors)[currentStatus];

  return (
    <View className={`flex-row items-center gap-1.5 ${align === 'center' ? 'justify-center' : ''}`}>
      <Icon size={13} color={color} strokeWidth={2.5} />
      <Text className="font-sans-medium text-xs text-center" style={{ color }} numberOfLines={1}>
        {getProgressLabel(type, currentStatus)}
      </Text>
    </View>
  );
}
