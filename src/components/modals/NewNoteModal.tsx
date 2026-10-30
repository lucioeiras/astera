import { ThemedModal as Modal } from '@/components/ThemedModal';
import { useAppTheme, type ThemeColors } from '@/lib/theme';
import {
  ArrowLeft,
  Bookmark,
  Check,
  Info,
  List,
  ListChecks,
  ListOrdered,
  Music2,
  SquarePen,
  Pilcrow,
  Quote,
  Bold,
  Heading1,
  Heading3,
  Heading2,
  Italic,
  Type,
  User,
  ImagePlus,
} from 'lucide-react-native';
import { useMemo, useRef, useState } from 'react';
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
import { ModalCloseButton } from '@/components/ModalCloseButton';
import { ModalSaveButton } from '@/components/ModalSaveButton';
import { Button } from '@/components/Button';
import { MusicLyricsPicker } from '@/components/modals/MusicLyricsPicker';
import { NoteRichTextInput } from '@/components/modals/NoteRichTextInput';
import type {
  NoteFormattingAction,
  NoteRichTextInputHandle,
} from '@/components/modals/NoteRichTextInput.types';
import { SourcePicker } from '@/components/SourcePicker';
import { SourcePreview } from '@/components/SourcePreview';
import { TagsBox } from '@/components/TagsBox';

import { useLibrary } from '@/hooks/useLibrary';
import { isLinkableItem } from '@/lib/library/links';
import { isQuoteText } from '@/lib/library/quotes';
import type { NoteItem, QuoteItem } from '@/lib/library/types';
import type { MusicMetadata } from '@/lib/music/itunes';
import type { NoteLineType } from '@/lib/noteFormatting';
import { generateAutoTags, generateAutoTagsAsync } from '@/lib/tags/autoTags';
import { LocalizedText } from '@/components/LocalizedText';
import { translate, useLocalization } from '@/lib/i18n';
import * as ImagePicker from 'expo-image-picker';
import { saveNoteImage } from '@/lib/library/noteImages';
import type { PickedImageAsset } from '@/lib/library/storage';

type NewNoteModalProps = {
  visible: boolean;
  initialText?: string;
  editingItem?: NoteItem;
  onClose: () => void;
  onDismiss?: () => void;
  onSaved?: (item: NoteItem | QuoteItem) => void;
};

