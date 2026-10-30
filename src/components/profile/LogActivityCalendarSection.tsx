import { ThemedModal as Modal } from '@/components/ThemedModal';
import { useAppTheme, type ThemeColors } from '@/lib/theme';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { BookOpen, Gamepad2, LayoutGrid, ChevronLeft, ChevronRight, X } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { localDayKey, parseDayKey } from '@/lib/library/activity';
import { getLogActivity, type LoggedItem, type LogActivityFilter } from '@/lib/library/logActivity';
import type { LibraryItem } from '@/lib/library/types';
import { LocalizedText } from '@/components/LocalizedText';
import { translate, useLocalization } from '@/lib/i18n';

const COLORS = (themeColors: ThemeColors, isDark: boolean) => ({
  streak: themeColors.blue,
  reading: isDark ? '#1e3a5f' : '#dbeafe',
  empty: themeColors.surface,
});

export function LogActivityCalendarSection({ items }: { items: LibraryItem[] }) {
  const { colors: themeColors, isDark } = useAppTheme();
  const { language } = useLocalization();
  const locale = language === 'pt' ? 'pt-BR' : 'en-US';
  const [month, setMonth] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );
  const [filter, setFilter] = useState<LogActivityFilter>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const year = month.getFullYear();
  const today = localDayKey(new Date());
  const activity = useMemo(
    () => getLogActivity(items, year, parseDayKey(today)!, filter),
    [items, year, today, filter]
  );
  const selectedItems = selectedDay ? (activity.byDay[selectedDay] ?? []) : [];
  const calendarWeekday = new Date(year, month.getMonth(), 1).getDay();
  const firstWeekday = language === 'pt' ? (calendarWeekday + 6) % 7 : calendarWeekday;
  const days = new Date(year, month.getMonth() + 1, 0).getDate();
  const cells = Array.from(
    { length: Math.ceil((firstWeekday + days) / 7) * 7 },
    (_, index) => index - firstWeekday + 1
  );
  const openItem = (book: LoggedItem) => {
    setSelectedDay(null);
    router.push({ pathname: '/card/[id]', params: { id: book.id } });
  };
  return (
    <View className="border-t border-theme-raised px-8 py-6">
      <View className="flex-row items-center justify-between gap-3">
        <Text className="min-w-0 flex-1 font-sans-semibold text-sm uppercase tracking-wider text-theme-heading">
          <LocalizedText>Activity</LocalizedText>
        </Text>
        <View
          accessibilityLabel={translate('Filter activity by type')}
          className="shrink-0 flex-row items-center gap-2"
        >
          {(
            [
              { type: null, label: 'All', icon: LayoutGrid },
              { type: 'book', label: 'Books', icon: BookOpen },
              { type: 'game', label: 'Games', icon: Gamepad2 },
            ] as const
          ).map(({ type, label, icon: Icon }) => {
            const selected = filter === type;
            return (
              <Button
                key={label}
                accessibilityLabel={translate(label)}
                icon={<Icon size={20} strokeWidth={2} />}
                size="small"
                compact
                iconSize={16}
                textWeight={selected ? 'semibold' : 'medium'}
                variant={selected ? 'primary' : 'secondary'}
                selected={selected}
                onPress={() => {
                  setSelectedDay(null);
                  setFilter(type);
                }}
              />
            );
          })}
        </View>
      </View>
      <View className="my-4 gap-1">
        <Text className="font-sans text-sm text-theme-secondary">
          {translate('Best activity streak in %{year}', { year })}
        </Text>
        <Text
          accessibilityLabel={translate(
            activity.bestStreak === 1
              ? 'Best activity streak in %{year}: 1 day'
              : 'Best activity streak in %{year}: %{count} days',
            { year, count: activity.bestStreak }
          )}
          className="font-sans-semibold text-3xl text-theme-blue"
        >
          {translate(activity.bestStreak === 1 ? '1 day' : '%{count} days', {
            count: activity.bestStreak,
          })}
        </Text>
      </View>
      <View className="mb-4 flex-row items-center justify-between">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={translate('Previous activity month')}
          className="h-12 w-12 items-start justify-center"
          onPress={() => {
            setSelectedDay(null);
            setMonth(new Date(year, month.getMonth() - 1, 1));
          }}
        >
          <ChevronLeft size={18} color={themeColors.body} />
        </Pressable>
        <Text className="font-sans-semibold text-base text-theme-foreground">
          {month.toLocaleDateString(locale, { month: 'long', year: 'numeric' })}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={translate('Next activity month')}
          className="h-12 w-12 items-end justify-center"
          onPress={() => {
            setSelectedDay(null);
            setMonth(new Date(year, month.getMonth() + 1, 1));
          }}
        >
          <ChevronRight size={18} color={themeColors.body} />
        </Pressable>
      </View>
      <View className="mb-2 flex-row">
        {(language === 'pt'
          ? ['S', 'T', 'Q', 'Q', 'S', 'S', 'D']
          : ['S', 'M', 'T', 'W', 'T', 'F', 'S']
        ).map((day, index) => (
          <Text
            key={index}
            className="flex-1 text-center font-sans-medium text-xs text-theme-muted"
          >
            {day}
          </Text>
        ))}
      </View>
      <View className="flex-row flex-wrap">
        {cells.map((day, index) => {
          if (day < 1 || day > days)
            return <View key={index} style={{ width: '14.2857%', height: 64 }} />;
          const date = new Date(year, month.getMonth(), day);
          const key = localDayKey(date);
          const books = activity.byDay[key] ?? [];
          const streak = activity.bestStreakDays.has(key);
          const backgroundColor = streak
            ? COLORS(themeColors, isDark).streak
            : books.length
              ? COLORS(themeColors, isDark).reading
              : COLORS(themeColors, isDark).empty;
          return (
            <Pressable
              key={key}
              disabled={books.length === 0}
              accessibilityRole={books.length ? 'button' : 'text'}
              accessibilityLabel={`${date.toLocaleDateString(locale, { month: 'long', day: 'numeric', year: 'numeric' })}, ${books.length} ${translate('cards logged')}${streak ? `, ${translate('best activity streak')}` : ''}${books.length ? `, ${books.map((book) => book.title).join(', ')}` : ''}`}
              onPress={() => (books.length === 1 ? openItem(books[0]) : setSelectedDay(key))}
              style={{ width: '14.2857%', height: 64, padding: 2 }}
            >
              <View
                testID={`activity-day-${key}`}
                style={{ backgroundColor }}
                className={`flex-1 overflow-hidden rounded-xl p-1 ${key === today ? 'border border-theme-foreground' : ''}`}
              >
                <View className="flex-row items-center justify-between gap-0.5">
                  <Text
                    className={`font-sans-medium text-xs ${streak ? 'text-theme-canvas' : books.length ? 'text-theme-foreground' : 'text-theme-muted'}`}
                  >
                    {day}
                  </Text>
                  {books.length > 1 && (
                    <Text
                      testID={`activity-count-${key}`}
                      className={`font-sans-semibold text-[9px] ${streak ? 'text-theme-canvas' : 'text-theme-secondary'}`}
                    >
                      {books.length}
                    </Text>
                  )}
                </View>
                <View
                  className="flex-1 flex-row items-end justify-center gap-0.5 pt-1"
                  pointerEvents="none"
                  accessibilityElementsHidden
                  importantForAccessibility="no-hide-descendants"
                >
                  {books.slice(0, 2).map((book) => (
                    <View
                      key={book.id}
                      testID={`activity-stack-${key}-${book.id}`}
                      style={{
                        flex: 1,
                        maxWidth: 18,
                        aspectRatio: 18 / 26,
                      }}
                    >
                      <ActivityCover key={book.cover ?? book.id} book={book} />
                    </View>
                  ))}
                </View>
              </View>
            </Pressable>
          );
        })}
      </View>
      <View className="mt-4 flex-row flex-wrap items-center justify-center gap-x-4 gap-y-2">
        <Legend
          color={COLORS(themeColors, isDark).streak}
          label={translate('Best %{year} streak', { year })}
        />
        <Legend color={COLORS(themeColors, isDark).reading} label={translate('Active days')} />
        <Legend color={COLORS(themeColors, isDark).empty} label={translate('No activity')} />
      </View>
      {activity.activeDays === 0 && (
        <Text className="mt-4 font-sans text-sm text-theme-muted">
          <LocalizedText>No activity logs recorded for </LocalizedText>
          {year}
          <LocalizedText>.</LocalizedText>
        </Text>
      )}
      <Modal
        visible={selectedItems.length > 0}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedDay(null)}
      >
        <View className="flex-1 justify-end bg-black/60">
          <SafeAreaView edges={['bottom']} className="max-h-[80%] rounded-t-3xl bg-theme-canvas">
            <View className="flex-row items-center justify-between gap-4 px-6 py-4">
              <Text className="flex-1 font-sans-semibold text-xl text-theme-foreground">
                {selectedDay
                  ? parseDayKey(selectedDay)?.toLocaleDateString(locale)
                  : translate('Activity logs')}
              </Text>
              <Button
                accessibilityLabel={translate('Close activity cards')}
                size="small"
                icon={<X size={20} color={themeColors.foreground} />}
                onPress={() => setSelectedDay(null)}
              />
            </View>
            <ScrollView contentContainerClassName="px-6 pb-6">
              {selectedItems.map((book) => (
                <Pressable
                  key={book.id}
                  accessibilityRole="button"
                  accessibilityLabel={translate('Open activity card %{title}', {
                    title: book.title,
                  })}
                  onPress={() => openItem(book)}
                  className="min-h-16 flex-row items-center gap-4 border-b border-theme-raised py-3"
                >
                  <View style={{ width: 32, height: 48 }}>
                    <ActivityCover key={book.cover ?? book.id} book={book} />
                  </View>
                  <View className="flex-1 gap-1">
                    <Text className="font-sans-medium text-base text-theme-heading">
                      {book.title}
                    </Text>
                    <Text className="font-sans text-xs text-theme-muted">
                      {translate(book.type === 'book' ? 'Book' : 'Game')}
                      {book.type === 'book' && book.authors.length
                        ? ` · ${book.authors.join(', ')}`
                        : ''}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
}

function ActivityCover({ book }: { book: LoggedItem }) {
  const { colors: themeColors } = useAppTheme();
  const [failed, setFailed] = useState(false);
  return book.cover && !failed ? (
    <Image
      key={book.cover}
      source={{ uri: book.cover }}
      contentFit="cover"
      style={{ width: '100%', height: '100%', borderRadius: 2 }}
      onError={() => setFailed(true)}
    />
  ) : (
    <View className="flex-1 items-center justify-center rounded-sm bg-theme-raised">
      {book.type === 'book' ? (
        <BookOpen size={14} color={themeColors.secondary} />
      ) : (
        <Gamepad2 size={14} color={themeColors.secondary} />
      )}
    </View>
  );
}
function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View className="flex-row items-center gap-1.5">
      <View
        style={{
          backgroundColor: color,
          width: 10,
          height: 10,
          borderRadius: 3,
        }}
      />
      <Text className="font-sans text-[10px] text-theme-secondary">{label}</Text>
    </View>
  );
}
