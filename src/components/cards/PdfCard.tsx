import { useAppTheme } from '@/lib/theme';
import { decodeHTML } from 'entities';
import { FilePdfIcon } from 'phosphor-react-native';
import { memo, useState } from 'react';
import { Text, View } from 'react-native';

import { PdfPreview } from '@/components/PdfPreview';

type PdfCardProps = {
  url: string;
  title?: string;
  hideTitleAndAuthor?: boolean;
};

export const PdfCard = memo(function PdfCard({
  url,
  title,
  hideTitleAndAuthor = false,
}: PdfCardProps) {
  const { colors: themeColors } = useAppTheme();
  // Extract a fallback title from the filename if not provided
  const displayTitle = title
    ? decodeHTML(title)
    : (() => {
        try {
          const parts = url.split('/');
          const filename = decodeURIComponent(parts[parts.length - 1] || '');
          return filename.replace(/\.pdf$/i, '') || 'PDF Document';
        } catch {
          return 'PDF Document';
        }
      })();

  const [previewSize, setPreviewSize] = useState({ width: 0, height: 0 });

  return (
    <View className="w-full items-center">
      <View
        className="w-full aspect-[0.72] items-center justify-center overflow-hidden rounded-xl bg-theme-surface"
        onLayout={(event) => {
          const { width, height } = event.nativeEvent.layout;
          if (width > 0 && height > 0) {
            setPreviewSize((previous) =>
              previous.width === width && previous.height === height ? previous : { width, height }
            );
          }
        }}
      >
        {previewSize.width > 0 && (
          <PdfPreview uri={url} width={previewSize.width} height={previewSize.height} />
        )}
      </View>

      {!hideTitleAndAuthor && (
        <View className="w-full items-center my-3 px-5">
          <View className="flex-row items-center justify-center gap-2">
            <FilePdfIcon size={14} color={themeColors.red} weight="duotone" />
            <Text
              className="font-sans-medium text-sm leading-[1.4] text-theme-foreground text-center"
              numberOfLines={1}
            >
              {displayTitle}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
});
