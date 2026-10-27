import { useAppTheme, type ThemeColors } from '@/lib/theme';
import { Book, Check, Search, SquarePen, X } from 'lucide-react-native';
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

import { AddItemModalShell } from '@/components/modals/AddItemModalShell';

import { ActionFooter } from '@/components/ActionFooter';
import { Button } from '@/components/Button';
import { BookCover } from '@/components/effects/BookCover';
import { TagsBox } from '@/components/TagsBox';
import { useLibrary } from '@/hooks/useLibrary';
import { fetchBookByIsbn, normalizeIsbn, type BookMetadata } from '@/lib/books/isbn';
import type { BookItem } from '@/lib/library/types';
import { generateAutoTagsAsync } from '@/lib/tags/autoTags';
import { LocalizedText } from '@/components/LocalizedText';
import { translate, useLocalization } from '@/lib/i18n';

type NewBookModalProps = {
  visible: boolean;
  embedded?: boolean;
  onClose: () => void;
  onDismiss?: () => void;
  onSaved?: (item: BookItem) => void;
};

export function NewBookModal({
  visible,
  embedded = false,
  onClose,
  onDismiss,
  onSaved,
}: NewBookModalProps) {
  const { colors: themeColors } = useAppTheme();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);
  useLocalization();
  const { addBookItem, getTags } = useLibrary();
  const insets = useSafeAreaInsets();

  const inputRef = useRef<TextInput>(null);
  const tagsInputRef = useRef<TextInput>(null);
  const noteInputRef = useRef<TextInput>(null);

  const [isbn, setIsbn] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [book, setBook] = useState<BookMetadata | null>(null);
  const [coverAspectRatio, setCoverAspectRatio] = useState<number>(2 / 3);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [autoTags, setAutoTags] = useState<string[]>([]);
  const autoTagsRef = useRef<string[]>([]);
  const lastSearchedIsbnRef = useRef<string>('');

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
    const tagsToRemove = [...autoTagsRef.current];
    autoTagsRef.current = [];
    setAutoTags([]);
    setTags((prev) => prev.filter((t) => !tagsToRemove.includes(t)));
  }, []);

  const handleSearch = useCallback(
    async (targetIsbn: string) => {
      const clean = normalizeIsbn(targetIsbn);
      if (!clean || clean.length < 9) return;
      if (clean === lastSearchedIsbnRef.current && book) return;

      lastSearchedIsbnRef.current = clean;
      setLoading(true);
      setErrorMessage(null);

      try {
        const result = await fetchBookByIsbn(clean);
        if (normalizeIsbn(isbn) !== clean) return;

        setBook(result);
        setErrorMessage(null);

        // Generate smart tags from book data
        const authorText = result.authors.join(' ');
        const auto = await generateAutoTagsAsync({
          title: result.title,
          text: `${authorText}\n${result.description || ''}`,
          author: result.authors[0],
          note: note.trim() || undefined,
          type: 'book',
          existingTags,
        });

        updateAutoTags(auto);
      } catch (e) {
        if (normalizeIsbn(isbn) === clean) {
          setBook(null);
          clearAutoTags();
          setErrorMessage(e instanceof Error ? e.message : 'Could not find book for this ISBN.');
        }
      } finally {
        setLoading(false);
      }
    },
    [isbn, book, note, existingTags, updateAutoTags, clearAutoTags]
  );

  const handleIsbnChange = (newIsbn: string) => {
    setIsbn(newIsbn);
    const clean = normalizeIsbn(newIsbn);
    if (!clean) {
      setBook(null);
      setErrorMessage(null);
      clearAutoTags();
      lastSearchedIsbnRef.current = '';
    }
  };

  // Auto-search when user pastes or types a 10 or 13-character ISBN
  useEffect(() => {
    const clean = normalizeIsbn(isbn);
    if (clean.length === 10 || clean.length === 13) {
      const timer = setTimeout(() => {
        handleSearch(clean);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [isbn, handleSearch]);

  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  const handleClose = () => {
    if (saving) return;
    setIsbn('');
    setBook(null);
    setCoverAspectRatio(2 / 3);
    setErrorMessage(null);
    setTags([]);
    setAutoTags([]);
    autoTagsRef.current = [];
    setTagInput('');
    setNote('');
    lastSearchedIsbnRef.current = '';
    onClose();
  };

  const handleClearIsbn = () => {
    setIsbn('');
    setBook(null);
    setCoverAspectRatio(2 / 3);
    setErrorMessage(null);
    clearAutoTags();
    lastSearchedIsbnRef.current = '';
    inputRef.current?.focus();
  };

  const handleSave = async () => {
    if (!book || saving) return;

    setSaving(true);
    try {
      const finalTags = [...tags];
      const pending = tagInput.replace(/^#/, '').trim();
      if (pending && !finalTags.includes(pending)) {
        finalTags.push(pending);
      }
      const savedAutoTags = autoTagsRef.current.filter((t) => finalTags.includes(t));

      const item = await addBookItem(
        {
          isbn: book.isbn,
          title: book.title,
          authors: book.authors,
          cover: book.cover,
          coverAspectRatio: book.cover ? coverAspectRatio : undefined,
          description: book.description,
          publisher: book.publisher,
          publishedDate: book.publishedDate,
          pageCount: book.pageCount,
          url: book.url,
        },
        {
          tags: finalTags.length > 0 ? finalTags : undefined,
          autoTags: savedAutoTags.length > 0 ? savedAutoTags : undefined,
          note: note.trim() || undefined,
        }
      );

      handleClose();
      onSaved?.(item);
    } catch (e) {
      console.error('Failed to save book:', e);
      Alert.alert(translate('Error'), e instanceof Error ? e.message : 'Failed to save book');
    } finally {
      setSaving(false);
    }
  };

  const canSave = Boolean(book) && !saving && !loading;

  return (
    <AddItemModalShell
      visible={visible}
      embedded={embedded}
      onRequestClose={handleClose}
      onDismiss={onDismiss}
    >
      <KeyboardAvoidingView
        behavior={embedded ? undefined : Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <View
          style={{
            paddingTop: embedded ? 0 : Math.max(insets.top, 16),
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
            <View className="gap-3 p-8 pt-0">
              <Text className="font-sans-semibold text-2xl text-theme-foreground">
                <LocalizedText>Add a new book</LocalizedText>
              </Text>
              <Text className="font-sans text-base text-theme-secondary leading-relaxed">
                <LocalizedText>
                  Enter the book&apos;s ISBN (10 or 13 digits) to automatically fetch its details,
                  authors, cover and synopsis.
                </LocalizedText>
              </Text>
            </View>

            {/* ISBN Input Section */}
            <View className="flex-row items-center gap-3 py-5 px-8 border-t border-b border-theme-raised">
              <Book size={22} color={themeColors.body} />

              <TextInput
                ref={inputRef}
                value={isbn}
                onChangeText={handleIsbnChange}
                placeholder={translate('ISBN (e.g. 9780132350884)')}
                placeholderTextColor={themeColors.muted}
                autoCapitalize="characters"
                autoCorrect={false}
                keyboardType="numbers-and-punctuation"
                returnKeyType="search"
                onSubmitEditing={() => handleSearch(isbn)}
                className="flex-1 font-sans text-xl text-theme-foreground leading-tight"
                style={styles.borderlessInput}
                underlineColorAndroid="transparent"
                clearButtonMode="never"
              />

              {loading ? (
                <ActivityIndicator size={18} color="#F59E0B" />
              ) : isbn.length > 0 ? (
                <View className="flex-row items-center gap-2">
                  <Pressable
                    onPress={() => handleSearch(isbn)}
                    hitSlop={8}
                    className="p-1.5 rounded-full bg-amber-500/20 items-center justify-center active:opacity-70"
                    accessibilityRole="button"
                    accessibilityLabel={translate('Search ISBN')}
                  >
                    <Search size={16} color="#F59E0B" strokeWidth={2} />
                  </Pressable>

                  <Pressable
                    onPress={handleClearIsbn}
                    hitSlop={8}
                    className="p-1.5 rounded-full bg-theme-raised items-center justify-center active:opacity-70"
                    accessibilityRole="button"
                    accessibilityLabel={translate('Clear ISBN')}
                  >
                    <X size={12} color={themeColors.heading} strokeWidth={2} />
                  </Pressable>
                </View>
              ) : null}
            </View>

            {/* Error Message */}
            {errorMessage && (
              <View className="mx-8 my-4 p-4 rounded-xl bg-theme-pink/10 border border-rose-800/60">
                <Text className="font-sans text-sm text-theme-pink leading-relaxed">
                  {errorMessage}
                </Text>
              </View>
            )}

            {/* Book Preview Section */}
            {book && (
              <View className="px-8 py-5 p-5 bg-theme-canvas border-b border-theme-raised">
                <View className="flex-row gap-8">
                  <BookCover
                    cover={book.cover}
                    title={book.title}
                    aspectRatio={coverAspectRatio}
                    onAspectRatioChange={setCoverAspectRatio}
                    className="w-20 shadow-md"
                    roundedCorners
                  />

                  <View className="flex-1 justify-center gap-2">
                    <Text
                      className="font-sans-medium text-xl text-theme-foreground leading-snug"
                      numberOfLines={3}
                    >
                      {book.title}
                    </Text>

                    {book.authors.length > 0 && (
                      <Text
                        className="font-sans text-base text-theme-amber leading-tight"
                        numberOfLines={2}
                      >
                        {book.authors.join(', ')}
                      </Text>
                    )}

                    <View className="flex-row flex-wrap items-center gap-2 mt-1">
                      {book.publishedDate && (
                        <Text className="font-sans text-sm text-theme-body">
                          {book.publishedDate.split('-')[0]}
                        </Text>
                      )}
                      {book.pageCount && (
                        <Text className="font-sans text-sm text-theme-secondary">
                          <LocalizedText>• </LocalizedText>
                          {book.pageCount} <LocalizedText>pgs</LocalizedText>
                        </Text>
                      )}
                      {book.publisher && (
                        <Text className="font-sans text-sm text-theme-secondary" numberOfLines={1}>
                          <LocalizedText>• </LocalizedText>
                          {book.publisher}
                        </Text>
                      )}
                    </View>
                  </View>
                </View>

                {book.description ? (
                  <Text
                    className="font-sans text-xs text-theme-secondary leading-relaxed"
                    numberOfLines={4}
                  >
                    {book.description}
                  </Text>
                ) : null}
              </View>
            )}

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
                <SquarePen size={14} color={themeColors.heading} strokeWidth={2} />
                <Text className="font-sans-semibold text-sm tracking-wider uppercase text-theme-heading">
                  <LocalizedText>Note</LocalizedText>
                </Text>
              </View>

              <Pressable onPress={() => noteInputRef.current?.focus()} className="w-full">
                <TextInput
                  ref={noteInputRef}
                  value={note}
                  onChangeText={setNote}
                  placeholder={translate('Add a personal note about this book...')}
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
          <ActionFooter bottomInset={insets.bottom} overlay>
            <Button
              accessibilityLabel={translate('Cancel')}
              onPress={handleClose}
              disabled={saving}
              icon={<X size={20} color={themeColors.foreground} strokeWidth={2} />}
              text={translate('Cancel')}
            />
            <Button
              accessibilityLabel={translate('Save book')}
              variant="primary"
              onPress={handleSave}
              disabled={!canSave}
              icon={
                saving ? (
                  <ActivityIndicator size={20} color={themeColors.foreground} />
                ) : (
                  <Check
                    size={20}
                    color={canSave ? themeColors.inverse : themeColors.muted}
                    strokeWidth={2}
                  />
                )
              }
              text={translate('Save book')}
            />
          </ActionFooter>
        </View>
      </KeyboardAvoidingView>
    </AddItemModalShell>
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
      paddingBottom: 120,
    },
    borderlessInput: {
      borderWidth: 0,
      backgroundColor: 'transparent',
    },
  });
