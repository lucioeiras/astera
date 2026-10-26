import type { ComponentType } from 'react';
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
} from 'lucide-react-native';
import { ScrollView } from 'react-native';

import { Button } from '@/components/Button';
import { CARD_TYPE_LABELS } from '@/lib/library/activity';
import { ITEM_TYPES, type LibraryItemType } from '@/lib/library/types';
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
}: {
  selectedType: LibraryItemType | null;
  onSelect: (type: LibraryItemType) => void;
}) {
  useLocalization();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerClassName="items-center gap-2 px-3 pt-3"
      keyboardShouldPersistTaps="always"
      accessibilityLabel={translate('Filter cards by type')}
    >
      {ITEM_TYPES.map((type) => {
        const Icon = CARD_TYPE_ICONS[type];
        return (
          <Button
            key={type}
            accessibilityLabel={translate(CARD_TYPE_LABELS[type])}
            text={translate(CARD_TYPE_LABELS[type])}
            icon={
              <Icon
                size={20}
                {...(['youtube', 'tiktok', 'tweet', 'reddit'].includes(type)
                  ? { weight: 'bold' as const }
                  : { strokeWidth: 2.5 })}
              />
            }
            size="small"
            variant={selectedType === type ? 'primary' : 'secondary'}
            selected={selectedType === type}
            onPress={() => onSelect(type)}
          />
        );
      })}
    </ScrollView>
  );
}
