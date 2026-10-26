import { ThemedModal as Modal } from '@/components/ThemedModal';
import { useAppTheme, type ThemeColors } from '@/lib/theme';
import { Check, FileText, SquarePen, Type, X } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActionFooter } from '@/components/ActionFooter';
import { Button } from '@/components/Button';
import { PdfPreview } from '@/components/PdfPreview';
import { TagsBox } from '@/components/TagsBox';
import { useLibrary } from '@/hooks/useLibrary';
import type { PickedPdfAsset } from '@/lib/library/storage';
import type { PdfItem } from '@/lib/library/types';
import { generateAutoTagsAsync, isGibberishOrMachineId } from '@/lib/tags/autoTags';
import { LocalizedText } from '@/components/LocalizedText';
import { translate, useLocalization } from '@/lib/i18n';

function getCleanPdfTitle(fileName?: string | null): string {
  if (!fileName) return '';
  const nameWithoutExt = fileName.replace(/\.[a-zA-Z0-9]{2,5}$/, '').trim();
  if (isGibberishOrMachineId(nameWithoutExt)) return '';
  return nameWithoutExt.replace(/[-_]+/g, ' ').trim();
}

type NewPdfModalProps = {
  visible: boolean;
  pdfAsset: PickedPdfAsset | null;
  onClose: () => void;
  onDismiss?: () => void;
  onSaved?: (item: PdfItem) => void;
};

