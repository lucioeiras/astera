import { Button } from '@/components/Button';
import { translate, useLocalization } from '@/lib/i18n';
import {
  CARD_TYPE_LABELS,
  getCompletionTimeline,
  parseDayKey,
  type TrackableType,
} from '@/lib/library/activity';
import { getRelatedCardTitle } from '@/lib/library/related';
import type { LibraryItem } from '@/lib/library/types';
import { useAppTheme } from '@/lib/theme';
import { router } from 'expo-router';
import { Star } from 'lucide-react-native';
import { Fragment, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { CompletionCover, getArtwork } from './CompletionChart';
import { CompletionTypeFilters } from './CompletionTypeFilters';

export function CompletionTimeline({ items }: { items: LibraryItem[] }) {
  const { language } = useLocalization();
  const locale = language === 'pt' ? 'pt-BR' : 'en-US';
  const [type, setType] = useState<TrackableType | null>(null);
  const [limit, setLimit] = useState(30);
  const entries = useMemo(() => getCompletionTimeline(items, type), [items, type]);
  const visible = entries.slice(0, limit);
  return (
    <View className="border-t border-theme-raised py-6">
      <Text className="px-8 font-sans-semibold text-sm uppercase tracking-wider text-theme-heading">
        {translate('Completion history')}
      </Text>
      <View className="my-4 pl-7">
        <CompletionTypeFilters
          iconOnly
          selectedType={type}
          onSelect={(next) => {
            setType(next);
            setLimit(30);
          }}
        />
      </View>
      <View className="px-8">
        {visible.map((entry, index) => {
          const title = getRelatedCardTitle(entry.item);
          const month = entry.day?.slice(0, 7) ?? null;
          const previousMonth = visible[index - 1]?.day?.slice(0, 7) ?? null;
          return (
            <Fragment key={entry.id}>
              {(index === 0 || previousMonth !== month) && (
                <Text className="mb-3 mt-4 font-sans-semibold text-sm text-theme-secondary">
                  {entry.day
                    ? parseDayKey(entry.day)!.toLocaleDateString(locale, {
                        month: 'long',
                        year: 'numeric',
                      })
                    : translate('Undated')}
                </Text>
              )}
              <View testID={`timeline-entry-${entry.id}`} className="flex-row gap-4 py-4">
                <View
                  accessibilityLabel={
                    entry.day
                      ? parseDayKey(entry.day)!.toLocaleDateString(locale)
                      : translate('Undated')
                  }
                  className="h-10 w-10 items-center justify-center rounded-full bg-theme-surface"
                >
                  <Text className="font-sans-medium text-base text-theme-strongBorder">
                    {entry.day ? parseDayKey(entry.day)!.getDate() : '—'}
                  </Text>
                </View>
                <CompletionCover item={entry.item} artwork={getArtwork(entry.item)} />
                <View className="min-w-0 flex-1 gap-2">
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={translate('Open %{title}', { title })}
                    onPress={() =>
                      router.push({ pathname: '/card/[id]', params: { id: entry.item.id } })
                    }
                  >
                    <Text className="font-sans-semibold text-base text-theme-foreground">
                      {title}
                    </Text>
                    {entry.seasonNumber !== undefined && (
                      <Text className="font-sans text-sm text-theme-secondary">
                        {translate('Season %{number}', { number: entry.seasonNumber })}
                        {entry.seasonName ? ` · ${entry.seasonName}` : ''}
                      </Text>
                    )}
                  </Pressable>
                  <Text className="font-sans text-xs text-theme-muted">
                    {translate(CARD_TYPE_LABELS[entry.item.type])}
                  </Text>
                  {entry.rating !== undefined && <ReviewStars rating={entry.rating} />}
                  {!!entry.comments?.trim() && (
                    <Text className="font-sans text-base leading-relaxed text-theme-body">
                      {entry.comments}
                    </Text>
                  )}
                </View>
              </View>
            </Fragment>
          );
        })}
        {entries.length === 0 && (
          <Text className="font-sans text-sm text-theme-muted">
            {translate('No completions recorded for this selection.')}
          </Text>
        )}
        {entries.length > limit && (
          <Button
            text={translate('Show more')}
            accessibilityLabel={translate('Show more')}
            onPress={() => setLimit((value) => value + 30)}
          />
        )}
      </View>
    </View>
  );
}

function ReviewStars({ rating }: { rating: number }) {
  const { colors } = useAppTheme();
  const count = Math.max(5, Math.min(7, Math.ceil(rating)));
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={translate('%{rating} out of %{count} stars', { rating, count })}
      className="flex-row gap-0.5"
    >
      {Array.from({ length: count }, (_, index) => {
        const width = Math.max(0, Math.min(1, rating - index)) * 16;
        return (
          <View
            key={index}
            style={{ width: 16, height: 16 }}
            importantForAccessibility="no-hide-descendants"
            accessibilityElementsHidden
          >
            <Star size={16} color={colors.strongBorder} strokeWidth={1.5} />
            {width > 0 && (
              <View style={{ position: 'absolute', width, height: 16, overflow: 'hidden' }}>
                <Star
                  size={16}
                  color={colors.foreground}
                  fill={colors.foreground}
                  strokeWidth={1.5}
                />
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}
