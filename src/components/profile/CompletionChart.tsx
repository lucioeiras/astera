import { useAppTheme } from '@/lib/theme';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { YoutubeLogoIcon } from 'phosphor-react-native';
import { Newspaper, BookOpen, Clapperboard, Tv, Gamepad2 } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { getRelatedCardTitle } from '@/lib/library/related';
import type { LibraryItem } from '@/lib/library/types';
import { LocalizedText } from '@/components/LocalizedText';
import { translate, useLocalization } from '@/lib/i18n';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** One cover per completion, arranged as a horizontal shelf for each month. */
export function CompletionChart({ months, year }: { months: LibraryItem[][]; year: number }) {
  const { language } = useLocalization();
  const locale = language === 'pt' ? 'pt-BR' : 'en-US';
  const total = months.reduce((sum, items) => sum + items.length, 0);
  return (
    <View className="mt-6">
      <Text className="mb-4 font-sans text-sm text-theme-secondary">
        {translate(
          total === 1 ? '1 card completed in %{year}' : '%{count} cards completed in %{year}',
          {
            count: total,
            year,
          }
        )}
      </Text>
      <View className="gap-2">
        {MONTHS.map((month, index) => {
          const items = months[index] ?? [];
          return (
            <View key={month} className="flex-row items-center gap-3">
              <Text
                accessibilityLabel={translate('%{month} %{year}: %{count} cards completed', {
                  month: new Date(year, index, 1).toLocaleDateString(locale, {
                    month: 'long',
                  }),
                  year,
                  count: items.length,
                })}
                className="w-8 font-sans-medium text-xs text-theme-muted"
              >
                {new Date(year, index, 1).toLocaleDateString(locale, {
                  month: 'short',
                })}
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="flex-1 rounded-xl bg-theme-surface/60"
                style={{ height: 80 }}
                contentContainerStyle={{
                  flexGrow: 1,
                  height: 80,
                  padding: 8,
                  gap: 4,
                  alignItems: 'center',
                }}
              >
                {items.map((item) => {
                  const artwork = getArtwork(item);
                  return (
                    <CompletionCover
                      key={`${item.id}:${artwork ?? ''}`}
                      item={item}
                      artwork={artwork}
                    />
                  );
                })}
              </ScrollView>
            </View>
          );
        })}
      </View>
      {total === 0 && (
        <Text className="mt-4 font-sans text-sm text-theme-muted">
          <LocalizedText>No completions recorded for this selection.</LocalizedText>
        </Text>
      )}
    </View>
  );
}

function getArtwork(item: LibraryItem): string | undefined {
  switch (item.type) {
    case 'book':
    case 'game':
      return item.cover;
    case 'movie':
    case 'tvshow':
      return item.poster;
    case 'article':
    case 'youtube':
      return item.thumbnail;
    default:
      return undefined;
  }
}

function CompletionCover({ item, artwork }: { item: LibraryItem; artwork?: string }) {
  const { colors: themeColors } = useAppTheme();
  const [failed, setFailed] = useState(false);
  const title = getRelatedCardTitle(item);
  const Icon =
    item.type === 'book'
      ? BookOpen
      : item.type === 'movie'
        ? Clapperboard
        : item.type === 'tvshow'
          ? Tv
          : item.type === 'game'
            ? Gamepad2
            : item.type === 'youtube'
              ? YoutubeLogoIcon
              : Newspaper;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={translate('Open %{title}', { title })}
      accessibilityHint={translate('View completed card details')}
      onPress={() => router.push({ pathname: '/card/[id]', params: { id: item.id } })}
      style={{ width: 44, height: 64 }}
      className="overflow-hidden rounded-sm bg-theme-raised active:opacity-70"
    >
      {artwork && !failed ? (
        <Image
          testID={`completion-cover-image-${item.id}`}
          source={{ uri: artwork }}
          contentFit="cover"
          style={{ width: '100%', height: '100%' }}
          recyclingKey={item.id}
          onError={() => setFailed(true)}
        />
      ) : (
        <View
          testID={`completion-cover-fallback-${item.id}`}
          className="flex-1 items-center justify-center gap-1 px-1"
        >
          <Icon size={20} color={themeColors.secondary} />
          <Text numberOfLines={2} className="text-center font-sans text-[9px] text-theme-secondary">
            {title}
          </Text>
        </View>
      )}
    </Pressable>
  );
}
