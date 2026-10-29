import { useEffect, useRef, type ComponentType, type MutableRefObject } from 'react';
import {
  RedditLogoIcon,
  TiktokLogoIcon,
  TwitterLogoIcon,
  YoutubeLogoIcon,
} from 'phosphor-react-native';
import {
  Newspaper,
  BookOpen,
  FileText,
  Clapperboard,
  Gamepad2,
  ImageIcon,
  LinkIcon,
  Music2,
  SquarePen,
  Quote,
  Video,
  AudioLines,
  Archive,
  Bookmark,
  CircleCheck,
  Clock,
} from 'lucide-react-native';
import { ScrollView, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';

import { Button } from '@/components/Button';
import { useAppTheme } from '@/lib/theme';
import { CARD_TYPE_LABELS } from '@/lib/library/activity';
import { ITEM_TYPES, type LibraryItemType, type MediaProgressStatus } from '@/lib/library/types';
import { translate, useLocalization } from '@/lib/i18n';

const CARD_TYPE_ICONS = {
  note: SquarePen,
  quote: Quote,
  image: ImageIcon,
  pdf: FileText,
  video: Video,
  audio: AudioLines,
  link: LinkIcon,
  article: Newspaper,
  youtube: YoutubeLogoIcon,
  tiktok: TiktokLogoIcon,
  tweet: TwitterLogoIcon,
  reddit: RedditLogoIcon,
  book: BookOpen,
  music: Music2,
  movie: Clapperboard,
  tvshow: Clapperboard,
  game: Gamepad2,
} satisfies Record<LibraryItemType, ComponentType<{ size?: number; color?: string }>>;

export function BoardTypeFilters({
  selectedType,
  onSelect,
  selectedStatus,
  onSelectStatus,
  showArchived,
  onToggleArchived,
  scrollOffsetRef,
}: {
  selectedType: LibraryItemType | null;
  onSelect: (type: LibraryItemType) => void;
  selectedStatus: MediaProgressStatus | null;
  onSelectStatus: (status: MediaProgressStatus) => void;
  showArchived: boolean;
  onToggleArchived: () => void;
  scrollOffsetRef: MutableRefObject<number>;
}) {
  const scrollRef = useRef<ScrollView>(null);
  const { colors: themeColors } = useAppTheme();
  useLocalization();
  useEffect(() => {
    if (scrollOffsetRef.current > 0) {
      requestAnimationFrame(() =>
        scrollRef.current?.scrollTo({ x: scrollOffsetRef.current, y: 0, animated: false })
      );
    }
  }, [scrollOffsetRef]);

  const rememberScrollOffset = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollOffsetRef.current = event.nativeEvent.contentOffset.x;
  };

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      onScroll={rememberScrollOffset}
      scrollEventThrottle={16}
      showsHorizontalScrollIndicator={false}
      contentContainerClassName="items-center gap-2 px-3 pt-3"
      keyboardShouldPersistTaps="always"
      accessibilityLabel={translate('Filter cards by type')}
    >
      {(
        [
          ['want', 'Want to', Bookmark, themeColors.blueSoft],
          ['in-progress', 'In progress', Clock, themeColors.yellow],
          ['completed', 'Done', CircleCheck, themeColors.green],
        ] as const
      ).map(([status, label, Icon, statusColor]) => {
        const selected = selectedStatus === status;
        return (
          <Button
            key={status}
            accessibilityLabel={translate(label)}
            text={translate(label)}
            icon={<Icon size={20} strokeWidth={2} />}
            size="small"
            compact
            iconSize={16}
            textWeight={selected ? 'semibold' : 'medium'}
            variant={selected ? 'primary' : 'secondary'}
            backgroundColor={statusColor}
            contentColor={selected ? themeColors.inverse : undefined}
            selected={selected}
            onPress={() => onSelectStatus(status)}
          />
        );
      })}
      <Button
        accessibilityLabel={translate('Show archived cards')}
        text={translate('Archived')}
        icon={<Archive size={20} strokeWidth={2} />}
        size="small"
        compact
        iconSize={16}
        textWeight={showArchived ? 'semibold' : 'medium'}
        variant={showArchived ? 'primary' : 'secondary'}
        selected={showArchived}
        onPress={onToggleArchived}
      />
      {ITEM_TYPES.map((type) => {
        const Icon = CARD_TYPE_ICONS[type];
        const selected = selectedType === type;
        return (
          <Button
            key={type}
            accessibilityLabel={translate(CARD_TYPE_LABELS[type])}
            text={translate(CARD_TYPE_LABELS[type])}
            icon={
              <Icon
                size={20}
                {...(['youtube', 'tiktok', 'tweet', 'reddit'].includes(type)
                  ? { weight: 'regular' as const }
                  : { strokeWidth: 2 })}
              />
            }
            size="small"
            compact
            iconSize={16}
            textWeight={selected ? 'semibold' : 'medium'}
            variant={selected ? 'primary' : 'secondary'}
            selected={selected}
            onPress={() => onSelect(type)}
          />
        );
      })}
    </ScrollView>
  );
}
