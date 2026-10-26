import {
  ArticleIcon,
  BookOpenIcon,
  FilePdfIcon,
  FilmSlateIcon,
  GameControllerIcon,
  ImageIcon,
  LinkIcon,
  MusicNotesIcon,
  NotePencilIcon,
  QuotesIcon,
  RedditLogoIcon,
  TiktokLogoIcon,
  TwitterLogoIcon,
  VideoCameraIcon,
  WaveformIcon,
  YoutubeLogoIcon,
} from 'phosphor-react-native';
import { ScrollView } from 'react-native';

import { Button } from '@/components/Button';
import { CARD_TYPE_LABELS } from '@/lib/library/activity';
import { ITEM_TYPES, type LibraryItemType } from '@/lib/library/types';
import { translate, useLocalization } from '@/lib/i18n';

const CARD_TYPE_ICONS = {
  note: NotePencilIcon,
  quote: QuotesIcon,
  image: ImageIcon,
  pdf: FilePdfIcon,
  video: VideoCameraIcon,
  audio: WaveformIcon,
  link: LinkIcon,
  article: ArticleIcon,
  youtube: YoutubeLogoIcon,
  tiktok: TiktokLogoIcon,
  tweet: TwitterLogoIcon,
  reddit: RedditLogoIcon,
  book: BookOpenIcon,
  music: MusicNotesIcon,
  movie: FilmSlateIcon,
  tvshow: FilmSlateIcon,
  game: GameControllerIcon,
} satisfies Record<LibraryItemType, typeof NotePencilIcon>;

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
            icon={<Icon size={20} weight="bold" />}
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
