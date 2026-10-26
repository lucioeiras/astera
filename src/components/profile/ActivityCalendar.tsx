import { useAppTheme } from '@/lib/theme';
import { localDayKey } from '@/lib/library/activity';
import { CaretLeftIcon, CaretRightIcon } from 'phosphor-react-native';
import { Pressable, Text, View } from 'react-native';
import { translate, useLocalization } from '@/lib/i18n';

type Props = {
  month: Date;
  byDay: Record<string, number>;
  onChangeMonth: (month: Date) => void;
  onPressDate: (day: string) => void;
};

export function ActivityCalendar({ month, byDay, onChangeMonth, onPressDate }: Props) {
  const { colors: themeColors, isDark } = useAppTheme();
  const { language } = useLocalization();
  const locale = language === 'pt' ? 'pt-BR' : 'en-US';
  const weekdays =
    language === 'pt' ? ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'] : ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const calendarWeekday = new Date(month.getFullYear(), month.getMonth(), 1).getDay();
  const firstWeekday = language === 'pt' ? (calendarWeekday + 6) % 7 : calendarWeekday;
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells = Array.from(
    { length: Math.ceil((firstWeekday + days) / 7) * 7 },
    (_, i) => i - firstWeekday + 1
  );
  const today = localDayKey(new Date());
  return (
    <View>
      <View className="mb-4 flex-row items-center justify-between">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={translate('Previous month')}
          className="h-12 w-12 items-start justify-center"
          onPress={() => onChangeMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
        >
          <CaretLeftIcon size={18} color={themeColors.body} />
        </Pressable>
        <Text className="font-sans-semibold text-base text-theme-foreground">
          {month.toLocaleDateString(locale, { month: 'long', year: 'numeric' })}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={translate('Next month')}
          className="h-12 w-12 items-end justify-center"
          onPress={() => onChangeMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
        >
          <CaretRightIcon size={18} color={themeColors.body} />
        </Pressable>
      </View>
      <View className="mb-2 flex-row">
        {weekdays.map((day, i) => (
          <Text key={i} className="flex-1 text-center font-sans-medium text-xs text-theme-muted">
            {day}
          </Text>
        ))}
      </View>
      <View className="flex-row flex-wrap">
        {cells.map((day, i) => {
          if (day < 1 || day > days)
            return <View key={i} style={{ width: '14.2857%', height: 64 }} />;
          const date = new Date(month.getFullYear(), month.getMonth(), day);
          const key = localDayKey(date);
          const count = byDay[key] ?? 0;
          // Keep the scale consistent across months and use a lighter blue
          // scale in light mode so foreground text remains readable.
          const intensity = Math.min(1, Math.max(0, (count - 1) / 9));
          const backgroundColor =
            count > 0
              ? isDark
                ? `rgb(${Math.round(30 + 117 * intensity)}, ${Math.round(58 + 139 * intensity)}, ${Math.round(138 + 115 * intensity)})`
                : `rgb(${Math.round(219 - 126 * intensity)}, ${Math.round(234 - 37 * intensity)}, ${Math.round(254 - intensity)})`
              : themeColors.surface;
          return (
            <Pressable
              key={i}
              accessibilityRole="button"
              accessibilityLabel={translate('%{date}, %{count} cards added', {
                date: date.toLocaleDateString(locale, {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                }),
                count,
              })}
              onPress={() => onPressDate(key)}
              style={{ width: '14.2857%', height: 64, padding: 2 }}
            >
              <View
                testID={`activity-day-${key}`}
                style={{ backgroundColor }}
                className={`flex-1 overflow-hidden rounded-xl p-1.5 ${key === today ? 'border border-theme-foreground' : ''}`}
              >
                <Text
                  className={`font-sans-medium text-xs ${isDark && count >= 5 ? 'text-theme-canvas' : count > 0 ? 'text-theme-foreground' : 'text-theme-muted'}`}
                >
                  {day}
                </Text>
                {count > 0 && (
                  <Text
                    testID={`activity-day-count-${key}`}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.65}
                    className={`absolute bottom-1.5 left-1.5 right-1.5 text-right font-sans-bold text-base ${isDark && count >= 5 ? 'text-theme-canvas' : count > 0 ? 'text-theme-foreground' : 'text-theme-muted'}`}
                  >
                    {count}
                  </Text>
                )}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
