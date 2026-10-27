import { useAppTheme } from '@/lib/theme';
import { decodeHTML } from 'entities';
import { LinkIcon, Quote } from 'lucide-react-native';
import { Text, View } from 'react-native';

type QuoteProps = {
  text: string;
  title?: string;
  linkedTitle?: string;
};

export const QuoteCard = ({ text, title, linkedTitle }: QuoteProps) => {
  const { colors: themeColors } = useAppTheme();
  const cleanText = text ? decodeHTML(text) : '';
  const cleanTitle = title ? decodeHTML(title) : undefined;

  return (
    <View className="w-full items-center">
      <View className="w-full p-6 items-center gap-5 bg-theme-surface/80 rounded-xl">
        <Quote
          width={10}
          height={9}
          color="#71717B"
          style={{ transform: [{ rotate: '180deg' }] }}
        />
        <Text
          className="font-sans-medium text-lg text-center leading-[1.8] text-theme-bright"
          numberOfLines={8}
        >
          {cleanText}
        </Text>
        <Quote width={10} height={9} color="#71717B" />
        {linkedTitle && (
          <View className="flex-row items-center gap-2 pt-2">
            <LinkIcon size={14} color={themeColors.blueSoft} />
            <Text
              className="font-sans-medium text-xs text-theme-blue flex-shrink"
              numberOfLines={1}
            >
              {linkedTitle}
            </Text>
          </View>
        )}
      </View>

      {cleanTitle && (
        <Text
          className="font-sans-medium text-xs text-theme-secondary text-center mt-3 leading-[1.6]"
          numberOfLines={2}
        >
          {cleanTitle}
        </Text>
      )}
    </View>
  );
};
