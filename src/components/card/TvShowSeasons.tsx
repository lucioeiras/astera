import { useAppTheme, type ThemeColors } from '@/lib/theme';
import { Image as ExpoImage } from 'expo-image';
import { RefreshCw, Bookmark, CircleCheck, Clock, Ban, Tv } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { CardReview } from '@/components/card/CardReview';
import type { MediaProgressStatus, TvShowSeason } from '@/lib/library/types';
import { LocalizedText } from '@/components/LocalizedText';
import { translate, useLocalization } from '@/lib/i18n';

const STATUSES: MediaProgressStatus[] = ['want', 'in-progress', 'completed', 'abandoned'];

const LABELS: Record<MediaProgressStatus, string> = {
  want: 'Want to watch',
  'in-progress': 'Watching',
  completed: 'Watched',
  abandoned: 'Abandoned',
};

const STATUS_TAGS = (themeColors: ThemeColors) =>
  ({
    want: {
      Icon: Bookmark,
      color: themeColors.statusWant,
    },
    'in-progress': {
      Icon: Clock,
      color: themeColors.statusInProgress,
    },
    completed: {
      Icon: CircleCheck,
      color: themeColors.statusCompleted,
    },
    abandoned: {
      Icon: Ban,
      color: themeColors.statusAbandoned,
    },
  }) as const;

export function TvShowSeasons({
  seasons,
  onChange,
}: {
  seasons: TvShowSeason[];
  onChange: (seasons: TvShowSeason[]) => void;
}) {
  const { colors: themeColors } = useAppTheme();
  useLocalization();
  const [draft, setDraft] = useState(seasons);

  useEffect(() => {
    const timer = setTimeout(() => onChange(draft), 300);
    return () => clearTimeout(timer);
  }, [draft, onChange]);

  const updateSeason = (seasonNumber: number, update: Partial<TvShowSeason>) => {
    setDraft((current) =>
      current.map((season) =>
        season.seasonNumber === seasonNumber ? { ...season, ...update } : season
      )
    );
  };

  return (
    <View className="gap-6 border-b border-theme-raised px-6 py-6">
      <View className="flex-row items-center gap-2">
        <Tv size={15} color={themeColors.heading} strokeWidth={2} />
        <Text className="font-sans-semibold text-sm uppercase tracking-wider text-theme-heading">
          <LocalizedText>Seasons</LocalizedText>
        </Text>
      </View>

      {draft.length > 0 ? (
        draft.map((season, index) => {
          const status = season.progressStatus ?? 'want';
          const nextStatus = STATUSES[(STATUSES.indexOf(status) + 1) % STATUSES.length];
          const statusTag = STATUS_TAGS(themeColors)[status];
          const StatusIcon = statusTag.Icon;
          const metadata = [
            season.episodeCount ? `${season.episodeCount} ${translate('episodes')}` : null,
            season.airDate ? season.airDate.slice(0, 4) : null,
          ].filter(Boolean);

          return (
            <View
              key={`${season.seasonNumber}-${season.tmdbId ?? ''}`}
              className={`gap-3 ${index > 0 ? 'border-t border-theme-raised pt-4' : ''}`}
            >
              <View className="flex-row gap-3">
                {season.poster ? (
                  <ExpoImage
                    source={{ uri: season.poster }}
                    accessibilityLabel={`${season.name} poster`}
                    contentFit="cover"
                    style={{
                      width: 42,
                      height: 63,
                      borderRadius: 6,
                      backgroundColor: themeColors.surface,
                    }}
                  />
                ) : (
                  <View className="h-[63px] w-[42px] rounded-md bg-theme-surface" />
                )}
                <View className="flex-1 justify-center gap-3">
                  <View className="flex-row items-center justify-between gap-3">
                    <View className="flex-1 gap-1">
                      <Text className="font-sans-medium text-base text-theme-bright">
                        {season.name}
                      </Text>
                      {metadata.length > 0 && (
                        <Text className="font-sans text-xs text-theme-muted">
                          {metadata.join(' · ')}
                        </Text>
                      )}
                    </View>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={translate('Change status: %{status}, %{title}', {
                        status: translate(LABELS[status]),
                        title: season.name,
                      })}
                      onPress={() =>
                        updateSeason(season.seasonNumber, {
                          progressStatus: nextStatus,
                        })
                      }
                      className="flex-row items-center gap-1 rounded-full px-2.5 py-1 active:opacity-70"
                      style={{ backgroundColor: `${statusTag.color}26` }}
                      hitSlop={4}
                    >
                      <StatusIcon size={12} color={statusTag.color} strokeWidth={2} />
                      <Text
                        className="font-sans-medium text-xs"
                        style={{ color: statusTag.color }}
                        numberOfLines={1}
                      >
                        {translate(LABELS[status])}
                      </Text>
                      <RefreshCw size={10} color={statusTag.color} />
                    </Pressable>
                  </View>
                </View>
              </View>
              {status === 'completed' && (
                <CardReview
                  compact
                  rating={season.review?.rating ?? null}
                  comments={season.review?.comments ?? ''}
                  onRatingChange={(rating) =>
                    updateSeason(season.seasonNumber, {
                      review: { ...season.review, rating },
                    })
                  }
                  onCommentsChange={(comments) =>
                    updateSeason(season.seasonNumber, {
                      review: { ...season.review, comments },
                    })
                  }
                />
              )}
            </View>
          );
        })
      ) : (
        <Text className="font-sans text-sm text-theme-muted">
          <LocalizedText>No seasons listed by TMDB.</LocalizedText>
        </Text>
      )}
    </View>
  );
}
