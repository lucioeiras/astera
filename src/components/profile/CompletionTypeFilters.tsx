import { YoutubeLogoIcon } from 'phosphor-react-native';
import { Newspaper, BookOpen, Clapperboard, Gamepad2 } from 'lucide-react-native';
import { ScrollView } from 'react-native';
import { TypeFilterButton } from '@/components/menus/TypeFilterButton';
import { CARD_TYPE_LABELS, TRACKABLE_TYPES, type TrackableType } from '@/lib/library/activity';
import { translate, useLocalization } from '@/lib/i18n';

const ICONS = {
  book: BookOpen,
  movie: Clapperboard,
  tvshow: Clapperboard,
  game: Gamepad2,
  article: Newspaper,
  youtube: YoutubeLogoIcon,
};

export function CompletionTypeFilters({
  selectedType,
  onSelect,
}: {
  selectedType: TrackableType | null;
  onSelect: (type: TrackableType | null) => void;
}) {
  useLocalization();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="always"
      accessibilityLabel={translate('Filter completed cards by type')}
      className="min-w-0 flex-1"
      contentContainerClassName="items-center gap-2 pr-8 py-1"
    >
      {TRACKABLE_TYPES.map((type) => (
        <TypeFilterButton
          key={type}
          label={translate(CARD_TYPE_LABELS[type])}
          icon={ICONS[type]}
          selected={selectedType === type}
          onPress={() => onSelect(selectedType === type ? null : type)}
        />
      ))}
    </ScrollView>
  );
}
