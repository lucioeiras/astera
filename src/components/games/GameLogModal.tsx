import { ThemedModal as Modal } from '@/components/ThemedModal';
import { useAppTheme } from '@/lib/theme';
import {
  CalendarBlankIcon,
  CheckIcon,
  NotePencilIcon,
  TrashSimpleIcon,
  XIcon,
} from 'phosphor-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LogCalendarGrid } from '@/components/activity/LogCalendarGrid';
import { monthFromKey } from '@/components/books/bookLogDates';
import type { GamePlayLog } from '@/lib/library/types';
import { LocalizedText } from '@/components/LocalizedText';
import { parseDayKey } from '@/lib/library/activity';
import { translate, useLocalization } from '@/lib/i18n';

type GameLogModalProps = {
  visible: boolean;
  existingLog?: GamePlayLog;
  initialDate: string;
  initialNote?: string;
  onSave: (date: string, note: string, existingLog?: GamePlayLog) => Promise<void>;
  onDelete: (existingLog: GamePlayLog) => Promise<void>;
  onSaved: (date: string) => void;
  onClose: () => void;
};

export function GameLogModal({
  visible,
  existingLog,
  initialNote,
  initialDate,
  onSave,
  onDelete,
  onSaved,
  onClose,
}: GameLogModalProps) {
  const { colors: themeColors } = useAppTheme();
  useLocalization();
  const insets = useSafeAreaInsets();
  const [formMonth, setFormMonth] = useState(() => monthFromKey(existingLog?.date ?? initialDate));
  const [date, setDate] = useState(() => existingLog?.date ?? initialDate);
  const [note, setNote] = useState(initialNote ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const close = () => {
    if (!saving) onClose();
  };

  const save = async () => {
    if (saving) return;
    setSaving(true);
    setError('');
    try {
      if (!parseDayKey(date)) {
        setError(translate('Choose a valid date.'));
        return;
      }
      await onSave(date, note.trim(), existingLog);
      onSaved(date);
      onClose();
    } catch (cause) {
      setError(translate(cause instanceof Error ? cause.message : 'Could not save play log.'));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = () => {
    if (!existingLog || saving) return;
    Alert.alert(translate('Remove play log?'), translate('This play entry will be removed.'), [
      { text: translate('Cancel'), style: 'cancel' },
      {
        text: translate('Remove'),
        style: 'destructive',
        onPress: async () => {
          setSaving(true);
          setError('');
          try {
            await onDelete(existingLog);
            onClose();
          } catch (cause) {
            setError(
              translate(cause instanceof Error ? cause.message : 'Could not remove play log.')
            );
          } finally {
            setSaving(false);
          }
        },
      },
    ]);
  };

  return (
    <Modal
      testID="game-log-modal"
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={close}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 bg-theme-canvas"
      >
        <View className="flex-1" style={{ paddingTop: Math.max(insets.top, 16) }}>
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ paddingTop: 20, paddingBottom: 40 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View className="gap-3 px-8 pb-8">
              <Text className="font-sans-semibold text-2xl text-theme-foreground">
                <LocalizedText>Log play</LocalizedText>
              </Text>
              <Text className="font-sans text-base text-theme-secondary leading-relaxed">
                <LocalizedText>Mark a day you played and save a thought from today.</LocalizedText>
              </Text>
            </View>

            <View className="border-t border-b border-theme-raised px-8 py-6 gap-5">
              <View className="flex-row items-center gap-2">
                <CalendarBlankIcon size={14} color={themeColors.heading} weight="bold" />
                <Text className="font-sans-semibold text-sm tracking-wider uppercase text-theme-heading">
                  <LocalizedText>Play date</LocalizedText>
                </Text>
              </View>

              <LogCalendarGrid
                month={formMonth}
                logs={[]}
                selectedDate={date}
                onChangeMonth={setFormMonth}
                onPressDate={setDate}
              />
            </View>

            <View className="px-8 py-6 gap-4">
              <View className="flex-row items-center gap-2">
                <NotePencilIcon size={14} color={themeColors.heading} weight="bold" />
                <Text className="font-sans-semibold text-sm tracking-wider uppercase text-theme-heading">
                  <LocalizedText>Note</LocalizedText>
                </Text>
              </View>
              <TextInput
                value={note}
                onChangeText={setNote}
                multiline
                textAlignVertical="top"
                placeholder={translate('What stood out today?')}
                placeholderTextColor={themeColors.muted}
                accessibilityLabel={translate('Play note')}
                className="min-h-24 font-sans text-base text-theme-bright leading-relaxed"
              />
            </View>

            {!!error && (
              <View className="mx-8 rounded-xl border border-rose-800/60 bg-theme-pink/10 p-4">
                <Text className="font-sans text-sm text-theme-pink leading-relaxed">{error}</Text>
              </View>
            )}
          </ScrollView>

          <View className="flex-row border-t border-theme-raised bg-theme-canvas">
            <Pressable
              onPress={close}
              disabled={saving}
              accessibilityRole="button"
              accessibilityLabel={translate('Cancel')}
              className="flex-1 flex-row items-center justify-center gap-3 border-r border-theme-raised pt-6 active:bg-theme-surface"
              style={{ paddingBottom: Math.max(insets.bottom, 24) }}
            >
              <XIcon size={20} color={themeColors.foreground} weight="bold" />
              <Text className="font-sans-bold text-lg text-theme-foreground">
                <LocalizedText>Cancel</LocalizedText>
              </Text>
            </Pressable>
            {existingLog && (
              <Pressable
                onPress={confirmDelete}
                disabled={saving}
                accessibilityRole="button"
                accessibilityLabel={translate('Remove play log')}
                className="flex-1 flex-row items-center justify-center gap-3 border-r border-theme-raised pt-6 active:bg-theme-surface"
                style={{ paddingBottom: Math.max(insets.bottom, 24) }}
              >
                <TrashSimpleIcon size={20} color={themeColors.red} />
                <Text className="font-sans-semibold text-lg text-theme-pink">
                  <LocalizedText>Remove</LocalizedText>
                </Text>
              </Pressable>
            )}
            <Pressable
              onPress={save}
              disabled={saving}
              accessibilityRole="button"
              accessibilityLabel={translate('Save play log')}
              className="flex-1 flex-row items-center justify-center gap-3 pt-6 active:bg-theme-surface"
              style={{ paddingBottom: Math.max(insets.bottom, 24) }}
            >
              {saving ? (
                <ActivityIndicator size={20} color="#F59E0B" />
              ) : (
                <CheckIcon size={20} color="#F59E0B" weight="bold" />
              )}
              <Text className="font-sans-semibold text-lg text-theme-amber">
                <LocalizedText>Save log</LocalizedText>
              </Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
