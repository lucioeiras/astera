import { ThemedModal as Modal } from '@/components/ThemedModal';
import { useAppTheme } from '@/lib/theme';
import { GameControllerIcon, XIcon } from 'phosphor-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { LocalizedText } from '@/components/LocalizedText';
import { LogCalendarGrid } from '@/components/activity/LogCalendarGrid';
import { localDateKey, monthFromKey } from '@/components/books/bookLogDates';
import { GameLogModal } from './GameLogModal';
import { parseDayKey } from '@/lib/library/activity';
import type { GameItem, GamePlayLog } from '@/lib/library/types';
import { translate, useLocalization } from '@/lib/i18n';

export function GameLogs({
  game,
  onSave,
  onDelete,
  getNoteText,
  openOnMount = false,
}: {
  game: GameItem;
  onSave: (date: string, note: string, existingLog?: GamePlayLog) => Promise<void>;
  onDelete: (log: GamePlayLog) => Promise<void>;
  getNoteText: (id: string) => string | undefined;
  openOnMount?: boolean;
}) {
  const { colors: themeColors } = useAppTheme();
  const { language } = useLocalization();
  const logs = game.playLogs ?? [];
  const canCreate = game.progressStatus === 'in-progress';
  const [month, setMonth] = useState(() => monthFromKey(localDateKey(new Date())));
  const [selectedDate, setSelectedDate] = useState<string>();
  const [listDate, setListDate] = useState<string>();
  const [form, setForm] = useState<{
    key: number;
    log?: GamePlayLog;
    date: string;
  } | null>(() => (openOnMount && canCreate ? { key: 0, date: localDateKey(new Date()) } : null));
  const entries = logs
    .filter((log) => log.date === listDate)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id));
  const openForm = (date: string, log?: GamePlayLog) => {
    setListDate(undefined);
    setForm({ key: Date.now(), date, log });
  };
  return (
    <View className="border-b border-theme-raised pt-6 gap-5">
      <View className="flex-row items-center gap-2 px-6">
        <GameControllerIcon size={14} color={themeColors.foreground} weight="bold" />
        <Text className="font-sans-semibold text-sm tracking-wider uppercase text-theme-heading">
          <LocalizedText>Play logs</LocalizedText>
        </Text>
      </View>
      <View className="mb-8 px-6">
        <LogCalendarGrid
          month={month}
          logs={logs}
          loggedLabel="play logged"
          selectedDate={selectedDate}
          onChangeMonth={setMonth}
          onPressDate={(date) => {
            setSelectedDate(date);
            if (logs.some((log) => log.date === date)) setListDate(date);
            else if (canCreate) openForm(date);
          }}
        />
        {logs.length === 0 && (
          <Text className="mt-4 font-sans text-sm text-theme-muted">
            <LocalizedText>No play logs yet.</LocalizedText>
          </Text>
        )}
      </View>
      <Modal
        visible={!!listDate}
        transparent
        animationType="fade"
        onRequestClose={() => setListDate(undefined)}
      >
        <View className="flex-1 justify-end bg-black/60">
          <SafeAreaView edges={['bottom']} className="max-h-[80%] rounded-t-3xl bg-theme-canvas">
            <View className="flex-row items-center justify-between gap-4 px-6 py-4">
              <Text className="flex-1 font-sans-semibold text-xl text-theme-foreground">
                {listDate
                  ? parseDayKey(listDate)?.toLocaleDateString(language === 'pt' ? 'pt-BR' : 'en-US')
                  : ''}
              </Text>
              <Button
                accessibilityLabel={translate('Close play logs')}
                size="small"
                icon={<XIcon size={20} color={themeColors.foreground} />}
                onPress={() => setListDate(undefined)}
              />
            </View>
            <ScrollView contentContainerClassName="px-6 pb-6">
              {entries.map((log, index) => (
                <Pressable
                  key={log.id}
                  accessibilityRole="button"
                  accessibilityLabel={translate('Edit play log %{number}', {
                    number: index + 1,
                  })}
                  onPress={() => openForm(log.date, log)}
                  className="min-h-16 gap-2 border-b border-theme-raised py-4"
                >
                  <Text className="font-sans-medium text-sm text-theme-secondary">
                    {new Date(log.createdAt).toLocaleTimeString(
                      language === 'pt' ? 'pt-BR' : 'en-US',
                      { hour: '2-digit', minute: '2-digit' }
                    )}
                  </Text>
                  <Text className="font-sans text-base text-theme-bright" numberOfLines={3}>
                    {(log.noteId && getNoteText(log.noteId)) || translate('No note')}
                  </Text>
                </Pressable>
              ))}
              {canCreate && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={translate('Add play log')}
                  className="min-h-16 justify-center py-4"
                  onPress={() => openForm(listDate!)}
                >
                  <Text className="font-sans-semibold text-base text-theme-amber">
                    <LocalizedText>Add play log</LocalizedText>
                  </Text>
                </Pressable>
              )}
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>
      {form && (
        <GameLogModal
          key={form.key}
          visible
          initialDate={form.date}
          existingLog={form.log}
          initialNote={form.log?.noteId ? getNoteText(form.log.noteId) : undefined}
          onSave={onSave}
          onDelete={onDelete}
          onClose={() => setForm(null)}
          onSaved={(date) => {
            setMonth(monthFromKey(date));
            setSelectedDate(date);
          }}
        />
      )}
    </View>
  );
}
