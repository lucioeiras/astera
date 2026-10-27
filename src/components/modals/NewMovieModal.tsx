import { useAppTheme, type ThemeColors } from '@/lib/theme';
import { Image as ExpoImage } from 'expo-image';
import { Check, Clapperboard, Search, SquarePen, X } from 'lucide-react-native';
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
import type { MovieItem } from '@/lib/library/types';
import {
  getBackdropUrl,
  getPosterUrl,
  getReleaseYear,
  getTmdbKeyInfo,
  getTmdbMovieDetails,
  searchTmdbMovies,
  type TmdbMovieDetails,
  type TmdbMovieResult,
} from '@/lib/movies/tmdb';
import { generateAutoTags } from '@/lib/tags/autoTags';
import { LocalizedText } from '@/components/LocalizedText';
import { translate, useLocalization } from '@/lib/i18n';

type NewMovieModalProps = {
  visible: boolean;
  embedded?: boolean;
  onClose: () => void;
  onDismiss?: () => void;
  onSaved?: (item: MovieItem) => void;
};

export function NewMovieModal({
  visible,
  embedded = false,
  onClose,
  onDismiss,
  onSaved,
}: NewMovieModalProps) {
  const { colors: themeColors } = useAppTheme();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);
  useLocalization();
  const { addMovieItem, getTags } = useLibrary();
  const insets = useSafeAreaInsets();

  const searchInputRef = useRef<TextInput>(null);
  const tagsInputRef = useRef<TextInput>(null);
  const noteInputRef = useRef<TextInput>(null);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<TmdbMovieResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<TmdbMovieDetails | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [autoTags, setAutoTags] = useState<string[]>([]);
  const autoTagsRef = useRef<string[]>([]);

  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    let mounted = true;

    if (visible) {
      getTmdbKeyInfo().then((info) => {
        if (!mounted) return;
        const exists = info.source !== 'none';
        if (exists) {
          setTimeout(() => {
            if (mounted) searchInputRef.current?.focus();
          }, 100);
        }
      });
    }

    return () => {
      mounted = false;
    };
  }, [visible]);

  const handleQueryChange = (text: string) => {
    setQuery(text);
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
        const found = await searchTmdbMovies(text.trim());
        setResults(found);
      } catch (err) {
        console.warn('Movie search error:', err);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 350);
  };

  const handleSelectMovie = async (movieResult: TmdbMovieResult) => {
    setIsLoadingDetails(true);
    try {
      const details = await getTmdbMovieDetails(movieResult.id);
      setSelectedMovie(details);

      const generated = generateAutoTags({
        title: details.title,
        type: 'movie',
        existingTags,
      });

      const additionalTags: string[] = [];
      if (details.genres && details.genres.length > 0) {
        for (const g of details.genres) {
          if (g.name) {
            additionalTags.push(
              g.name
                .toLowerCase()
                .replace(/[^\w\s-]/g, '')
                .trim()
            );
          }
        }
      }

      const director = details.credits?.crew?.find((c) => c.job === 'Director')?.name;
      if (director) {
        additionalTags.push(
          director
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .trim()
        );
      }

      const merged = Array.from(new Set([...generated, ...additionalTags].filter(Boolean)));
      updateAutoTags(merged);
    } catch (e) {
      console.warn('Failed to load movie details:', e);
      Alert.alert(
        translate('Error'),
        e instanceof Error ? e.message : 'Could not fetch movie details'
      );
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleClearSearch = () => {
    setQuery('');
    setResults([]);
    setIsSearching(false);
    searchInputRef.current?.focus();
  };

  const handleClose = () => {
    if (saving) return;
    setQuery('');
    setResults([]);
    setIsSearching(false);
    setSelectedMovie(null);
    setTags([]);
    setAutoTags([]);
    autoTagsRef.current = [];
    setTagInput('');
    setNote('');
    onClose();
  };

  const handleSave = async () => {
    if (!selectedMovie || saving) return;

    setSaving(true);
    try {
      const movieDetails = await getTmdbMovieDetails(selectedMovie.id);
      const finalTags = [...tags];
      const pending = tagInput.replace(/^#/, '').trim();
      if (pending && !finalTags.includes(pending)) {
        finalTags.push(pending);
      }
      const savedAutoTags = autoTagsRef.current.filter((t) => finalTags.includes(t));

      const director = movieDetails.credits?.crew?.find((c) => c.job === 'Director')?.name;
      const genres = movieDetails.genres?.map((g) => g.name);
      const posterUrl = getPosterUrl(movieDetails.poster_path, 'w500');
      const backdropUrl = getBackdropUrl(movieDetails.backdrop_path, 'w780');
      const releaseYear = getReleaseYear(movieDetails.release_date);

      const item = await addMovieItem(
        {
          tmdbId: movieDetails.id,
          title: movieDetails.title,
          originalTitle: movieDetails.original_title,
          poster: posterUrl,
          backdrop: backdropUrl || undefined,
          releaseDate: movieDetails.release_date || undefined,
          releaseYear: releaseYear || undefined,
          overview: movieDetails.overview || undefined,
          voteAverage: movieDetails.vote_average,
          genres: genres && genres.length > 0 ? genres : undefined,
          director: director || undefined,
          runtime: movieDetails.runtime || undefined,
          cast: movieDetails.credits?.cast?.slice(0, 20).map((person) => ({
            id: person.id,
            name: person.name,
            character: person.character || undefined,
            profilePath: person.profile_path || undefined,
          })),
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
      console.error('Failed to save movie item:', e);
      Alert.alert(translate('Error'), e instanceof Error ? e.message : 'Failed to save movie item');
    } finally {
      setSaving(false);
    }
  };

  const canSave = selectedMovie !== null && !saving;

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
                <LocalizedText>Add movie</LocalizedText>
              </Text>
              <Text className="font-sans text-base text-theme-secondary leading-relaxed">
                <LocalizedText>
                  Search movies from The Movie Database (TMDB) to add to your library.
                </LocalizedText>
              </Text>
            </View>

            {/* Selected Movie Banner or Search Input */}
            {selectedMovie ? (
              <View className="px-8 py-6 border-t border-b border-theme-raised flex-row items-center gap-6">
                <View className="w-16 h-24 rounded-lg bg-theme-raised overflow-hidden items-center justify-center">
                  {selectedMovie.poster_path ? (
                    <ExpoImage
                      source={{
                        uri: getPosterUrl(selectedMovie.poster_path, 'w185'),
                      }}
                      className="w-full h-full"
                      contentFit="cover"
                    />
                  ) : (
                    <Clapperboard size={24} color={themeColors.muted} />
                  )}
                </View>
                <View className="flex-1 gap-2">
                  <Text
                    className="font-sans-semibold text-lg text-theme-foreground"
                    numberOfLines={1}
                  >
                    {selectedMovie.title}
                  </Text>
                  <Text className="font-sans text-base text-theme-secondary" numberOfLines={1}>
                    {getReleaseYear(selectedMovie.release_date) || '—'}
                    {selectedMovie.runtime ? ` • ${selectedMovie.runtime} ${translate('min')}` : ''}
                  </Text>
                </View>
                <Pressable
                  onPress={() => setSelectedMovie(null)}
                  hitSlop={10}
                  className="p-2 rounded-full bg-theme-raised active:opacity-70"
                  accessibilityRole="button"
                  accessibilityLabel={translate('Change movie')}
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
                  onChangeText={handleQueryChange}
                  placeholder={translate('Search movie title...')}
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

            {/* Results List if no movie is selected yet */}
            {!selectedMovie && (
              <View className="w-full">
                {isLoadingDetails && (
                  <View className="py-8 items-center justify-center">
                    <ActivityIndicator size={24} color={themeColors.blue} />
                    <Text className="font-sans text-sm text-theme-secondary mt-2">
                      <LocalizedText>Loading movie details...</LocalizedText>
                    </Text>
                  </View>
                )}

                {!isLoadingDetails &&
                  results.map((item) => (
                    <Pressable
                      key={item.id}
                      onPress={() => handleSelectMovie(item)}
                      className="flex-row items-center gap-5 px-8 py-5 border-b border-theme-surface active:bg-theme-surface"
                    >
                      <View className="w-12 h-16 rounded-md bg-theme-raised overflow-hidden items-center justify-center">
                        {item.poster_path ? (
                          <ExpoImage
                            source={{
                              uri: getPosterUrl(item.poster_path, 'w185'),
                            }}
                            className="w-full h-full"
                            contentFit="cover"
                          />
                        ) : (
                          <Clapperboard size={24} color={themeColors.muted} />
                        )}
                      </View>

                      <View className="flex-1 gap-1.5">
                        <Text
                          className="font-sans-medium text-base text-theme-bright"
                          numberOfLines={1}
                        >
                          {item.title}
                        </Text>
                        <Text className="font-sans text-sm text-theme-secondary" numberOfLines={1}>
                          {getReleaseYear(item.release_date) || '—'}
                          {item.original_title && item.original_title !== item.title
                            ? ` • ${item.original_title}`
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
                      <Clapperboard size={32} color={themeColors.strongBorder} strokeWidth={2} />
                      <Text className="font-sans text-sm text-theme-muted mt-3">
                        <LocalizedText>No movies found for "</LocalizedText>
                        {query}
                        <LocalizedText>"</LocalizedText>
                      </Text>
                    </View>
                  )}
              </View>
            )}

            {/* Details Section when a movie is selected */}
            {selectedMovie && (
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
                      placeholder={translate('Add personal thoughts or notes about this movie...')}
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
              accessibilityLabel={translate('Save movie')}
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
              text={translate('Save movie')}
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
