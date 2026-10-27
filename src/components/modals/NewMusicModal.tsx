import { useAppTheme, type ThemeColors } from '@/lib/theme';
import { Image as ExpoImage } from 'expo-image';
import { Check, Disc, Search, Music2, SquarePen, X } from 'lucide-react-native';
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
import { TagsBox } from '@/components/TagsBox';
import { useLibrary } from '@/hooks/useLibrary';
import type { MusicItem } from '@/lib/library/types';
import {
  formatDuration,
  formatReleaseYear,
  searchITunesMusic,
  type MusicMetadata,
} from '@/lib/music/itunes';
import { generateAutoTags } from '@/lib/tags/autoTags';
import { LocalizedText } from '@/components/LocalizedText';
import { translate, useLocalization } from '@/lib/i18n';

type NewMusicModalProps = {
  visible: boolean;
  embedded?: boolean;
  onClose: () => void;
  onDismiss?: () => void;
  onSaved?: (item: MusicItem) => void;
};

export function NewMusicModal({
  visible,
  embedded = false,
  onClose,
  onDismiss,
  onSaved,
}: NewMusicModalProps) {
  const { colors: themeColors } = useAppTheme();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);
  useLocalization();
  const { addMusicItem, getTags } = useLibrary();
  const insets = useSafeAreaInsets();
  const searchInputRef = useRef<TextInput>(null);
  const tagsInputRef = useRef<TextInput>(null);
  const noteInputRef = useRef<TextInput>(null);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MusicMetadata[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedMusic, setSelectedMusic] = useState<MusicMetadata | null>(null);

  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [autoTags, setAutoTags] = useState<string[]>([]);
  const autoTagsRef = useRef<string[]>([]);

  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchRequestRef = useRef(0);

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

  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  const handleQueryChange = (text: string) => {
    setQuery(text);
    const request = ++searchRequestRef.current;
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (!text.trim()) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    setResults([]);

    searchTimerRef.current = setTimeout(async () => {
      try {
        const [songs, albums] = await Promise.all([
          searchITunesMusic(text.trim(), 'song', 15),
          searchITunesMusic(text.trim(), 'album', 15),
        ]);
        const found: MusicMetadata[] = [];
        for (let index = 0; index < Math.max(songs.length, albums.length); index++) {
          if (songs[index]) found.push(songs[index]);
          if (albums[index]) found.push(albums[index]);
        }
        if (request === searchRequestRef.current) setResults(found);
      } catch (err) {
        console.warn('Search error:', err);
      } finally {
        if (request === searchRequestRef.current) setIsSearching(false);
      }
    }, 350);
  };

  const handleSelectMusic = (music: MusicMetadata) => {
    setSelectedMusic(music);

    // Auto-generate tags based on the selected music metadata.
    const generated = generateAutoTags({
      title: music.title,
      author: music.artist,
      type: 'music',
      existingTags,
    });

    const additionalTags: string[] = [];
    if (music.artist) {
      additionalTags.push(
        music.artist
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .trim()
      );
    }
    if (music.genre) {
      additionalTags.push(
        music.genre
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .trim()
      );
    }

    const merged = Array.from(new Set([...generated, ...additionalTags].filter(Boolean)));
    updateAutoTags(merged);
  };

  const handleClearSearch = () => {
    handleQueryChange('');
    searchInputRef.current?.focus();
  };

  const resetModal = () => {
    ++searchRequestRef.current;
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    setQuery('');
    setResults([]);
    setIsSearching(false);
    setSelectedMusic(null);
    setTags([]);
    setAutoTags([]);
    autoTagsRef.current = [];
    setTagInput('');
    setNote('');
    onClose();
  };

  const handleClose = () => {
    if (saving) return;
    resetModal();
  };

  const handleSave = async () => {
    if (!selectedMusic || saving) return;

    setSaving(true);
    try {
      const finalTags = [...tags];
      const pending = tagInput.replace(/^#/, '').trim();
      if (pending && !finalTags.includes(pending)) {
        finalTags.push(pending);
      }
      const savedAutoTags = autoTagsRef.current.filter((t) => finalTags.includes(t));

      const item = await addMusicItem(
        {
          musicKind: selectedMusic.kind,
          title: selectedMusic.title,
          artist: selectedMusic.artist,
          album: selectedMusic.album,
          cover: selectedMusic.cover,
          previewUrl: selectedMusic.previewUrl,
          externalUrl: selectedMusic.externalUrl,
          durationMs: selectedMusic.durationMs,
          releaseDate: selectedMusic.releaseDate,
          genre: selectedMusic.genre,
        },
        {
          tags: finalTags.length > 0 ? finalTags : undefined,
          autoTags: savedAutoTags.length > 0 ? savedAutoTags : undefined,
          note: note.trim() || undefined,
        }
      );

      resetModal();
      onSaved?.(item);
    } catch (e) {
      console.error('Failed to save music item:', e);
      Alert.alert(translate('Error'), e instanceof Error ? e.message : 'Failed to save music item');
    } finally {
      setSaving(false);
    }
  };

  const canSave = selectedMusic !== null && !saving;

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
                <LocalizedText>Add music</LocalizedText>
              </Text>
              <Text className="font-sans text-base text-theme-secondary leading-relaxed">
                <LocalizedText>
                  Search songs or albums from the iTunes catalog to add to your library.
                </LocalizedText>
              </Text>
            </View>

            {/* Selected music banner or search input */}
            {selectedMusic ? (
              <View className="px-8 py-6 border-t border-b border-theme-raised flex-row items-center gap-6">
                <ExpoImage
                  source={{ uri: selectedMusic.cover }}
                  className="w-24 h-24 rounded-lg bg-theme-raised"
                  contentFit="cover"
                />
                <View className="flex-1 gap-2">
                  <Text
                    className="font-sans-semibold text-lg text-theme-foreground"
                    numberOfLines={1}
                  >
                    {selectedMusic.title}
                  </Text>
                  <Text className="font-sans text-base text-theme-body" numberOfLines={1}>
                    {selectedMusic.artist}
                  </Text>
                  {selectedMusic.kind === 'album' ? (
                    <Text className="font-sans text-sm text-theme-secondary mt-0.5">
                      <LocalizedText>Album</LocalizedText>
                      {selectedMusic.releaseDate &&
                        ` • ${formatReleaseYear(selectedMusic.releaseDate)}`}
                    </Text>
                  ) : selectedMusic.album ? (
                    <Text
                      className="font-sans text-sm text-theme-secondary mt-0.5"
                      numberOfLines={1}
                    >
                      {selectedMusic.album}
                      {selectedMusic.releaseDate &&
                        ` • ${formatReleaseYear(selectedMusic.releaseDate)}`}
                    </Text>
                  ) : null}
                </View>
                <Pressable
                  onPress={() => setSelectedMusic(null)}
                  hitSlop={10}
                  className="p-2 rounded-full bg-theme-raised active:opacity-70"
                  accessibilityRole="button"
                  accessibilityLabel={translate('Change music selection')}
                >
                  <X size={16} color={themeColors.heading} strokeWidth={2} />
                </Pressable>
              </View>
            ) : (
              <View className="flex-row items-center gap-4 py-5 px-8 border-t border-b border-theme-raised">
                <Search size={20} color={themeColors.body} />

                <TextInput
                  ref={searchInputRef}
                  value={query}
                  onChangeText={(text) => handleQueryChange(text)}
                  placeholder={translate('Search song, album, or artist...')}
                  placeholderTextColor={themeColors.muted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="search"
                  className="flex-1 font-sans text-xl text-theme-foreground leading-tight"
                  style={styles.borderlessInput}
                  underlineColorAndroid="transparent"
                  clearButtonMode="never"
                />

                {isSearching ? (
                  <ActivityIndicator size={16} color={themeColors.secondary} />
                ) : query.length > 0 ? (
                  <Pressable
                    onPress={handleClearSearch}
                    hitSlop={10}
                    className="p-1.5 rounded-full bg-theme-raised items-center justify-center active:opacity-70"
                    accessibilityRole="button"
                    accessibilityLabel={translate('Clear search')}
                  >
                    <X size={12} color={themeColors.heading} strokeWidth={2} />
                  </Pressable>
                ) : null}
              </View>
            )}

            {/* Results list if no music is selected yet */}
            {!selectedMusic && (
              <View className="w-full">
                {results.map((item) => (
                  <Pressable
                    key={`${item.kind}-${item.id}`}
                    onPress={() => handleSelectMusic(item)}
                    className="flex-row items-center gap-5 px-8 py-5 border-b border-theme-surface active:bg-theme-surface"
                    accessibilityRole="button"
                    accessibilityLabel={translate('%{kind}: %{title}, %{artist}', {
                      kind: translate(item.kind === 'album' ? 'Album' : 'Song'),
                      title: item.title,
                      artist: item.artist,
                    })}
                  >
                    <View className="w-12 h-12 rounded-md bg-theme-raised overflow-hidden">
                      {item.cover ? (
                        <ExpoImage
                          source={{ uri: item.cover }}
                          className="w-full h-full"
                          contentFit="cover"
                        />
                      ) : (
                        <View className="w-full h-full items-center justify-center">
                          <Disc size={24} color={themeColors.muted} />
                        </View>
                      )}
                    </View>

                    <View className="flex-1 gap-1">
                      <Text
                        className="font-sans-medium text-base text-theme-bright"
                        numberOfLines={1}
                      >
                        {item.title}
                      </Text>
                      <Text className="font-sans text-sm text-theme-secondary" numberOfLines={1}>
                        {item.kind === 'album' ? 'Album' : 'Música'}{' '}
                        <LocalizedText>• </LocalizedText>
                        {item.artist}
                        {item.album ? ` • ${item.album}` : ''}
                        {item.kind === 'album' && item.releaseDate
                          ? ` • ${formatReleaseYear(item.releaseDate)}`
                          : ''}
                      </Text>
                    </View>

                    {item.durationMs && (
                      <Text className="font-sans text-xs text-theme-muted">
                        {formatDuration(item.durationMs)}
                      </Text>
                    )}
                  </Pressable>
                ))}

                {results.length === 0 && query.trim().length > 1 && !isSearching && (
                  <View className="py-12 items-center justify-center">
                    <Music2 size={32} color={themeColors.strongBorder} strokeWidth={2} />
                    <Text className="font-sans text-sm text-theme-muted mt-3">
                      <LocalizedText>No songs or albums found for "</LocalizedText>
                      {query}
                      <LocalizedText>"</LocalizedText>
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Details section when music is selected */}
            {selectedMusic && (
              <View>
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
                <View className="py-6 px-8 gap-4 border-t border-theme-raised">
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
                      placeholder={translate(
                        'Add personal thoughts or notes about this %{item}...',
                        {
                          item: translate(selectedMusic.kind === 'album' ? 'album' : 'song'),
                        }
                      )}
                      placeholderTextColor={themeColors.muted}
                      multiline
                      textAlignVertical="top"
                      className="w-full font-sans text-base text-theme-bright leading-relaxed min-h-[96px]"
                      style={styles.borderlessInput}
                      underlineColorAndroid="transparent"
                    />
                  </Pressable>
                </View>
              </View>
            )}
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
              accessibilityLabel={translate('Save %{item}', {
                item: translate(selectedMusic?.kind === 'album' ? 'Album' : 'Song'),
              })}
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
              text={translate('Save %{item}', {
                item: translate(selectedMusic?.kind === 'album' ? 'Album' : 'Song'),
              })}
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
