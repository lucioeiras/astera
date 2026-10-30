import { AdditionHeatmap } from '@/components/profile/AdditionHeatmap';
import { CompletionTimeline } from '@/components/profile/CompletionTimeline';
import { Button } from '@/components/Button';
import { LocalizedText } from '@/components/LocalizedText';
import { ActivityCalendar } from '@/components/profile/ActivityCalendar';
import { CompletionChart } from '@/components/profile/CompletionChart';
import { CompletionTypeFilters } from '@/components/profile/CompletionTypeFilters';
import { LogActivityCalendarSection } from '@/components/profile/LogActivityCalendarSection';
import { ProfileSelect } from '@/components/profile/ProfileSelect';
import { useLibrary } from '@/hooks/useLibrary';
import { translate, useLocalization } from '@/lib/i18n';
import {
  getLibraryActivity,
  getMonthlyCompletions,
  type TrackableType,
} from '@/lib/library/activity';
import { useAppTheme } from '@/lib/theme';
import { router } from 'expo-router';
import { Settings } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const { colors: themeColors } = useAppTheme();
  useLocalization();
  const { state, source, currentFolderName, setSearchQuery, clearSearchTag, refresh } =
    useLibrary();
  const currentYear = new Date().getFullYear();
  const [month, setMonth] = useState(() => new Date(currentYear, new Date().getMonth(), 1));
  const [selectedYear, setYear] = useState(currentYear);
  const [type, setType] = useState<TrackableType | null>(null);
  const items = useMemo(() => (state.status === 'ready' ? state.result.items : []), [state]);
  const activity = useMemo(() => getLibraryActivity(items, currentYear), [items, currentYear]);
  const year = activity.years.includes(selectedYear) ? selectedYear : currentYear;
  const completions = useMemo(() => getMonthlyCompletions(items, year, type), [items, year, type]);
  const openDay = (day: string) => {
    setSearchQuery('');
    clearSearchTag();
    router.navigate({
      pathname: '/board',
      params: {
        addedOn: day,
        activityToken: String(Date.now()),
        folderKind: '',
        folderKey: '',
      },
    });
  };
  return (
    <SafeAreaView className="flex-1 bg-theme-canvas" edges={['top', 'left', 'right']}>
      <ScrollView contentContainerClassName="pt-5 pb-40" showsVerticalScrollIndicator={false}>
        <View className="flex-row items-center justify-between gap-4 px-8 pb-8">
          <View className="flex-1 flex-row gap-3 items-center">
            <Text className="font-sans-semibold text-2xl text-theme-foreground">
              <LocalizedText>Profile</LocalizedText>
            </Text>
            <Text className="font-sans text-base text-theme-secondary leading-tight">
              {currentFolderName}
            </Text>
          </View>
          <Button
            accessibilityLabel={translate('Settings')}
            size="small"
            icon={<Settings size={20} color={themeColors.foreground} />}
            onPress={() => router.push('/settings')}
          />
        </View>
        {state.status === 'loading' && (
          <ActivityIndicator
            accessibilityLabel={translate('Loading profile')}
            color={themeColors.muted}
          />
        )}
        {state.status === 'error' && (
          <View className="gap-4 px-8">
            <Text className="font-sans text-base text-theme-secondary">
              <LocalizedText>Could not load your library.</LocalizedText>
            </Text>
            <Button
              accessibilityLabel={translate('Retry loading library')}
              text={translate('Try again')}
              onPress={() => void refresh()}
            />
          </View>
        )}

        {state.status === 'ready' && (
          <>
            {activity.total === 0 && (
              <Text className="px-8 pt-6 font-sans text-base text-theme-secondary">
                <LocalizedText>Save your first card to start your library activity.</LocalizedText>
              </Text>
            )}

            <View className="border-t border-theme-raised px-8 py-6">
              <Text className="mb-2 font-sans-semibold text-sm uppercase tracking-wider text-theme-heading">
                <LocalizedText>Added cards</LocalizedText>
              </Text>
              <Text className="mb-4 font-sans text-sm text-theme-muted">
                <LocalizedText>Tap a day to see the cards you saved.</LocalizedText>
              </Text>
              <ActivityCalendar
                month={month}
                byDay={activity.byDay}
                onChangeMonth={setMonth}
                onPressDate={openDay}
              />
            </View>

            <AdditionHeatmap
              key={`additions:${JSON.stringify(source)}`}
              byDay={activity.byDay}
              onPressDate={openDay}
            />

            <LogActivityCalendarSection items={items} />

            <View className="border-t border-theme-raised py-6" style={{ zIndex: 1 }}>
              <Text className="mb-4 px-8 font-sans-semibold text-sm uppercase tracking-wider text-theme-heading">
                <LocalizedText>Completed cards</LocalizedText>
              </Text>
              <View className="flex-row items-center gap-2 pl-8" style={{ zIndex: 1 }}>
                <ProfileSelect
                  label={translate('Year')}
                  value={String(year)}
                  options={activity.years.map((y) => ({
                    value: String(y),
                    label: String(y),
                  }))}
                  onSelect={(value) => setYear(Number(value))}
                />
                <CompletionTypeFilters selectedType={type} onSelect={setType} iconOnly />
              </View>
              <View className="px-8">
                <CompletionChart months={completions.months} year={year} />
                {completions.undated > 0 && (
                  <Text className="mt-4 font-sans text-sm leading-relaxed text-theme-muted">
                    {completions.undated}{' '}
                    <LocalizedText>
                      completed card(s) have no completion date and are not included in this chart.
                    </LocalizedText>
                  </Text>
                )}
              </View>
            </View>
            <CompletionTimeline key={`timeline:${JSON.stringify(source)}`} items={items} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
