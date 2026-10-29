import { Image } from 'expo-image';
import { useContext, useState } from 'react';
import { Text } from 'react-native';
import { LibraryAssetContext } from '@/lib/library/assetContext';
import { translate } from '@/lib/i18n';

export function MarkdownNoteImage({
  uri,
  alt,
  compact,
}: {
  uri: string;
  alt: string;
  compact: boolean;
}) {
  const root = useContext(LibraryAssetContext);
  const [failedUri, setFailedUri] = useState<string | null>(null);
  const resolved = uri.startsWith('images/')
    ? root
      ? `${root.replace(/\/+$/, '')}/${uri}`
      : undefined
    : uri;
  if (!resolved || failedUri === resolved) {
    return (
      <Text className="font-sans text-theme-secondary">
        {alt || translate('Image unavailable')}
      </Text>
    );
  }
  return (
    <Image
      source={{ uri: resolved }}
      accessibilityLabel={alt || translate('Image')}
      accessible
      onError={() => setFailedUri(resolved)}
      contentFit="contain"
      style={{ width: '100%', height: compact ? 160 : 280, borderRadius: 12 }}
    />
  );
}
