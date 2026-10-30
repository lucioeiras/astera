import { translate, useLocalization } from '@/lib/i18n';
import {
  additionLevel,
  getAdditionYears,
  getYearWeeks,
  localDayKey,
  parseDayKey,
} from '@/lib/library/activity';
import { useAppTheme } from '@/lib/theme';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { ProfileSelect } from './ProfileSelect';

export function AdditionHeatmap({
  byDay,
  onPressDate,
}: {
  byDay: Record<string, number>;
  onPressDate: (day: string) => void;
}) {
  const { language } = useLocalization();
  const { isDark } = useAppTheme();
  const locale = language === 'pt' ? 'pt-BR' : 'en-US';
  const currentYear = new Date().getFullYear();
  const [selectedYear, setYear] = useState(currentYear);
  const years = getAdditionYears(byDay, currentYear);
  const year = years.includes(selectedYear) ? selectedYear : currentYear;
  const weeks = useMemo(() => getYearWeeks(year, language === 'pt'), [year, language]);
  const today = localDayKey(new Date());
  const scrollRef = useRef<ScrollView>(null);
  const [viewportWidth, setViewportWidth] = useState(0);
  const [contentWidth, setContentWidth] = useState(0);
  useEffect(() => {
    if (!viewportWidth || !contentWidth) return;
    const weekIndex = weeks.findIndex((week) => week.includes(today));
    const target = weekIndex < 0 ? 0 : weekIndex * 16 + 8 - viewportWidth / 2;
    scrollRef.current?.scrollTo({
      x: Math.max(0, Math.min(target, contentWidth - viewportWidth)),
      animated: false,
    });
  }, [weeks, today, viewportWidth, contentWidth]);
  const palette = isDark
    ? ['#242427', '#1e3a5f', '#24558a', '#347bb5', '#73b9ed']
    : ['#e9e9ed', '#dbeafe', '#93c5fd', '#3b82f6', '#1e40af'];
  return (
    <View className="border-t border-theme-raised px-8 py-6" style={{ zIndex: 2 }}>
      <View className="mb-3 flex-row items-center justify-between gap-3" style={{ zIndex: 2 }}>
        <Text className="min-w-0 flex-1 font-sans-semibold text-sm uppercase tracking-wider text-theme-heading">
          {translate('Annual additions')}
        </Text>
        <ProfileSelect
          align="right"
          label={translate('Activity year')}
          value={String(year)}
          options={years.map((value) => ({ value: String(value), label: String(value) }))}
          onSelect={(value) => setYear(Number(value))}
        />
      </View>
      <ScrollView
        ref={scrollRef}
        onLayout={(event) => setViewportWidth(event.nativeEvent.layout.width)}
        onContentSizeChange={(width) => setContentWidth(width)}
        horizontal
        showsHorizontalScrollIndicator={false}
        accessibilityLabel={translate('Annual additions')}
      >
        <View className="flex-row">
          {weeks.map((week, index) => {
            const monthStart = week.find((day) => day?.endsWith('-01'));
            return (
              <View key={index} style={{ width: 16 }}>
                <Text
                  style={{ height: 24, width: 60 }}
                  className="font-sans text-xs text-theme-muted"
                >
                  {monthStart
                    ? parseDayKey(monthStart)?.toLocaleDateString(locale, { month: 'short' })
                    : ''}
                </Text>
                {week.map((day, weekday) =>
                  day ? (
                    <Pressable
                      key={day}
                      testID={`heatmap-day-${day}`}
                      accessibilityRole="button"
                      accessibilityLabel={translate('%{date}, %{count} cards added', {
                        date: parseDayKey(day)!.toLocaleDateString(locale, {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                        }),
                        count: byDay[day] ?? 0,
                      })}
                      disabled={day > today}
                      onPress={() => onPressDate(day)}
                      style={{ width: 16, height: 16, padding: 2 }}
                    >
                      <View
                        style={{
                          flex: 1,
                          borderRadius: 3,
                          backgroundColor:
                            day > today
                              ? isDark
                                ? '#1c1c20'
                                : '#f3f3f5'
                              : palette[additionLevel(byDay[day] ?? 0)],
                        }}
                      />
                    </Pressable>
                  ) : (
                    <View key={weekday} style={{ width: 16, height: 16 }} />
                  )
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>
      <View className="mt-5 flex-row items-center justify-center gap-0.5">
        <Text className="mr-0.5 font-sans text-[10px] text-theme-muted">{translate('Fewer')}</Text>
        {palette.map((backgroundColor, index) => (
          <View
            key={index}
            accessibilityLabel={['0', '1', '2–3', '4–6', '7+'][index]}
            style={{ width: 10, height: 10, borderRadius: 2, backgroundColor }}
          />
        ))}
        <Text className="ml-0.5 font-sans text-[10px] text-theme-muted">{translate('More')}</Text>
      </View>
    </View>
  );
}
