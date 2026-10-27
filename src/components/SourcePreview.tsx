import { useAppTheme } from '@/lib/theme';
import { Image as ExpoImage } from 'expo-image';
import { Bookmark, Music2, X } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { getLinkableTitle, getLinkableTypeLabel, type LinkableItem } from '@/lib/library/links';
import type { MusicMetadata } from '@/lib/music/itunes';
import { translate, useLocalization } from '@/lib/i18n';

type SharedProps = {
  onChange?: () => void;
  onRemove?: () => void;
  compact?: boolean;
  containerClassName?: string;
};

type Props = SharedProps &
  (
    | { item: LinkableItem; pendingMusic?: undefined }
    | {
        item?: undefined;
        pendingMusic: Pick<MusicMetadata, 'title' | 'artist' | 'album' | 'cover'>;
      }
  );

function getPreviewImage(item: LinkableItem): string | undefined {
  switch (item.type) {
    case 'article':
    case 'youtube':
    case 'tiktok':
      return item.thumbnail;
    case 'link':
      return item.favicon;
    case 'movie':
    case 'tvshow':
      return item.poster;
    case 'book':
      return item.cover;
    case 'game':
    case 'music':
      return item.cover;
  }
}

function getPreviewSubtitle(item: LinkableItem): string | undefined {
  switch (item.type) {
    case 'article':
      return item.origin;
    case 'youtube':
    case 'tiktok':
      return undefined;
    case 'link':
      return item.description || item.url;
    case 'movie':
      return item.releaseYear || item.releaseDate?.slice(0, 4);
    case 'tvshow':
      return item.releaseYear || item.firstAirDate?.slice(0, 4);
    case 'book':
      return item.authors.join(', ') || item.publishedDate?.slice(0, 4);
    case 'game':
      return item.releaseYear || item.platforms?.join(', ');
    case 'music':
      return [item.artist, item.musicKind === 'song' ? item.album : undefined]
        .filter(Boolean)
        .join(' • ');
  }
}

function getInitialAspectRatio(item: LinkableItem): number {
  switch (item.type) {
    case 'movie':
    case 'tvshow':
      return 2 / 3;
    case 'book':
      return item.coverAspectRatio && item.coverAspectRatio > 0 ? item.coverAspectRatio : 2 / 3;
    case 'article':
    case 'youtube':
    case 'tiktok':
    case 'game':
      return 16 / 9;
    case 'link':
    case 'music':
      return 1;
  }
}

export function SourcePreview({
  item,
  pendingMusic,
  onChange,
  onRemove,
  compact = false,
  containerClassName = '',
}: Props) {
  const { colors: themeColors } = useAppTheme();
  useLocalization();
  const title = item ? getLinkableTitle(item) : pendingMusic.title;
  const typeLabel = translate(item ? getLinkableTypeLabel(item) : 'Song');
  const image = item ? getPreviewImage(item) : pendingMusic.cover;
  const subtitle = item
    ? getPreviewSubtitle(item)
    : [pendingMusic.artist, pendingMusic.album].filter(Boolean).join(' • ');
  const initialRatio = item ? getInitialAspectRatio(item) : 1;
  const [loadedRatio, setLoadedRatio] = useState<{
    image?: string;
    ratio: number;
  }>({
    image,
    ratio: initialRatio,
  });
  const aspectRatio = loadedRatio.image === image ? loadedRatio.ratio : initialRatio;
  const maxSize = compact
    ? 44
    : item?.type === 'link'
      ? 64
      : item?.type === 'music' || pendingMusic
        ? 80
        : 96;
  const imageSize = {
    width: aspectRatio >= 1 ? maxSize : maxSize * aspectRatio,
    height: aspectRatio >= 1 ? maxSize / aspectRatio : maxSize,
  };

  const content = (
    <>
      <View
        className="rounded-lg bg-theme-raised overflow-hidden items-center justify-center"
        style={imageSize}
      >
        {image ? (
          <ExpoImage
            source={{ uri: image }}
            className="w-full h-full"
            contentFit="contain"
            onLoad={(event) => {
              const { width, height } = event.source;
              if (width > 0 && height > 0) {
                const ratio = width / height;
                setLoadedRatio((current) =>
                  current.image === image && current.ratio === ratio ? current : { image, ratio }
                );
              }
            }}
          />
        ) : pendingMusic ? (
          <Music2 size={compact ? 16 : 24} color={themeColors.muted} />
        ) : (
          <Bookmark size={compact ? 16 : 24} color={themeColors.muted} />
        )}
      </View>
      <View className={`flex-1 ${compact ? 'gap-1.5' : 'gap-2'}`}>
        <Text
          className={`font-sans-medium text-theme-secondary ${compact ? 'text-[10px]' : 'text-xs'}`}
          numberOfLines={1}
        >
          {typeLabel}
        </Text>
        <Text
          className={`font-sans-semibold text-theme-foreground ${compact ? 'text-xs' : 'text-lg'}`}
          numberOfLines={2}
        >
          {title}
        </Text>
        {subtitle && !compact ? (
          <Text className="font-sans text-sm text-theme-secondary" numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
    </>
  );

  if (compact) {
    return <View className={`flex-row items-center gap-2 ${containerClassName}`}>{content}</View>;
  }

  return (
    <View className={`flex-row items-center gap-4 ${containerClassName}`}>
      <Pressable
        onPress={onChange}
        accessibilityRole="button"
        accessibilityLabel={`Change source: ${title}`}
        className="flex-1 flex-row items-center gap-6"
      >
        {content}
      </Pressable>

      {onRemove && (
        <Pressable
          onPress={onRemove}
          hitSlop={10}
          className="p-2 rounded-full bg-theme-raised active:opacity-70"
          accessibilityRole="button"
          accessibilityLabel={translate('Remove source')}
        >
          <X size={16} color={themeColors.heading} strokeWidth={2} />
        </Pressable>
      )}
    </View>
  );
}
