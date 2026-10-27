import { useAppTheme } from '@/lib/theme';
import { formatDuration } from '@/lib/music/itunes';
import { decodeHTML } from 'entities';
import {
  Barcode,
  BookOpen,
  Calendar,
  CalendarCheck,
  SquareCheck,
  Clock,
  Disc,
  FileText,
  Clapperboard,
  Gamepad2,
  Info,
  Joystick,
  Music2,
  Star,
  User,
  Users,
} from 'lucide-react-native';
import { Text, View } from 'react-native';

import { cleanRawgDescription } from '@/lib/games/rawg';
import type { LibraryItem } from '@/lib/library/types';
import { LocalizedText } from '@/components/LocalizedText';
import { translate, useLocalization } from '@/lib/i18n';

function formatDateAdded(isoDate: string, locale: string): string {
  try {
    const d = new Date(isoDate);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString(locale, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let size = bytes / 1024;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  return `${size.toFixed(size >= 10 ? 0 : 1)} ${units[unitIndex]}`;
}

export function CardInfo({ item }: { item: LibraryItem }) {
  const { colors: themeColors } = useAppTheme();
  const { language } = useLocalization();
  const locale = language === 'pt' ? 'pt-BR' : 'en-US';
  const gameInfo =
    item.type === 'game'
      ? {
          description: cleanRawgDescription(item.description || ''),
          released: item.released,
          platforms: item.platforms,
          genres: item.genres,
          rating: item.rating,
          metacritic: item.metacritic,
          developers: item.developers,
          publishers: item.publishers,
        }
      : null;

  return (
    <View className="py-6 px-6 gap-4">
      <View className="flex-row items-center gap-2">
        <Info size={14} color={themeColors.heading} strokeWidth={2} />
        <Text className="font-sans-semibold text-sm tracking-wider uppercase text-theme-heading">
          <LocalizedText>Info</LocalizedText>
        </Text>
      </View>

      <View className="flex-row items-center gap-2.5">
        <Calendar size={16} color={themeColors.secondary} />
        <Text className="font-sans text-base text-theme-secondary">
          {translate('Added %{date}', {
            date: formatDateAdded(item.createdAt, locale),
          })}
        </Text>
      </View>

      {item.type === 'pdf' && item.originalFileName && (
        <View className="flex-row items-center gap-2.5">
          <FileText size={16} color={themeColors.secondary} />
          <Text className="flex-1 font-sans text-base text-theme-secondary" numberOfLines={2}>
            {item.originalFileName}
          </Text>
        </View>
      )}
      {item.type === 'pdf' && typeof item.fileSize === 'number' && item.fileSize > 0 && (
        <View className="flex-row items-center gap-2.5">
          <Info size={16} color={themeColors.secondary} />
          <Text className="font-sans text-base text-theme-secondary">
            {formatFileSize(item.fileSize)}
          </Text>
        </View>
      )}

      {item.type === 'movie' && (
        <>
          {Boolean(item.releaseDate) && (
            <View className="flex-row items-center gap-2.5">
              <CalendarCheck size={16} color={themeColors.secondary} />
              <Text className="font-sans text-base text-theme-secondary">
                <LocalizedText>Released </LocalizedText>
                {item.releaseDate}
              </Text>
            </View>
          )}
          {Boolean(item.director) && (
            <View className="flex-row items-center gap-2.5">
              <User size={16} color={themeColors.secondary} />
              <Text className="font-sans text-base text-theme-secondary">
                {decodeHTML(item.director || '')}
              </Text>
            </View>
          )}
          {Boolean(item.runtime) && (
            <View className="flex-row items-center gap-2.5">
              <Clock size={16} color={themeColors.secondary} />
              <Text className="font-sans text-base text-theme-secondary">
                {item.runtime} <LocalizedText>min</LocalizedText>
              </Text>
            </View>
          )}
          {typeof item.voteAverage === 'number' && item.voteAverage > 0 && (
            <View className="flex-row items-center gap-2.5">
              <Star size={16} color={themeColors.secondary} />
              <Text className="font-sans text-base text-theme-secondary">
                {item.voteAverage.toFixed(1)} <LocalizedText>/ 10</LocalizedText>
              </Text>
            </View>
          )}
          {Boolean(item.genres && item.genres.length > 0) && (
            <View className="flex-row items-center gap-2.5">
              <Clapperboard size={16} color={themeColors.secondary} />
              <Text className="font-sans text-base text-theme-secondary">
                {item.genres?.map(decodeHTML).join(', ')}
              </Text>
            </View>
          )}
        </>
      )}

      {item.type === 'tvshow' && (
        <>
          {Boolean(item.firstAirDate) && (
            <View className="flex-row items-center gap-2.5">
              <CalendarCheck size={16} color={themeColors.secondary} />
              <Text className="font-sans text-base text-theme-secondary">
                <LocalizedText>First aired </LocalizedText>
                {item.firstAirDate}
              </Text>
            </View>
          )}
          {typeof item.voteAverage === 'number' && item.voteAverage > 0 && (
            <View className="flex-row items-center gap-2.5">
              <Star size={16} color={themeColors.secondary} />
              <Text className="font-sans text-base text-theme-secondary">
                {item.voteAverage.toFixed(1)} <LocalizedText>/ 10</LocalizedText>
              </Text>
            </View>
          )}
          {!!item.genres?.length && (
            <View className="flex-row items-center gap-2.5">
              <Clapperboard size={16} color={themeColors.secondary} />
              <Text className="font-sans text-base text-theme-secondary">
                {item.genres.join(', ')}
              </Text>
            </View>
          )}
        </>
      )}

      {item.type === 'music' && (
        <>
          {item.musicKind === 'album' && (
            <View className="flex-row items-center gap-2.5">
              <Disc size={16} color={themeColors.secondary} />
              <Text className="font-sans text-base text-theme-secondary">
                <LocalizedText>Album</LocalizedText>
              </Text>
            </View>
          )}
          {item.album && (
            <View className="flex-row items-center gap-2.5">
              <Disc size={16} color={themeColors.secondary} />
              <Text className="font-sans text-base text-theme-secondary">
                {decodeHTML(item.album)}
              </Text>
            </View>
          )}
          {item.genre && (
            <View className="flex-row items-center gap-2.5">
              <Music2 size={16} color={themeColors.secondary} />
              <Text className="font-sans text-base text-theme-secondary">
                {decodeHTML(item.genre)}
              </Text>
            </View>
          )}
          {Boolean(item.durationMs) && (
            <View className="flex-row items-center gap-2.5">
              <Clock size={16} color={themeColors.secondary} />
              <Text className="font-sans text-base text-theme-secondary">
                {formatDuration(item.durationMs)}
              </Text>
            </View>
          )}
        </>
      )}

      {item.type === 'game' && (
        <>
          {gameInfo?.released && (
            <View className="flex-row items-center gap-2.5">
              <CalendarCheck size={16} color={themeColors.secondary} />
              <Text className="font-sans text-base text-theme-secondary">
                <LocalizedText>Released </LocalizedText>
                {formatDateAdded(gameInfo.released, locale)}
              </Text>
            </View>
          )}
          {!!gameInfo?.rating && gameInfo.rating > 0 && (
            <View className="flex-row items-center gap-2.5">
              <Star size={16} color={themeColors.secondary} />
              <Text className="font-sans text-base text-theme-secondary">
                {gameInfo.rating.toFixed(1)} <LocalizedText>/ 5</LocalizedText>
              </Text>
            </View>
          )}
          {!!gameInfo?.metacritic && gameInfo.metacritic > 0 && (
            <View className="flex-row items-center gap-2.5">
              <Star size={16} color={themeColors.secondary} />
              <Text className="font-sans text-base text-theme-secondary">
                {gameInfo.metacritic} <LocalizedText>/ 100</LocalizedText>
              </Text>
            </View>
          )}
          {!!gameInfo?.platforms?.length && (
            <View className="flex-row items-center gap-2.5">
              <Gamepad2 size={16} color={themeColors.secondary} />
              <Text className="flex-1 font-sans text-base text-theme-secondary">
                {gameInfo.platforms.join(', ')}
              </Text>
            </View>
          )}
          {!!gameInfo?.genres?.length && (
            <View className="flex-row items-center gap-2.5">
              <Joystick size={16} color={themeColors.secondary} />
              <Text className="flex-1 font-sans text-base text-theme-secondary">
                {gameInfo.genres.map(decodeHTML).join(', ')}
              </Text>
            </View>
          )}
          {!!gameInfo?.developers?.length && (
            <View className="flex-row items-center gap-2.5">
              <Users size={16} color={themeColors.secondary} />
              <Text className="flex-1 font-sans text-base text-theme-secondary">
                {gameInfo.developers.map(decodeHTML).join(', ')}
              </Text>
            </View>
          )}
          {!!gameInfo?.publishers?.length && (
            <View className="flex-row items-center gap-2.5">
              <SquareCheck size={16} color={themeColors.secondary} />
              <Text className="flex-1 font-sans text-base text-theme-secondary">
                {gameInfo.publishers.map(decodeHTML).join(', ')}
              </Text>
            </View>
          )}
        </>
      )}

      {item.type === 'book' && (
        <>
          <View className="flex-row items-center gap-2.5">
            <Barcode size={16} color={themeColors.secondary} />
            <Text className="font-sans text-base text-theme-secondary">
              <LocalizedText>ISBN </LocalizedText>
              {item.isbn}
            </Text>
          </View>
          {item.authors && item.authors.length > 0 && (
            <View className="flex-row items-center gap-2.5">
              <User size={16} color={themeColors.secondary} />
              <Text className="font-sans text-base text-theme-secondary">
                {item.authors.join(', ')}
              </Text>
            </View>
          )}
          {item.publisher && (
            <View className="flex-row items-center gap-2.5">
              <SquareCheck size={16} color={themeColors.secondary} />
              <Text className="font-sans text-base text-theme-secondary">{item.publisher}</Text>
            </View>
          )}
          {item.pageCount && (
            <View className="flex-row items-center gap-2.5">
              <BookOpen size={16} color={themeColors.secondary} />
              <Text className="font-sans text-base text-theme-secondary">
                {item.pageCount} <LocalizedText>pages</LocalizedText>
              </Text>
            </View>
          )}
        </>
      )}
    </View>
  );
}
