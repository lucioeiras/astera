import { YoutubeLogoIcon } from 'phosphor-react-native';
import { Newspaper, BookOpen, Clapperboard, Gamepad2, Tv, LayoutGrid } from 'lucide-react-native';
import { ScrollView } from 'react-native';
import { Button } from '@/components/Button';
import { CARD_TYPE_LABELS, TRACKABLE_TYPES, type TrackableType } from '@/lib/library/activity';
import { translate, useLocalization } from '@/lib/i18n';

const ICONS = {
  book: BookOpen,
  movie: Clapperboard,
  tvshow: Tv,
  game: Gamepad2,
  article: Newspaper,
  youtube: YoutubeLogoIcon,
};

export function CompletionTypeFilters({
  selectedType,
  onSelect,
  iconOnly = false,
}: {
  iconOnly?: boolean;
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
      contentContainerClassName="items-center gap-2 pr-8 pl-1"
    >
      <Button
        accessibilityLabel={translate('All')}
        text={iconOnly ? undefined : translate('All')}
        icon={<LayoutGrid size={20} strokeWidth={2} />}
        size="small"
        compact
        iconSize={16}
        textWeight={selectedType === null ? 'semibold' : 'medium'}
        variant={selectedType === null ? 'primary' : 'secondary'}
        selected={selectedType === null}
        onPress={() => onSelect(null)}
      />
      {TRACKABLE_TYPES.map((type) => {
        const Icon = ICONS[type];
        const selected = selectedType === type;
        return (
          <Button
            key={type}
            accessibilityLabel={translate(CARD_TYPE_LABELS[type])}
            text={iconOnly ? undefined : translate(CARD_TYPE_LABELS[type])}
            icon={
              <Icon
                size={20}
                {...(type === 'youtube' ? { weight: 'regular' as const } : { strokeWidth: 2 })}
              />
            }
            size="small"
            compact
            iconSize={16}
            textWeight={selected ? 'semibold' : 'medium'}
            variant={selected ? 'primary' : 'secondary'}
            selected={selected}
            onPress={() => onSelect(selected ? null : type)}
          />
        );
      })}
    </ScrollView>
  );
}
