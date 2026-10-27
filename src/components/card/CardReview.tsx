import { useAppTheme } from '@/lib/theme';
import { Smile, Star } from 'lucide-react-native';
import { Pressable, Text, TextInput, View } from 'react-native';
import { LocalizedText } from '@/components/LocalizedText';
import { translate, useLocalization } from '@/lib/i18n';

type CardReviewProps = {
  rating: number | null;
  comments: string;
  onRatingChange: (rating: number) => void;
  onCommentsChange: (comments: string) => void;
  compact?: boolean;
};

export function CardReview({
  rating: reviewRating,
  comments: reviewComments,
  onRatingChange: setReviewRating,
  onCommentsChange: setReviewComments,
  compact = false,
}: CardReviewProps) {
  const { colors: themeColors } = useAppTheme();
  useLocalization();
  return (
    <View className={compact ? 'gap-4 pt-4' : 'py-6 px-6 border-b border-theme-raised gap-4'}>
      <View
        className={`w-full flex-row items-center ${compact ? 'justify-start' : 'justify-between'}`}
      >
        {!compact && (
          <View className="flex-row items-center gap-2">
            <Smile size={16} color={themeColors.body} />
            <Text className="font-sans-semibold text-sm tracking-wider uppercase text-theme-heading">
              <LocalizedText>My review</LocalizedText>
            </Text>
          </View>
        )}

        {/* Estrelas */}
        <View className="flex-row items-center">
          {Array.from({ length: 5 }, (_, index) => {
            const halfRating = index + 0.5;
            const fullRating = index + 1;
            const fillWidth =
              reviewRating !== null && reviewRating >= fullRating
                ? 24
                : reviewRating !== null && reviewRating >= halfRating
                  ? 12
                  : 0;

            return (
              <View
                key={index}
                className={`h-7 w-10 justify-center ${compact ? 'items-start' : 'items-center'}`}
              >
                <Star size={24} color={themeColors.strongBorder} strokeWidth={1.5} />
                {fillWidth > 0 && (
                  <View
                    className="absolute overflow-hidden"
                    style={{
                      left: compact ? 0 : 8,
                      top: 2,
                      width: fillWidth,
                      height: 24,
                    }}
                  >
                    <Star size={24} color={themeColors.foreground} fill={themeColors.foreground} />
                  </View>
                )}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={translate('%{rating} out of 5 stars', {
                    rating: halfRating,
                  })}
                  accessibilityState={{ selected: reviewRating === halfRating }}
                  onPress={() => setReviewRating(halfRating)}
                  className="absolute left-0 top-0 h-7 w-1/2"
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={translate('%{rating} out of 5 stars', {
                    rating: fullRating,
                  })}
                  accessibilityState={{ selected: reviewRating === fullRating }}
                  onPress={() => setReviewRating(fullRating)}
                  className="absolute right-0 top-0 h-7 w-1/2"
                />
              </View>
            );
          })}
        </View>
      </View>

      <TextInput
        value={reviewComments}
        onChangeText={setReviewComments}
        multiline
        placeholder={translate('What is your opinion on this?')}
        placeholderTextColor={themeColors.muted}
        textAlignVertical="top"
        className="min-h-24 font-sans text-base text-theme-foreground"
        style={{ padding: 0, backgroundColor: 'transparent' }}
        underlineColorAndroid="transparent"
      />
    </View>
  );
}
