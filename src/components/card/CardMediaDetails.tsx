import { useAppTheme } from '@/lib/theme';
import { decodeHTML } from 'entities';
import { Image as ExpoImage } from 'expo-image';
import { FilmSlateIcon, GameControllerIcon, UsersThreeIcon } from 'phosphor-react-native';
import { ScrollView, Text, View } from 'react-native';

import { cleanRawgDescription } from '@/lib/games/rawg';
import type { LibraryItem } from '@/lib/library/types';
import { getProfileUrl } from '@/lib/movies/tmdb';
import { LocalizedText } from '@/components/LocalizedText';

export function CardMediaDetails({ item }: { item: LibraryItem }) {
  const { colors: themeColors } = useAppTheme();
  const gameDescription = item.type === 'game' ? cleanRawgDescription(item.description || '') : '';
  return (
    <>
      {/* Movie Overview Section */}
      {item.type === 'movie' && Boolean(item.overview) && (
        <View className="py-6 px-6 border-b border-theme-raised gap-3">
          <View className="flex-row items-center gap-2">
            <FilmSlateIcon size={14} color={themeColors.heading} weight="bold" />
            <Text className="font-sans-semibold text-sm tracking-wider uppercase text-theme-heading">
              <LocalizedText>Overview</LocalizedText>
            </Text>
          </View>
          <Text className="font-sans text-base text-theme-body leading-relaxed">
            {decodeHTML(item.overview || '')}
          </Text>
        </View>
      )}

      {item.type === 'tvshow' && Boolean(item.overview) && (
        <View className="py-6 px-6 border-b border-theme-raised gap-3">
          <View className="flex-row items-center gap-2">
            <FilmSlateIcon size={14} color={themeColors.heading} weight="bold" />
            <Text className="font-sans-semibold text-sm tracking-wider uppercase text-theme-heading">
              <LocalizedText>Overview</LocalizedText>
            </Text>
          </View>
          <Text className="font-sans text-base text-theme-body leading-relaxed">
            {decodeHTML(item.overview || '')}
          </Text>
        </View>
      )}

      {/* Movie Cast Section */}
      {item.type === 'movie' && (item.cast?.length ?? 0) > 0 && (
        <View className="py-6 px-6 border-b border-theme-raised gap-3">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <UsersThreeIcon size={14} color={themeColors.heading} weight="bold" />
              <Text className="font-sans-semibold text-sm tracking-wider uppercase text-theme-heading">
                <LocalizedText>Cast</LocalizedText>
              </Text>
            </View>
            <Text className="font-sans text-xs text-theme-muted">
              <LocalizedText>Top </LocalizedText>
              {Math.min(item.cast?.length ?? 0, 20)} <LocalizedText>of </LocalizedText>
              {item.cast?.length ?? 0}
            </Text>
          </View>

          <ScrollView
            horizontal
            nestedScrollEnabled
            showsHorizontalScrollIndicator={false}
            style={{ marginHorizontal: -24 }}
            contentContainerStyle={{
              gap: 12,
              paddingLeft: 24,
              paddingRight: 24,
            }}
          >
            {(item.cast ?? []).slice(0, 20).map((person, index) => (
              <View key={`${person.id}-${index}`} className="w-28 gap-3">
                <View className="w-28 h-36 rounded-lg overflow-hidden bg-theme-surface items-center justify-center">
                  {person.profilePath ? (
                    <ExpoImage
                      source={{ uri: getProfileUrl(person.profilePath) }}
                      className="w-full h-full"
                      contentFit="cover"
                    />
                  ) : (
                    <Text className="font-sans-semibold text-2xl text-theme-muted">
                      {person.name
                        .split(/\s+/)
                        .filter(Boolean)
                        .slice(0, 2)
                        .map((part) => part[0])
                        .join('')}
                    </Text>
                  )}
                </View>
                <Text className="font-sans-medium text-sm text-theme-bright" numberOfLines={2}>
                  {decodeHTML(person.name)}
                </Text>
                {person.character ? (
                  <Text
                    className="font-sans text-xs text-theme-secondary -mt-1.5"
                    numberOfLines={2}
                  >
                    {decodeHTML(person.character)}
                  </Text>
                ) : null}
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Game Overview Section */}
      {item.type === 'game' && (
        <View className="py-6 px-6 border-b border-theme-raised gap-3">
          <View className="flex-row items-center gap-2">
            <GameControllerIcon size={14} color={themeColors.heading} weight="bold" />
            <Text className="font-sans-semibold text-sm tracking-wider uppercase text-theme-heading">
              <LocalizedText>About</LocalizedText>
            </Text>
          </View>
          {gameDescription ? (
            <Text className="font-sans text-base text-theme-body leading-relaxed">
              {gameDescription}
            </Text>
          ) : null}
        </View>
      )}
    </>
  );
}
