import { useAppTheme } from '@/lib/theme';
import { CaretLeftIcon, CaretRightIcon } from 'phosphor-react-native';
import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { localDateKey } from '@/components/books/bookLogDates';
import { translate, useLocalization } from '@/lib/i18n';

type CalendarLog = { date: string; noteId?: string };

type LogCalendarGridProps<T extends CalendarLog> = {
  month: Date;
  logs: T[];
  loggedLabel?: string;
  selectedDate?: string;
  onChangeMonth: (month: Date) => void;
  onPressDate: (date: string) => void;
};

export function LogCalendarGrid<T extends CalendarLog>({
  month,
  logs,
  selectedDate,
  loggedLabel = 'reading logged',
  onChangeMonth,
  onPressDate,
}: LogCalendarGridProps<T>) {
  const { colors: themeColors } = useAppTheme();
  const { language } = useLocalization();
  const weekdays =
    language === 'pt' ? ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'] : ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const locale = language === 'pt' ? 'pt-BR' : 'en-US';
  const [containerWidth, setContainerWidth] = useState(0);
  const gridBleed = containerWidth / 14;
  const byDate = useMemo(() => {
    const result = new Map<string, { date: string; noteId?: string }[]>();
    for (const log of logs) result.set(log.date, [...(result.get(log.date) ?? []), log]);
    return result;
  }, [logs]);
  const firstWeekday = new Date(month.getFullYear(), month.getMonth(), 1).getDay();
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells = Array.from(
    { length: Math.ceil((firstWeekday + days) / 7) * 7 },
    (_, index) => index - firstWeekday + 1
  );

  return (
    <View
      onLayout={(event) => {
        const nextWidth = event.nativeEvent.layout.width;
        setContainerWidth((currentWidth) =>
          currentWidth === nextWidth ? currentWidth : nextWidth
        );
      }}
    >
      <View className="flex-row mb-6" style={{ marginHorizontal: -gridBleed }}>
        <Pressable
          onPress={() => onChangeMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
          accessibilityRole="button"
          accessibilityLabel={translate('Previous month')}
          hitSlop={10}
          className="h-10 items-center justify-center"
          style={{ width: '14.2857%' }}
        >
          <CaretLeftIcon size={18} color={themeColors.body} />
        </Pressable>
        <View className="items-center justify-center" style={{ width: '71.4286%' }}>
          <Text className="font-sans-semibold text-base text-theme-foreground">
            {month.toLocaleDateString(locale, {
              month: 'long',
              year: 'numeric',
            })}
          </Text>
        </View>

        <Pressable
          onPress={() => onChangeMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
          accessibilityRole="button"
          accessibilityLabel={translate('Next month')}
          hitSlop={10}
          className="h-10 items-center justify-center"
          style={{ width: '14.2857%' }}
        >
          <CaretRightIcon size={18} color={themeColors.body} />
        </Pressable>
      </View>

      <View className="flex-row mb-2" style={{ marginHorizontal: -gridBleed }}>
        {weekdays.map((day, index) => (
          <Text
            key={index}
            className="flex-1 text-center font-sans-medium text-xs text-theme-muted"
          >
            {day}
          </Text>
        ))}
      </View>

      <View className="flex-row flex-wrap" style={{ marginHorizontal: -gridBleed }}>
        {cells.map((day, index) => {
          if (day < 1 || day > days)
            return <View key={index} style={{ width: '14.2857%', height: 48 }} />;
          const key = localDateKey(new Date(month.getFullYear(), month.getMonth(), day));
          const dayLogs = byDate.get(key) ?? [];
          const hasNote = dayLogs.some((log) => log.noteId);
          const selected = key === selectedDate;
          return (
            <Pressable
              key={index}
              onPress={() => onPressDate(key)}
              accessibilityRole="button"
              accessibilityLabel={`${month.toLocaleDateString(locale, { month: 'long' })} ${day}${dayLogs.length ? `, ${translate(loggedLabel)}` : ''}${hasNote ? `, ${translate('note available')}` : ''}`}
              style={{ width: '14.2857%', height: 48 }}
              className="items-center justify-center"
            >
              <View
                className={`w-9 h-9 rounded-full items-center justify-center ${selected ? 'bg-theme-amber' : dayLogs.length ? 'bg-theme-amber/20' : ''}`}
              >
                <Text
                  className={`font-sans-medium text-sm ${selected ? 'text-theme-canvas' : dayLogs.length ? 'text-theme-amber' : 'text-theme-secondary'}`}
                >
                  {day}
                </Text>
              </View>
              {hasNote && <View className="absolute bottom-0 w-1 h-1 rounded-full bg-amber-300" />}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
