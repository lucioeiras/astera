import { useAppTheme, type ThemeColors } from '@/lib/theme';
import { decodeHTML } from 'entities';
import { Image as ExpoImage } from 'expo-image';
import { Check, Gamepad2, Search, SquarePen, X } from 'lucide-react-native';
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
import {
  extractReleaseYear,
  getRawgGameDetails,
  searchRawgGames,
  type RawgGameDetails,
  type RawgGameResult,
} from '@/lib/games/rawg';
import type { GameItem } from '@/lib/library/types';
import { generateAutoTagsAsync } from '@/lib/tags/autoTags';
import { LocalizedText } from '@/components/LocalizedText';
import { translate, useLocalization } from '@/lib/i18n';

type NewGameModalProps = {
  visible: boolean;
  embedded?: boolean;
  onClose: () => void;
  onDismiss?: () => void;
  onSaved?: (item: GameItem) => void;
};

export function NewGameModal({
  visible,
  embedded = false,
  onClose,
  onDismiss,
  onSaved,
}: NewGameModalProps) {
  const { colors: themeColors } = useAppTheme();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);
  useLocalization();
  const { addGameItem, getTags } = useLibrary();
  const insets = useSafeAreaInsets();

  const inputRef = useRef<TextInput>(null);
  const tagsInputRef = useRef<TextInput>(null);
  const noteInputRef = useRef<TextInput>(null);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<RawgGameResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedGame, setSelectedGame] = useState<RawgGameDetails | RawgGameResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [autoTags, setAutoTags] = useState<string[]>([]);
  const autoTagsRef = useRef<string[]>([]);

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
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    setSearchQuery('');
    setResults([]);
    setSearching(false);
    setSelectedGame(null);
    setErrorMessage(null);
    setTags([]);
    setTagInput('');
    setNote('');
    setAutoTags([]);
    autoTagsRef.current = [];
    onClose();
  };

  const executeSearch = useCallback(async (query: string) => {
    const clean = query.trim();
    if (!clean) {
      setResults([]);
      setSearching(false);
      setErrorMessage(null);
      return;
    }

    setSearching(true);
    setErrorMessage(null);

    try {
      const searchRes = await searchRawgGames(clean, 15);
      setResults(searchRes);
    } catch (e: any) {
      setResults([]);
      setErrorMessage(e instanceof Error ? e.message : 'Failed to search games.');
    } finally {
      setSearching(false);
    }
  }, []);

  const handleQueryChange = (text: string) => {
    setSearchQuery(text);
    if (!text.trim()) {
      setResults([]);
      setErrorMessage(null);
      setSearching(false);
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
      return;
    }

    setSearching(true);
    setErrorMessage(null);
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    searchDebounceRef.current = setTimeout(() => {
      executeSearch(text);
    }, 450);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setResults([]);
    setErrorMessage(null);
    setSearching(false);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    inputRef.current?.focus();
  };

  const handleSelectGame = async (game: RawgGameResult) => {
    setSelectedGame(game);
    setResults([]);
    setErrorMessage(null);

    // Initial tags from platform and genre
    const platformNames = (game.platforms || []).map((p) => p.platform?.name).filter(Boolean);
    const genreNames = (game.genres || []).map((g) => g.name).filter(Boolean);

    const initialTags = ['games'];
    if (genreNames[0]) {
      initialTags.push(genreNames[0].toLowerCase().replace(/\s+/g, '-'));
    }
    if (platformNames[0]) {
      initialTags.push(platformNames[0].toLowerCase().replace(/\s+/g, '-'));
    }
    updateAutoTags(initialTags);

    // Try to load full details
    try {
      const details = await getRawgGameDetails(game.id);
      setSelectedGame(details);

      const auto = await generateAutoTagsAsync({
        title: details.name,
        text: details.description || details.description_raw || '',
        note: note.trim() || undefined,
        type: 'game',
        existingTags,
      });
      if (auto && auto.length > 0) {
        updateAutoTags(auto);
      }
    } catch {
      // Fallback is already game summary
    }
  };

  const handleSave = async () => {
    if (!selectedGame || saving) return;

    setSaving(true);
    try {
      const gameDetails = await getRawgGameDetails(selectedGame.id);
      const platformNames = (gameDetails.platforms || [])
        .map((p) => p.platform?.name)
        .filter(Boolean);
      const genreNames = (gameDetails.genres || []).map((g) => g.name).filter(Boolean);
      const releaseYear = extractReleaseYear(gameDetails.released);

      const finalTags = [...tags];
      const pending = tagInput.replace(/^#/, '').trim();
      if (pending && !finalTags.includes(pending)) {
        finalTags.push(pending);
      }
      const savedAutoTags = autoTagsRef.current.filter((t) => finalTags.includes(t));

      const item = await addGameItem(
        {
          rawgId: gameDetails.id,
          title: gameDetails.name,
          cover: gameDetails.background_image || selectedGame.background_image || '',
          platforms: platformNames.length > 0 ? platformNames : undefined,
          genres: genreNames.length > 0 ? genreNames : undefined,
          released: gameDetails.released || undefined,
          releaseYear: releaseYear || undefined,
          rating: gameDetails.rating || undefined,
          metacritic: gameDetails.metacritic ?? undefined,
          description: gameDetails.description_raw || gameDetails.description || undefined,
          website: gameDetails.website || undefined,
          developers: gameDetails.developers?.map((developer) => developer.name).filter(Boolean),
          publishers: gameDetails.publishers?.map((publisher) => publisher.name).filter(Boolean),
          esrbRating: gameDetails.esrb_rating?.name || undefined,
        },
        {
          tags: finalTags.length > 0 ? finalTags : undefined,
          autoTags: savedAutoTags.length > 0 ? savedAutoTags : undefined,
          note: note.trim() || undefined,
        }
      );

      handleClose();
      onSaved?.(item);
    } catch (e: any) {
      Alert.alert(
        translate('Error'),
        e instanceof Error ? e.message : 'Failed to save game to library.'
      );
    } finally {
      setSaving(false);
    }
  };

  const canSave = Boolean(selectedGame) && !saving;

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
                <LocalizedText>Add game</LocalizedText>
              </Text>
              <Text className="font-sans text-base text-theme-secondary leading-relaxed">
                <LocalizedText>Search games from RAWG to add them to your library.</LocalizedText>
              </Text>
            </View>

            {/* Selected Game Banner or Search Input */}
            {selectedGame ? (
              <View className="px-8 py-6 border-t border-b border-theme-raised flex-row items-center gap-6">
                <View className="w-24 h-16 rounded-lg bg-theme-raised overflow-hidden items-center justify-center">
                  {selectedGame.background_image ? (
                    <ExpoImage
                      source={{ uri: selectedGame.background_image }}
                      className="w-full h-full"
                      contentFit="cover"
                    />
                  ) : (
                    <Gamepad2 size={24} color={themeColors.muted} strokeWidth={2} />
                  )}
                </View>
                <View className="flex-1 gap-2">
                  <Text
                    className="font-sans-semibold text-lg text-theme-foreground"
                    numberOfLines={2}
                  >
                    {decodeHTML(selectedGame.name)}
                  </Text>
                  <Text className="font-sans text-base text-theme-secondary" numberOfLines={1}>
                    {extractReleaseYear(selectedGame.released) || '—'}
                    {selectedGame.metacritic ? ` • Metacritic ${selectedGame.metacritic}` : ''}
                  </Text>
                </View>
                <Pressable
                  onPress={() => {
                    setSelectedGame(null);
                    clearAutoTags();
                  }}
                  hitSlop={10}
                  className="p-2 rounded-full bg-theme-raised active:opacity-70"
                  accessibilityRole="button"
                  accessibilityLabel={translate('Change game')}
                >
                  <X size={16} color={themeColors.heading} strokeWidth={2} />
                </Pressable>
              </View>
            ) : (
              <View className="flex-row items-center gap-4 py-5 px-8 border-t border-b border-theme-raised">
                <Search size={20} color={themeColors.body} />

                <TextInput
                  ref={inputRef}
                  value={searchQuery}
                  onChangeText={handleQueryChange}
                  placeholder={translate('Search game title...')}
                  placeholderTextColor={themeColors.muted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="search"
                  onSubmitEditing={() => executeSearch(searchQuery)}
                  className="flex-1 font-sans text-xl text-theme-foreground leading-tight"
                  style={styles.borderlessInput}
                  underlineColorAndroid="transparent"
                  clearButtonMode="never"
                />

                {searching ? (
                  <ActivityIndicator size={16} color={themeColors.secondary} />
                ) : searchQuery.length > 0 ? (
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

            {/* Error Message */}
            {errorMessage && (
              <View className="mx-8 my-4 p-4 rounded-xl bg-theme-pink/10 border border-rose-800/60">
                <Text className="font-sans text-sm text-theme-pink leading-relaxed">
                  {errorMessage}
                </Text>
              </View>
            )}

            {/* Search Results List */}
            {!selectedGame && (
              <View className="w-full">
                {results.map((item) => {
                  const year = extractReleaseYear(item.released);
                  const platforms = (item.platforms || [])
                    .slice(0, 3)
                    .map((p) => p.platform?.name)
                    .filter(Boolean);

                  return (
                    <Pressable
                      key={item.id}
                      onPress={() => handleSelectGame(item)}
                      className="flex-row items-center gap-5 px-8 py-5 border-b border-theme-raised active:bg-theme-surface"
                    >
                      <View className="w-24 h-16 rounded-md bg-theme-raised overflow-hidden items-center justify-center">
                        {item.background_image ? (
                          <ExpoImage
                            source={{ uri: item.background_image }}
                            className="w-full h-full"
                            contentFit="cover"
                          />
                        ) : (
                          <Gamepad2 size={24} color={themeColors.muted} strokeWidth={2} />
                        )}
                      </View>

                      <View className="flex-1 gap-1.5">
                        <Text
                          className="font-sans-medium text-base text-theme-bright"
                          numberOfLines={1}
                        >
                          {decodeHTML(item.name)}
                        </Text>
                        <Text className="font-sans text-sm text-theme-secondary" numberOfLines={1}>
                          {year || '—'}
                          {platforms.length > 0 ? ` • ${platforms.join(', ')}` : ''}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}

                {results.length === 0 &&
                  searchQuery.trim().length > 1 &&
                  !searching &&
                  !errorMessage && (
                    <View className="py-12 items-center justify-center">
                      <Gamepad2 size={32} color={themeColors.strongBorder} strokeWidth={2} />
                      <Text className="font-sans text-sm text-theme-muted mt-3">
                        <LocalizedText>No games found for "</LocalizedText>
                        {searchQuery}
                        <LocalizedText>"</LocalizedText>
                      </Text>
                    </View>
                  )}
              </View>
            )}

            {/* Details Section when a game is selected */}
            {selectedGame && (
              <View>
                <TagsBox
                  tags={tags}
                  autoTags={autoTags}
                  onTagsChange={setTags}
                  onAutoTagsChange={setAutoTags}
                  tagInput={tagInput}
                  onTagInputChange={setTagInput}
                  inputRef={tagsInputRef}
                  onSubmitEditing={() => noteInputRef.current?.focus()}
                  onRemoveTag={(removed) => {
                    autoTagsRef.current = autoTagsRef.current.filter((tag) => tag !== removed);
                  }}
                />

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
                      placeholder={translate('Add personal thoughts or notes about this game...')}
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
              accessibilityLabel={translate('Save game')}
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
              text={translate('Save game')}
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
