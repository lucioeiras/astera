import { useAppTheme, type ThemeColors } from '@/lib/theme';
import { Image as ExpoImage } from 'expo-image';
import { Check, Search, SquarePen, Tv, X } from 'lucide-react-native';
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
import { AddItemModalShell } from '@/components/modals/AddItemModalShell';
import { TagsBox } from '@/components/TagsBox';
import { useLibrary } from '@/hooks/useLibrary';
import type { TvShowItem } from '@/lib/library/types';
import {
  getBackdropUrl,
  getPosterUrl,
  getReleaseYear,
  getTmdbKeyInfo,
  getTmdbTvShowDetails,
  searchTmdbTvShows,
  type TmdbTvShowDetails,
  type TmdbTvShowResult,
} from '@/lib/movies/tmdb';
import { generateAutoTags } from '@/lib/tags/autoTags';
import { LocalizedText } from '@/components/LocalizedText';
import { translate, useLocalization } from '@/lib/i18n';

type NewTvShowModalProps = {
  visible: boolean;
  embedded?: boolean;
  onClose: () => void;
  onDismiss?: () => void;
  onSaved?: (item: TvShowItem) => void;
};

export function NewTvShowModal({
  visible,
  embedded = false,
  onClose,
  onDismiss,
  onSaved,
}: NewTvShowModalProps) {
  const { colors: themeColors } = useAppTheme();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);
  useLocalization();
  const { addTvShowItem, getTags } = useLibrary();
  const insets = useSafeAreaInsets();
  const searchInputRef = useRef<TextInput>(null);
  const tagsInputRef = useRef<TextInput>(null);
  const noteInputRef = useRef<TextInput>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoTagsRef = useRef<string[]>([]);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<TmdbTvShowResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedShow, setSelectedShow] = useState<TmdbTvShowDetails | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [autoTags, setAutoTags] = useState<string[]>([]);

  const existingTags = useMemo(
    () => (visible ? getTags().map((tag) => tag.tag) : []),
    [getTags, visible]
  );

  const updateAutoTags = useCallback((newAutoTags: string[]) => {
    const previous = autoTagsRef.current;
    const combined = [...previous];
    for (const tag of newAutoTags) {
      if (!combined.includes(tag)) combined.push(tag);
    }
    autoTagsRef.current = combined;
    setAutoTags(combined);
    setTags((current) => {
      const merged = current.filter((tag) => !previous.includes(tag));
      for (const tag of combined) {
        if (!merged.includes(tag)) merged.push(tag);
      }
      return merged;
    });
  }, []);

  useEffect(() => {
    let mounted = true;
    if (visible) {
      getTmdbKeyInfo().then((info) => {
        if (mounted && info.source !== 'none') {
          setTimeout(() => mounted && searchInputRef.current?.focus(), 100);
        }
      });
    }
    return () => {
      mounted = false;
    };
  }, [visible]);

  const handleQueryChange = (text: string) => {
    setQuery(text);
    setSelectedShow(null);
    if (!text.trim()) {
      setResults([]);
      setIsSearching(false);
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
      return;
    }

    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    setIsSearching(true);
    searchTimerRef.current = setTimeout(async () => {
      try {
        setResults(await searchTmdbTvShows(text.trim()));
      } catch (error) {
        console.warn('TV show search error:', error);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 350);
  };

  const handleSelectShow = async (result: TmdbTvShowResult) => {
    setIsLoadingDetails(true);
    try {
      const details = await getTmdbTvShowDetails(result.id);
      setSelectedShow(details);
      const generated = generateAutoTags({
        title: details.name,
        type: 'tvshow',
        existingTags,
      });
      const genreTags = (details.genres ?? []).map((genre) =>
        genre.name
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .trim()
      );
      updateAutoTags(Array.from(new Set([...generated, ...genreTags].filter(Boolean))));
    } catch (error) {
      console.warn('Failed to load TV show details:', error);
      Alert.alert(
        translate('Error'),
        error instanceof Error ? error.message : 'Could not fetch TV show details'
      );
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleClearSearch = () => {
    setQuery('');
    setResults([]);
    setSelectedShow(null);
    setIsSearching(false);
    searchInputRef.current?.focus();
  };

  const handleClose = () => {
    if (saving) return;
    setQuery('');
    setResults([]);
    setIsSearching(false);
    setSelectedShow(null);
    setTags([]);
    setAutoTags([]);
    autoTagsRef.current = [];
    setTagInput('');
    setNote('');
    onClose();
  };

  const handleSave = async () => {
    if (!selectedShow || saving) return;
    setSaving(true);
    try {
      const details = await getTmdbTvShowDetails(selectedShow.id);
      const finalTags = [...tags];
      const pending = tagInput.replace(/^#/, '').trim();
      if (pending && !finalTags.includes(pending)) finalTags.push(pending);
      const savedAutoTags = autoTagsRef.current.filter((tag) => finalTags.includes(tag));
      const seasons = (details.seasons ?? []).map((season) => ({
        tmdbId: season.id,
        seasonNumber: season.season_number,
        name: season.name,
        poster: getPosterUrl(season.poster_path, 'w342') || undefined,
        overview: season.overview || undefined,
        airDate: season.air_date || undefined,
        episodeCount: season.episode_count,
        progressStatus: 'want' as const,
      }));
      const item = await addTvShowItem(
        {
          tmdbId: details.id,
          title: details.name,
          originalTitle: details.original_name || undefined,
          poster: getPosterUrl(details.poster_path, 'w500'),
          backdrop: getBackdropUrl(details.backdrop_path, 'w780') || undefined,
          firstAirDate: details.first_air_date || undefined,
          releaseYear: getReleaseYear(details.first_air_date) || undefined,
          overview: details.overview || undefined,
          voteAverage: details.vote_average,
          genres: details.genres?.map((genre) => genre.name),
          seasons,
        },
        {
          tags: finalTags.length ? finalTags : undefined,
          autoTags: savedAutoTags.length ? savedAutoTags : undefined,
          note: note.trim() || undefined,
        }
      );
      handleClose();
      onSaved?.(item);
    } catch (error) {
      console.error('Failed to save TV show:', error);
      Alert.alert(
        translate('Error'),
        error instanceof Error ? error.message : 'Failed to save TV show'
      );
    } finally {
      setSaving(false);
    }
  };

  const canSave = selectedShow !== null && !saving;

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
          style={{ paddingTop: embedded ? 0 : Math.max(insets.top, 16) }}
          className="flex-1 w-full relative"
        >
          <ScrollView
            className="flex-1 w-full"
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View className="gap-3 p-8 pt-0">
              <Text className="font-sans-semibold text-2xl text-theme-foreground">
                <LocalizedText>Add TV show</LocalizedText>
              </Text>
              <Text className="font-sans text-base text-theme-secondary leading-relaxed">
                <LocalizedText>
                  Search TV shows from The Movie Database (TMDB) to add to your library.
                </LocalizedText>
              </Text>
            </View>

            {selectedShow ? (
              <View className="px-8 py-6 border-t border-b border-theme-raised flex-row items-center gap-6">
                <View className="w-16 h-24 rounded-lg bg-theme-raised overflow-hidden items-center justify-center">
                  {selectedShow.poster_path ? (
                    <ExpoImage
                      source={{
                        uri: getPosterUrl(selectedShow.poster_path, 'w185'),
                      }}
                      className="w-full h-full"
                      contentFit="cover"
                    />
                  ) : (
                    <Tv size={24} color={themeColors.muted} />
                  )}
                </View>
                <View className="flex-1 gap-2">
                  <Text
                    className="font-sans-semibold text-lg text-theme-foreground"
                    numberOfLines={1}
                  >
                    {selectedShow.name}
                  </Text>
                  <Text className="font-sans text-base text-theme-secondary" numberOfLines={1}>
                    {getReleaseYear(selectedShow.first_air_date) || '—'}
                    {` • ${translate('%{count} seasons', {
                      count: selectedShow.seasons?.length ?? 0,
                    })}`}
                  </Text>
                </View>
                <Pressable
                  onPress={() => setSelectedShow(null)}
                  hitSlop={10}
                  className="p-2 rounded-full bg-theme-raised active:opacity-70"
                  accessibilityRole="button"
                  accessibilityLabel={translate('Change TV show')}
                >
                  <X size={16} color={themeColors.heading} strokeWidth={2.5} />
                </Pressable>
              </View>
            ) : (
              <View className="flex-row items-center gap-4 py-5 px-8 border-t border-b border-theme-raised">
                <Search size={20} color={themeColors.body} />
                <TextInput
                  ref={searchInputRef}
                  value={query}
                  onChangeText={handleQueryChange}
                  placeholder={translate('Search TV show title...')}
                  placeholderTextColor={themeColors.muted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="search"
                  className="flex-1 font-sans text-xl text-theme-foreground leading-tight"
                  style={styles.borderlessInput}
                  underlineColorAndroid="transparent"
                  clearButtonMode="never"
                  accessibilityLabel={translate('Search TV shows')}
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
                    <X size={12} color={themeColors.heading} strokeWidth={2.5} />
                  </Pressable>
                ) : null}
              </View>
            )}

            {!selectedShow && (
              <View className="w-full">
                {isLoadingDetails && (
                  <View className="py-8 items-center justify-center">
                    <ActivityIndicator size={24} color={themeColors.blue} />
                    <Text className="font-sans text-sm text-theme-secondary mt-2">
                      <LocalizedText>Loading TV show details...</LocalizedText>
                    </Text>
                  </View>
                )}
                {!isLoadingDetails &&
                  results.map((result) => (
                    <Pressable
                      key={result.id}
                      onPress={() => handleSelectShow(result)}
                      className="flex-row items-center gap-5 px-8 py-5 border-b border-theme-surface active:bg-theme-surface"
                      accessibilityRole="button"
                    >
                      <View className="w-12 h-16 rounded-md bg-theme-raised overflow-hidden items-center justify-center">
                        {result.poster_path ? (
                          <ExpoImage
                            source={{
                              uri: getPosterUrl(result.poster_path, 'w185'),
                            }}
                            className="w-full h-full"
                            contentFit="cover"
                          />
                        ) : (
                          <Tv size={24} color={themeColors.muted} />
                        )}
                      </View>
                      <View className="flex-1 gap-1.5">
                        <Text
                          className="font-sans-medium text-base text-theme-bright"
                          numberOfLines={1}
                        >
                          {result.name}
                        </Text>
                        <Text className="font-sans text-sm text-theme-secondary" numberOfLines={1}>
                          {getReleaseYear(result.first_air_date) || '—'}
                          {result.original_name && result.original_name !== result.name
                            ? ` • ${result.original_name}`
                            : ''}
                        </Text>
                      </View>
                    </Pressable>
                  ))}
                {!isLoadingDetails &&
                  results.length === 0 &&
                  query.trim().length > 1 &&
                  !isSearching && (
                    <View className="py-12 items-center justify-center">
                      <Tv size={32} color={themeColors.strongBorder} strokeWidth={2} />
                      <Text className="font-sans text-sm text-theme-muted mt-3">
                        <LocalizedText>No TV shows found for "</LocalizedText>
                        {query}
                        <LocalizedText>"</LocalizedText>
                      </Text>
                    </View>
                  )}
              </View>
            )}

            {selectedShow && (
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
                      placeholder={translate(
                        'Add personal thoughts or notes about this TV show...'
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
          <ActionFooter bottomInset={insets.bottom} overlay>
            <Button
              accessibilityLabel={translate('Cancel')}
              onPress={handleClose}
              disabled={saving}
              icon={<X size={20} color={themeColors.foreground} strokeWidth={2.5} />}
              text={translate('Cancel')}
            />
            <Button
              accessibilityLabel={translate('Save TV show')}
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
              text={translate('Save TV show')}
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