export function NewNoteModal({
  visible,
  initialText,
  editingItem,
  onClose,
  onDismiss,
  onSaved,
}: NewNoteModalProps) {
  const { colors: themeColors } = useAppTheme();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);
  useLocalization();
  const { addMusicItem, addTextItem, updateItem, getTags, state, source } = useLibrary();
  const insets = useSafeAreaInsets();

  const inputRef = useRef<NoteRichTextInputHandle>(null);
  const editingItemId = editingItem?.id;
  const titleInputRef = useRef<TextInput>(null);
  const authorInputRef = useRef<TextInput>(null);
  const tagsInputRef = useRef<TextInput>(null);

  const [view, setView] = useState<'editor' | 'info'>('editor');
  const [isFormattingOpen, setIsFormattingOpen] = useState(false);
  const [text, setText] = useState(editingItem?.text ?? initialText ?? '');
  const [title, setTitle] = useState(editingItem?.title ?? '');
  const [author, setAuthor] = useState('');
  const [tags, setTags] = useState<string[]>(editingItem?.tags ?? []);
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [insertingImage, setInsertingImage] = useState(false);
  const imageImportCount = useRef(0);
  const [pickingImage, setPickingImage] = useState(false);
  const busy = saving || insertingImage || pickingImage;
  const [linkedItemId, setLinkedItemId] = useState<string | undefined>(editingItem?.linkedItemId);
  const [isLinkPickerOpen, setIsLinkPickerOpen] = useState(false);
  const [isLyricsPickerOpen, setIsLyricsPickerOpen] = useState(false);
  const [lyricsSong, setLyricsSong] = useState<MusicMetadata | null>(null);
  const [lyricsSnippet, setLyricsSnippet] = useState('');
  const libraryItems = state.status === 'ready' ? state.result.items : [];
  const linkedItem = libraryItems.find((item) => item.id === linkedItemId);
  const [autoTags, setAutoTags] = useState<string[]>(editingItem?.autoTags ?? []);
  const autoTagsRef = useRef<string[]>(editingItem?.autoTags ?? []);

  const existingTags = useMemo(
    () => (visible && state.status === 'ready' ? getTags().map((t) => t.tag) : []),
    [getTags, visible, state.status]
  );

  // The DOM may initialize after presentation; a warm editor may be ready
  // before it. Both lifecycle events must be able to request focus.
  const focusEditorOnOpen = () => {
    if (visible && view === 'editor') {
      void inputRef.current?.focus(Boolean(editingItemId)).catch(() => undefined);
    }
  };

  const handleClose = () => {
    if (busy) return;
    setText('');
    setTitle('');
    setAuthor('');
    setTags([]);
    setAutoTags([]);
    autoTagsRef.current = [];
    setTagInput('');
    setLinkedItemId(undefined);
    setIsLinkPickerOpen(false);
    setIsLyricsPickerOpen(false);
    setLyricsSong(null);
    setLyricsSnippet('');
    setView('editor');
    setIsFormattingOpen(false);
    onClose();
  };

  const handleSave = async () => {
    if (saving || pickingImage) return;

    setSaving(true);
    try {
      const trimmed = ((await inputRef.current?.getMarkdown()) ?? text).trim();
      if (!trimmed) return;

      const finalTags = [...tags];
      const pending = tagInput.replace(/^#/, '').trim();
      if (pending && !finalTags.includes(pending)) {
        finalTags.push(pending);
      }
      const savedAutoTags = autoTagsRef.current.filter((t) => finalTags.includes(t));

      let musicId = linkedItemId;
      if (lyricsSong) {
        const existing = libraryItems.find(
          (candidate) =>
            candidate.type === 'music' &&
            candidate.musicKind !== 'album' &&
            (lyricsSong.externalUrl
              ? candidate.externalUrl === lyricsSong.externalUrl
              : candidate.title === lyricsSong.title &&
                candidate.artist === lyricsSong.artist &&
                candidate.album === lyricsSong.album)
        );
        if (existing) {
          musicId = existing.id;
        } else {
          const music = await addMusicItem({
            musicKind: 'song',
            title: lyricsSong.title,
            artist: lyricsSong.artist,
            album: lyricsSong.album,
            cover: lyricsSong.cover,
            previewUrl: lyricsSong.previewUrl,
            externalUrl: lyricsSong.externalUrl,
            durationMs: lyricsSong.durationMs,
            releaseDate: lyricsSong.releaseDate,
            genre: lyricsSong.genre,
          });
          musicId = music.id;
        }
      }

      const item = editingItem
        ? ((await updateItem(editingItem.id, {
            text: trimmed,
            title: title.trim() || undefined,
            tags: finalTags.length > 0 ? finalTags : undefined,
            autoTags: savedAutoTags.length > 0 ? savedAutoTags : undefined,
            linkedItemId: musicId,
          })) as NoteItem | QuoteItem)
        : await addTextItem(trimmed, title.trim() || undefined, {
            tags: finalTags.length > 0 ? finalTags : undefined,
            autoTags: savedAutoTags.length > 0 ? savedAutoTags : undefined,
            linkedItemId: musicId,
            forceNote: Boolean(lyricsSong),
            author: isQuoteText(trimmed) && !lyricsSong ? author.trim() || undefined : undefined,
          });
      setText('');
      setTitle('');
      setAuthor('');
      setTags([]);
      setAutoTags([]);
      autoTagsRef.current = [];
      setTagInput('');
      setLinkedItemId(undefined);
      setLyricsSong(null);
      setLyricsSnippet('');
      setIsLyricsPickerOpen(false);
      setView('editor');
      setIsFormattingOpen(false);
      onSaved?.(item);
      onClose();
    } catch {
      Alert.alert(translate('Error'), translate('Could not save note. Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  const handleSwitchToInfo = async () => {
    let latestText: string;
    try {
      latestText = await inputRef.current!.getMarkdown();
    } catch {
      Alert.alert(translate('Error'), translate('Editor operation failed. Please try again.'));
      return;
    }
    // 1. Instant baseline tags
    const auto = generateAutoTags({
      title: title.trim(),
      text: latestText.trim(),
      existingTags,
    });
    if (auto.length > 0) {
      setTags((prev) => {
        const next = [...prev];
        for (const t of auto) {
          if (!next.includes(t)) {
            next.push(t);
          }
        }
        return next;
      });
      const nextAuto = [...new Set([...autoTagsRef.current, ...auto])];
      autoTagsRef.current = nextAuto;
      setAutoTags(nextAuto);
    }

    // 2. On-device LLM semantic enrichment in background
    generateAutoTagsAsync({
      title: title.trim(),
      text: latestText.trim(),
      existingTags,
    })
      .then((aiTags) => {
        if (aiTags.length > 0) {
          setTags((prev) => {
            const next = [...prev];
            for (const t of aiTags) {
              if (!next.includes(t)) {
                next.push(t);
              }
            }
            return next;
          });
          const nextAiAuto = [...new Set([...autoTagsRef.current, ...aiTags])];
          autoTagsRef.current = nextAiAuto;
          setAutoTags(nextAiAuto);
        }
      })
      .catch(() => {});

    setView('info');
  };

  const handleSwitchToEditor = () => {
    setView('editor');
    setIsFormattingOpen(false);
    titleInputRef.current?.blur();
    authorInputRef.current?.blur();
    tagsInputRef.current?.blur();
    void inputRef.current?.focus().catch(() => undefined);
  };

  const canSave = text.trim().length > 0 && !busy;

  const importImage = async (asset: PickedImageAsset): Promise<string> => {
    imageImportCount.current += 1;
    setInsertingImage(true);
    try {
      return await saveNoteImage(source, asset);
    } finally {
      imageImportCount.current -= 1;
      setInsertingImage(imageImportCount.current > 0);
    }
  };

  const handleImage = async () => {
    if (busy) return;
    setPickingImage(true);
    try {
      await inputRef.current!.captureSelection();
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 1,
      });
      if (result.canceled || !result.assets[0]) return;
      const uri = await importImage(result.assets[0]);
      await inputRef.current!.insertImage(uri);
      await inputRef.current!.focus();
    } catch {
      Alert.alert(translate('Error'), translate('Could not insert image. Please try again.'));
    } finally {
      setPickingImage(false);
    }
  };
  const isQuote = !lyricsSong && isQuoteText(text);
  const hasInfo = Boolean(
    title.trim() ||
    (isQuote && author.trim()) ||
    tags.length > 0 ||
    tagInput.trim() ||
    linkedItemId ||
    lyricsSong
  );

  const handleLyricsSelect = (snippet: string, song: MusicMetadata) => {
    setText((current) => {
      const previous = current.trimEnd();
      const base =
        lyricsSnippet && previous.endsWith(lyricsSnippet)
          ? previous.slice(0, -lyricsSnippet.length).trimEnd()
          : previous;
      return base ? `${base}\n\n${snippet}` : snippet;
    });
    setLyricsSong(song);
    setLyricsSnippet(snippet);
    setLinkedItemId(undefined);
    setIsLyricsPickerOpen(false);
    setView('editor');
  };

  const applyFormatting = async (action: NoteFormattingAction) => {
    try {
      await inputRef.current!.format(action);
    } catch {
      Alert.alert(translate('Error'), translate('Editor operation failed. Please try again.'));
    }
  };

  const openLyricsPicker = async () => {
    try {
      setText(await inputRef.current!.getMarkdown());
      setIsLyricsPickerOpen(true);
    } catch {
      Alert.alert(translate('Error'), translate('Editor operation failed. Please try again.'));
    }
  };

  const formattingControls: {
    label: string;
    type: NoteLineType;
    icon: React.ReactNode;
  }[] = [
    {
      label: 'H1',
      type: 'heading-1',
      icon: <Heading1 size={20} color={themeColors.foreground} strokeWidth={2} />,
    },
    {
      label: 'H2',
      type: 'heading-2',
      icon: <Heading2 size={20} color={themeColors.foreground} strokeWidth={2} />,
    },
    {
      label: 'H3',
      type: 'heading-3',
      icon: <Heading3 size={20} color={themeColors.foreground} strokeWidth={2} />,
    },
    {
      label: 'Text',
      type: 'paragraph',
      icon: <Pilcrow size={20} color={themeColors.foreground} strokeWidth={2} />,
    },
    {
      label: 'Bullet list',
      type: 'bullet',
      icon: <List size={20} color={themeColors.foreground} strokeWidth={2} />,
    },
    {
      label: 'Numbered list',
      type: 'numbered',
      icon: <ListOrdered size={20} color={themeColors.foreground} strokeWidth={2} />,
    },
    {
      label: 'To-do list',
      type: 'todo',
      icon: <ListChecks size={20} color={themeColors.foreground} strokeWidth={2} />,
    },
    {
      label: 'Quote',
      type: 'quote',
      icon: <Quote size={20} color={themeColors.foreground} strokeWidth={2} />,
    },
  ];

  return (
    <Modal
      testID="note-editor-modal"
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={handleClose}
      onDismiss={onDismiss}
      onShow={focusEditorOnOpen}
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
          <ModalCloseButton onPress={handleClose} disabled={busy} />
          <ModalSaveButton>
            <Button
              size="small"
              accessibilityLabel={translate('Save note')}
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
                    strokeWidth={2}
                  />
                )
              }
            />
          </ModalSaveButton>
          {/* Keep the WebView measured while the information pane covers it. */}
          <View style={{ flex: 1 }}>
            <View
              testID="note-editor-pane"
              pointerEvents={view === 'editor' ? 'auto' : 'none'}
              style={{ flex: 1, opacity: view === 'editor' ? 1 : 0 }}
              accessibilityElementsHidden={view !== 'editor'}
              importantForAccessibility={view === 'editor' ? 'auto' : 'no-hide-descendants'}
            >
              <NoteRichTextInput
                ref={inputRef}
                value={text}
                onReady={focusEditorOnOpen}
                onChangeMarkdown={setText}
                onImportImage={importImage}
                onInsert={async (action) => {
                  if (action === 'image') await handleImage();
                  else await openLyricsPicker();
                }}
                onError={() =>
                  Alert.alert(
                    translate('Error'),
                    translate('Editor operation failed. Please try again.')
                  )
                }
                placeholder={translate('Type here... Use / to see options.')}
                placeholderTextColor={themeColors.muted}
              />
            </View>
            {view === 'info' && (
              /* Note Info Mode: Title and Tags sections */
              <ScrollView
                className="flex-1 w-full"
                style={[StyleSheet.absoluteFill, { backgroundColor: themeColors.canvas }]}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                {/* Header */}
                <View className="gap-3 px-8 py-8">
                  <Text className="font-sans-semibold text-2xl text-theme-foreground">
                    {isQuote ? 'Quote info' : 'Note info'}
                  </Text>
                  <Text className="font-sans text-base text-theme-secondary leading-relaxed">
                    {isQuote
                      ? 'Add an author, title and tags to organize this quote on your board.'
                      : 'Add a title and tags to organize this note on your board.'}
                  </Text>
                </View>

                {/* Title Section */}
                <View className="flex-row items-center gap-4 py-5 px-8 border-t border-b border-theme-raised">
                  <Type size={20} color={themeColors.body} />

                  <TextInput
                    ref={titleInputRef}
                    autoFocus
                    value={title}
                    onChangeText={setTitle}
                    placeholder={translate('Add a title to this note')}
                    placeholderTextColor={themeColors.muted}
                    returnKeyType="next"
                    onSubmitEditing={() => {
                      (isQuote ? authorInputRef : tagsInputRef).current?.focus();
                    }}
                    className="w-full font-sans text-xl text-theme-foreground leading-tight"
                    style={styles.borderlessInput}
                    underlineColorAndroid="transparent"
                  />
                </View>

                {isQuote && (
                  <View className="flex-row items-center gap-4 py-5 px-8 border-b border-theme-raised">
                    <User size={20} color={themeColors.body} />
                    <TextInput
                      ref={authorInputRef}
                      value={author}
                      onChangeText={setAuthor}
                      placeholder={translate('Add an author to this quote')}
                      placeholderTextColor={themeColors.muted}
                      returnKeyType="next"
                      onSubmitEditing={() => tagsInputRef.current?.focus()}
                      className="flex-1 font-sans text-xl text-theme-foreground leading-tight"
                      style={styles.borderlessInput}
                      underlineColorAndroid="transparent"
                    />
                  </View>
                )}

                {/* Tags Section */}
                <TagsBox
                  containerClassName="py-6 px-8 border-b border-theme-raised gap-4"
                  tags={tags}
                  autoTags={autoTags}
                  onTagsChange={setTags}
                  onAutoTagsChange={setAutoTags}
                  tagInput={tagInput}
                  onTagInputChange={setTagInput}
                  inputRef={tagsInputRef}
                  onSubmitEditing={handleSave}
                  onRemoveTag={(removed) => {
                    autoTagsRef.current = autoTagsRef.current.filter((t) => t !== removed);
                  }}
                />

                {lyricsSong ? (
                  <SourcePreview
                    pendingMusic={lyricsSong}
                    onChange={() => setIsLyricsPickerOpen(true)}
                    onRemove={() => setLyricsSong(null)}
                    containerClassName="px-8 py-6 border-b border-theme-raised"
                  />
                ) : linkedItem && isLinkableItem(linkedItem) ? (
                  <SourcePreview
                    item={linkedItem}
                    onChange={() => setIsLinkPickerOpen(true)}
                    onRemove={() => setLinkedItemId(undefined)}
                    containerClassName="px-8 py-6 border-b border-theme-raised"
                  />
                ) : (
                  <Pressable
                    onPress={() => setIsLinkPickerOpen(true)}
                    accessibilityRole="button"
                    accessibilityLabel={translate('Add source')}
                    className="flex-row items-center gap-4 py-5 px-8 border-b border-theme-raised"
                  >
                    <Bookmark size={20} color={themeColors.foreground} />
                    <Text className="font-sans-semibold text-lg text-theme-foreground">
                      <LocalizedText>Add source</LocalizedText>
                    </Text>
                  </Pressable>
                )}
              </ScrollView>
            )}
          </View>

          {/* Action buttons at the bottom */}
          <ActionFooter
            buttonSize="small"
            bottomInset={insets.bottom}
            overlay
            horizontalScroll={view === 'editor' && isFormattingOpen}
            onDismissKeyboard={
              view === 'editor'
                ? () => {
                    void inputRef.current?.blur().catch(() => {
                      Alert.alert(
                        translate('Error'),
                        translate('Editor operation failed. Please try again.')
                      );
                    });
                  }
                : undefined
            }
          >
            {view === 'editor' && isFormattingOpen ? (
              <>
                <Button
                  accessibilityLabel={translate('Cancel formatting')}
                  onPress={() => setIsFormattingOpen(false)}
                  disabled={busy}
                  icon={<ArrowLeft size={20} color={themeColors.foreground} strokeWidth={2} />}
                />
                <Button
                  accessibilityLabel={translate('Bold')}
                  onPress={() => applyFormatting('bold')}
                  disabled={busy}
                  icon={<Bold size={20} color={themeColors.foreground} strokeWidth={2} />}
                />
                <Button
                  accessibilityLabel={translate('Italic')}
                  onPress={() => applyFormatting('italic')}
                  disabled={busy}
                  icon={<Italic size={20} color={themeColors.foreground} strokeWidth={2} />}
                />
                <Button
                  accessibilityLabel={translate('Insert image')}
                  onPress={() => void handleImage()}
                  disabled={busy}
                  icon={
                    insertingImage ? (
                      <ActivityIndicator size={20} color={themeColors.foreground} />
                    ) : (
                      <ImagePlus size={20} color={themeColors.foreground} />
                    )
                  }
                />
                {formattingControls.map(({ label, type, icon }) => (
                  <Button
                    key={type}
                    accessibilityLabel={`Change line to ${label}`}
                    onPress={() => applyFormatting(type)}
                    disabled={busy}
                    icon={icon}
                  />
                ))}
              </>
            ) : (
              <>
                {view === 'editor' && (
                  <Button
                    accessibilityLabel={translate('Open text formatting')}
                    onPress={() => setIsFormattingOpen(true)}
                    disabled={busy}
                    icon={<Type size={20} color={themeColors.foreground} strokeWidth={2} />}
                  />
                )}
                {view === 'editor' && (
                  <Button
                    accessibilityLabel={translate('Add song lyrics')}
                    onPress={() => void openLyricsPicker()}
                    disabled={busy}
                    icon={
                      <Music2
                        size={20}
                        color={lyricsSong ? '#3B82F6' : themeColors.foreground}
                        strokeWidth={2}
                      />
                    }
                  />
                )}
                {view === 'editor' ? (
                  <Button
                    accessibilityLabel={translate('Note info')}
                    onPress={handleSwitchToInfo}
                    disabled={busy}
                    icon={
                      <Info
                        size={20}
                        color={hasInfo ? '#3B82F6' : themeColors.foreground}
                        strokeWidth={2}
                      />
                    }
                  />
                ) : (
                  <Button
                    accessibilityLabel={translate('Back to note editor')}
                    onPress={handleSwitchToEditor}
                    icon={<SquarePen size={20} color={themeColors.foreground} strokeWidth={2} />}
                    text={translate('Note')}
                  />
                )}
              </>
            )}
          </ActionFooter>
        </View>
      </KeyboardAvoidingView>
      <SourcePicker
        visible={isLinkPickerOpen}
        items={libraryItems}
        selectedId={linkedItemId}
        onSelect={setLinkedItemId}
        onClose={() => setIsLinkPickerOpen(false)}
      />
      <MusicLyricsPicker
        visible={isLyricsPickerOpen}
        onClose={() => setIsLyricsPickerOpen(false)}
        onSelect={handleLyricsSelect}
      />
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
      paddingTop: 56,
      paddingBottom: 128,
    },
    borderlessInput: {
      borderWidth: 0,
      backgroundColor: 'transparent',
    },
  });