export function NewPdfModal({ visible, pdfAsset, onClose, onDismiss, onSaved }: NewPdfModalProps) {
  const { colors: themeColors } = useAppTheme();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);
  useLocalization();
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const titleInputRef = useRef<TextInput>(null);
  const tagsInputRef = useRef<TextInput>(null);
  const noteInputRef = useRef<TextInput>(null);
  const [autoTags, setAutoTags] = useState<string[]>([]);
  const autoTagsRef = useRef<string[]>([]);

  const { addPdf, getTags } = useLibrary();
  const insets = useSafeAreaInsets();

  const existingTags = useMemo(
    () => (visible ? getTags().map((t) => t.tag) : []),
    [getTags, visible]
  );

  const updateAutoTags = useCallback((newAutoTags: string[]) => {
    const prevAutoTags = autoTagsRef.current;
    const combinedAutoTags = [...prevAutoTags];
    for (const t of newAutoTags) {
      if (!combinedAutoTags.includes(t)) {
        combinedAutoTags.push(t);
      }
    }
    autoTagsRef.current = combinedAutoTags;
    setAutoTags(combinedAutoTags);

    setTags((prev) => {
      const manualTags = prev.filter((t) => !prevAutoTags.includes(t));
      const merged = [...manualTags];
      for (const t of combinedAutoTags) {
        if (!merged.includes(t)) {
          merged.push(t);
        }
      }
      return merged;
    });
  }, []);

  const clearAutoTags = useCallback(() => {
    setTags((prev) => prev.filter((t) => !autoTagsRef.current.includes(t)));
    autoTagsRef.current = [];
    setAutoTags([]);
  }, []);

  const fallbackTitle = getCleanPdfTitle(pdfAsset?.fileName);

  useEffect(() => {
    if (!visible) return;

    const timer = setTimeout(() => {
      titleInputRef.current?.focus();
    }, 100);

    return () => clearTimeout(timer);
  }, [visible]);

  useEffect(() => {
    if (!visible) return;

    const cleanTitle = title.trim();
    const cleanNote = note.trim();

    const textToAnalyze = cleanTitle || cleanNote || fallbackTitle;
    if (!textToAnalyze) {
      clearAutoTags();
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const auto = await generateAutoTagsAsync({
          title: cleanTitle || fallbackTitle,
          note: cleanNote,
          type: 'pdf',
          existingTags,
        });
        if (auto.length > 0) {
          updateAutoTags(auto);
        }
      } catch (e) {
        console.warn('Failed to generate pdf tags:', e);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [visible, title, note, fallbackTitle, existingTags, updateAutoTags, clearAutoTags]);

  const handleClose = () => {
    if (saving) return;
    setTitle('');
    setTags([]);
    setAutoTags([]);
    autoTagsRef.current = [];
    setTagInput('');
    setNote('');
    onClose();
  };

  const handleSave = async () => {
    if (!pdfAsset || saving) return;

    setSaving(true);
    try {
      const finalTags = [...tags];
      const pending = tagInput.replace(/^#/, '').trim();
      if (pending && !finalTags.includes(pending)) {
        finalTags.push(pending);
      }
      const savedAutoTags = autoTagsRef.current.filter((t) => finalTags.includes(t));

      const item = await addPdf(pdfAsset, {
        title: title.trim() || fallbackTitle || undefined,
        note: note.trim() || undefined,
        tags: finalTags.length > 0 ? finalTags : undefined,
        autoTags: savedAutoTags.length > 0 ? savedAutoTags : undefined,
      });

      setTitle('');
      setTags([]);
      setAutoTags([]);
      autoTagsRef.current = [];
      setTagInput('');
      setNote('');
      onSaved?.(item);
      onClose();
    } catch (e) {
      console.error('Failed to save PDF:', e);
      Alert.alert(translate('Error'), e instanceof Error ? e.message : 'Failed to save PDF');
    } finally {
      setSaving(false);
    }
  };

  if (!pdfAsset && !visible) {
    return null;
  }

  const canSave = Boolean(pdfAsset) && !saving;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={handleClose}
      onDismiss={onDismiss}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <View
          style={{
            paddingTop: Math.max(insets.top, 16),
          }}
          className="flex-1 w-full relative"
        >
          <ScrollView
            className="flex-1 w-full"
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View className="flex-row p-8 pt-0 gap-8 items-center max-h-48 border-b border-theme-raised">
              <View className="w-20 h-24 bg-theme-foreground border border-theme-raised rounded-sm shadow-md overflow-hidden items-center justify-center">
                {pdfAsset?.uri ? (
                  <PdfPreview uri={pdfAsset.uri} />
                ) : (
                  <FileText size={36} color="#ef4444" strokeWidth={2} />
                )}
              </View>

              <View className="flex-1 gap-2">
                <Text className="font-sans-semibold text-2xl text-theme-foreground">
                  <LocalizedText>Add a new PDF</LocalizedText>
                </Text>
                <Text
                  className="font-sans text-base text-theme-secondary leading-relaxed"
                  numberOfLines={2}
                >
                  {pdfAsset?.fileName || translate('PDF Document')}
                </Text>
              </View>
            </View>

            {/* Title Input */}
            <View className="flex-row items-center gap-4 py-5 px-8 border-b border-theme-raised">
              <Type size={20} color={themeColors.body} />

              <TextInput
                ref={titleInputRef}
                value={title}
                onChangeText={setTitle}
                placeholder={translate('Add a title to this PDF')}
                placeholderTextColor={themeColors.muted}
                returnKeyType="next"
                onSubmitEditing={() => {
                  tagsInputRef.current?.focus();
                }}
                className="w-full font-sans text-xl text-theme-foreground leading-tight"
                style={styles.borderlessInput}
                underlineColorAndroid="transparent"
              />
            </View>

            {/* Tags section */}
            <TagsBox
              tags={tags}
              autoTags={autoTags}
              onTagsChange={setTags}
              onAutoTagsChange={setAutoTags}
              tagInput={tagInput}
              onTagInputChange={setTagInput}
              inputRef={tagsInputRef}
              onSubmitEditing={() => {
                noteInputRef.current?.focus();
              }}
              onRemoveTag={(removed) => {
                autoTagsRef.current = autoTagsRef.current.filter((t) => t !== removed);
              }}
            />

            {/* Notes section */}
            <View className="flex-1 py-6 px-8 gap-4">
              <View className="flex-row items-center gap-2">
                <SquarePen size={14} color={themeColors.heading} strokeWidth={2.5} />
                <Text className="font-sans-semibold text-sm tracking-wider uppercase text-theme-heading">
                  <LocalizedText>Note</LocalizedText>
                </Text>
              </View>

              <Pressable onPress={() => noteInputRef.current?.focus()} className="w-full">
                <TextInput
                  ref={noteInputRef}
                  value={note}
                  onChangeText={setNote}
                  placeholder={translate('Add a text note to this PDF...')}
                  placeholderTextColor={themeColors.muted}
                  multiline
                  textAlignVertical="top"
                  className="w-full font-sans text-base text-theme-bright leading-relaxed min-h-[96px]"
                  style={styles.borderlessInput}
                  underlineColorAndroid="transparent"
                />
              </Pressable>
            </View>
          </ScrollView>

          {/* Action buttons at the bottom */}
          <ActionFooter bottomInset={insets.bottom}>
            <Button
              accessibilityLabel={translate('Cancel')}
              onPress={handleClose}
              disabled={saving}
              icon={<X size={20} color={themeColors.foreground} strokeWidth={2.5} />}
              text={translate('Cancel')}
            />
            <Button
              accessibilityLabel={translate('Save PDF')}
              variant="primary"
              onPress={handleSave}
              disabled={!canSave}
              icon={
                saving ? (
                  <ActivityIndicator size={20} color={themeColors.inverse} />
                ) : (
                  <Check
                    size={20}
                    color={canSave ? themeColors.inverse : themeColors.muted}
                    strokeWidth={2.5}
                  />
                )
              }
              text={translate('Save PDF')}
            />
          </ActionFooter>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const createStyles = (themeColors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      width: '100%',
      backgroundColor: themeColors.canvas,
    },
    scrollContent: {
      flexGrow: 1,
      paddingVertical: 20,
      paddingBottom: 40,
    },
    borderlessInput: {
      borderWidth: 0,
      backgroundColor: 'transparent',
    },
  });
