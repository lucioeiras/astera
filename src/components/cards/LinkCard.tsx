import { useAppTheme } from '@/lib/theme';
import { decodeHTML } from 'entities';
import { Image as ExpoImage } from 'expo-image';
import { cssInterop } from 'nativewind';
import { LinkIcon } from 'phosphor-react-native';
import { Text, View } from 'react-native';

cssInterop(ExpoImage, { className: 'style' });

type LinkCardProps = {
  favicon: string;
  siteTitle: string;
  description: string;
  url: string;
  title?: string;
};

export const LinkCard = ({ favicon, siteTitle, description, url, title }: LinkCardProps) => {
  const { colors: themeColors } = useAppTheme();
  const getShortUrl = (urlStr: string) => {
    try {
      const parsed = new URL(urlStr);

      let hostname = parsed.hostname;

      if (hostname.startsWith('www.')) {
        hostname = hostname.substring(4);
      }

      return hostname;
    } catch {
      return urlStr;
    }
  };

  return (
    <View className="w-full p-5 gap-4 rounded-xl bg-theme-surface/80">
      <ExpoImage source={{ uri: favicon }} className="w-8 h-8 rounded-full" />

      <View className="gap-2">
        <Text
          className="font-sans-medium text-lg leading-[1.6] text-theme-foreground"
          numberOfLines={3}
        >
          {decodeHTML(title || siteTitle)}
        </Text>

        <Text className="font-sans text-xs leading-[1.8] text-theme-body" numberOfLines={4}>
          {decodeHTML(description)}
        </Text>
      </View>

      <View className="flex-row items-center gap-2 mt-2">
        <LinkIcon size={14} color={themeColors.body} weight="bold" />
        <Text className="font-sans-semibold text-sm text-theme-body" numberOfLines={1}>
          {getShortUrl(url)}
        </Text>
      </View>
    </View>
  );
};
