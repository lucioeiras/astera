import { ThemedModal as Modal } from '@/components/ThemedModal';
import { useAppTheme } from '@/lib/theme';
import { Image as ExpoImage } from 'expo-image';
import { ArrowLeft, Search, Music2, ListMusic, TriangleAlert, X } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActionFooter } from '@/components/ActionFooter';
import { Button } from '@/components/Button';
import { formatDuration, searchITunesMusic, type MusicMetadata } from '@/lib/music/itunes';
import { getSongLyrics } from '@/lib/music/lyrics';
import { LocalizedText } from '@/components/LocalizedText';
import { translate, useLocalization } from '@/lib/i18n';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSelect: (text: string, song: MusicMetadata) => void;
};

export function MusicLyricsPicker({ visible, onClose, onSelect }: Props) {
  const { colors: themeColors } = useAppTheme();
  useLocalization();
  const insets = useSafeAreaInsets();
  const searchInputRef = useRef<TextInput>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestRef = useRef(0);
  const lyricsRequestRef = useRef<AbortController | null>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MusicMetadata[]>([]);
  const [searching, setSearching] = useState(false);
  const [loadingLyrics, setLoadingLyrics] = useState(false);
  const [song, setSong] = useState<MusicMetadata | null>(null);
  const [lyrics, setLyrics] = useState('');
  const [notice, setNotice] = useState('');
  const [selection, setSelection] = useState<{
    anchor: number;
    end: number;
  } | null>(null);

  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => searchInputRef.current?.focus(), 100);
    return () => clearTimeout(timer);
  }, [visible]);

  useEffect(() => {
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
      lyricsRequestRef.current?.abort();
      requestRef.current += 1;
    };
  }, []);

  const lines = useMemo(() => lyrics.replace(/\r\n/g, '\n').split('\n'), [lyrics]);
  const start = selection ? Math.min(selection.anchor, selection.end) : -1;
  const end = selection ? Math.max(selection.anchor, selection.end) : -1;
  const selectedLines = selection ? lines.slice(start, end + 1) : [];
  const selectedCount = selectedLines.filter((line) => line.trim()).length;

  const handleQueryChange = (value: string) => {
    setQuery(value);
    setNotice('');
    const request = ++requestRef.current;
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    setResults([]);
    if (!value.trim()) {
      setSearching(false);
      return;
    }
    setSearching(true);
    searchTimerRef.current = setTimeout(async () => {
      const songs = await searchITunesMusic(value.trim(), 'song', 25);
      if (request === requestRef.current) {
        setResults(songs);
        setSearching(false);
      }
    }, 350);
  };

  const handleChooseSong = async (selected: MusicMetadata) => {
    const request = ++requestRef.current;
    const controller = new AbortController();
    lyricsRequestRef.current = controller;
    searchInputRef.current?.blur();
    setNotice('');
    setLoadingLyrics(true);
    try {
      const found = await getSongLyrics(selected, controller.signal);
      if (request !== requestRef.current) return;
      if (!found) {
        setNotice('No lyrics are available for this song yet. Try another song.');
        return;
      }
      setSong(selected);
      setLyrics(found);
      setSelection(null);
    } catch (error) {
      if (request === requestRef.current) {
        setNotice(
          error instanceof Error ? error.message : 'Could not load lyrics. Please try again.'
        );
      }
    } finally {
      if (request === requestRef.current) {
        lyricsRequestRef.current = null;
        setLoadingLyrics(false);
      }
    }
  };

  const handleCancelLyrics = () => {
    requestRef.current += 1;
    lyricsRequestRef.current?.abort();
    lyricsRequestRef.current = null;
    setLoadingLyrics(false);
  };

  const handleLinePress = (index: number) => {
    setSelection((current) => {
      if (!current) return { anchor: index, end: index };
      const low = Math.min(current.anchor, current.end);
      const high = Math.max(current.anchor, current.end);
      if (index >= low && index <= high) return { anchor: index, end: index };
      return { anchor: current.anchor, end: index };
    });
  };

  const reset = () => {
    requestRef.current += 1;
    lyricsRequestRef.current?.abort();
    lyricsRequestRef.current = null;
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    setQuery('');
    setResults([]);
    setSearching(false);
    setLoadingLyrics(false);
    setSong(null);
    setLyrics('');
    setNotice('');
    setSelection(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleConfirm = () => {
    if (!song || !selectedCount) return;
    const snippet = selectedLines.join('\n').trim();
    onSelect(snippet, song);
    reset();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 bg-theme-canvas"
        style={{ paddingTop: Math.max(insets.top, 16) }}
      >
        <View className="flex-row items-center px-6 py-5 border-b border-theme-raised">
          <Pressable
            onPress={
              song
                ? () => {
                    setSong(null);
                    setLyrics('');
                    setSelection(null);
                  }
                : handleClose
            }
            className="w-10 h-10 justify-center"
            accessibilityRole="button"
            accessibilityLabel={translate(song ? 'Back to song search' : 'Close lyrics picker')}
          >
            {song ? (
              <ArrowLeft size={24} color={themeColors.foreground} />
            ) : (
              <X size={24} color={themeColors.foreground} />
            )}
          </Pressable>
          <View className="flex-1 items-center px-2 gap-0.5">
            <Text className="font-sans-semibold text-lg text-theme-foreground">
              {translate(song ? 'Select lyrics' : 'Find a song')}
            </Text>
            {song && (
              <Text className="font-sans text-xs text-theme-secondary">
                {selectedCount
                  ? translate(selectedCount === 1 ? '1 line selected' : '%{count} lines selected', {
                      count: selectedCount,
                    })
                  : translate('Tap a line to select it')}
              </Text>
            )}
          </View>
          <View className="w-10" />
        </View>

        {song ? (
          <>
            <View className="flex-row items-center gap-4 px-8 py-5 border-b border-theme-raised">
              {song.cover ? (
                <ExpoImage
                  source={{ uri: song.cover }}
                  contentFit="cover"
                  className="w-14 h-14 rounded-lg bg-theme-raised"
                />
              ) : (
                <View className="w-14 h-14 rounded-lg bg-theme-raised items-center justify-center">
                  <Music2 size={25} color={themeColors.secondary} />
                </View>
              )}
              <View className="flex-1 gap-1">
                <Text
                  className="font-sans-semibold text-base text-theme-foreground"
                  numberOfLines={1}
                >
                  {song.title}
                </Text>
                <Text className="font-sans text-sm text-theme-secondary" numberOfLines={1}>
                  {song.artist}
                </Text>
              </View>
            </View>
            <ScrollView
              className="flex-1"
              contentContainerStyle={{
                paddingHorizontal: 10,
                paddingTop: 22,
                paddingBottom: 32,
              }}
              showsVerticalScrollIndicator={false}
            >
              {lines.map((line, index) =>
                line.trim() ? (
                  <Pressable
                    key={index}
                    onPress={() => handleLinePress(index)}
                    accessibilityRole="button"
                    accessibilityState={{
                      selected: index >= start && index <= end,
                    }}
                    accessibilityLabel={translate('Lyric line %{number}: %{line}', {
                      number: index + 1,
                      line,
                    })}
                    className={`rounded-2xl px-5 py-3 mb-2 ${index >= start && index <= end ? 'bg-theme-strongBorder' : 'active:bg-theme-surface'}`}
                  >
                    <Text
                      className={`font-sans-bold text-2xl leading-9 ${index >= start && index <= end ? 'text-theme-foreground' : 'text-theme-muted'}`}
                    >
                      {line.trim()}
                    </Text>
                  </Pressable>
                ) : (
                  <View key={index} className="h-5" />
                )
              )}
            </ScrollView>
            <ActionFooter bottomInset={insets.bottom}>
              <Button
                accessibilityLabel={translate('Add selected lyrics to note')}
                variant="primary"
                onPress={handleConfirm}
                disabled={!selectedCount}
                icon={
                  <ListMusic
                    size={20}
                    color={selectedCount ? themeColors.foreground : themeColors.muted}
                    strokeWidth={2.5}
                  />
                }
                text={translate('Add to note')}
              />
            </ActionFooter>
          </>
        ) : (
          <>
            <View className="px-8 py-6 gap-2">
              <Text className="font-sans-semibold text-2xl text-theme-foreground">
                <LocalizedText>Song lyrics</LocalizedText>
              </Text>
              <Text className="font-sans text-base text-theme-secondary">
                <LocalizedText>
                  Search the iTunes catalog, then choose a passage for your note.
                </LocalizedText>
              </Text>
            </View>
            <View className="flex-row items-center gap-4 px-8 py-5 border-t border-b border-theme-raised">
              <Search size={20} color={themeColors.body} />
              <TextInput
                ref={searchInputRef}
                value={query}
                onChangeText={handleQueryChange}
                placeholder={translate('Search song or artist...')}
                placeholderTextColor={themeColors.muted}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
                className="flex-1 font-sans text-xl text-theme-foreground leading-tight"
              />
              {searching ? <ActivityIndicator size="small" color={themeColors.secondary} /> : null}
            </View>

            {notice ? (
              <View className="py-5 px-8 border-b border-theme-raised flex-row items-center gap-3">
                <TriangleAlert size={14} color={themeColors.heading} />
                <Text className="font-sans text-sm text-theme-heading">{notice}</Text>
              </View>
            ) : null}

            <ScrollView
              className="flex-1"
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {results.map((result) => (
                <Pressable
                  key={result.id}
                  onPress={() => handleChooseSong(result)}
                  disabled={loadingLyrics}
                  className="flex-row items-center gap-4 px-8 py-4 border-b border-theme-surface active:bg-theme-surface"
                  accessibilityRole="button"
                  accessibilityLabel={`${result.title}, ${result.artist}`}
                >
                  {result.cover ? (
                    <ExpoImage
                      source={{ uri: result.cover }}
                      contentFit="cover"
                      className="w-12 h-12 rounded-md bg-theme-raised"
                    />
                  ) : (
                    <View className="w-12 h-12 rounded-md bg-theme-raised items-center justify-center">
                      <Music2 size={22} color={themeColors.secondary} />
                    </View>
                  )}
                  <View className="flex-1 gap-1">
                    <Text
                      className="font-sans-medium text-base text-theme-bright"
                      numberOfLines={1}
                    >
                      {result.title}
                    </Text>
                    <Text className="font-sans text-sm text-theme-secondary" numberOfLines={1}>
                      {result.artist}
                      {result.album ? ` • ${result.album}` : ''}
                    </Text>
                  </View>
                  {result.durationMs ? (
                    <Text className="font-sans text-xs text-theme-muted">
                      {formatDuration(result.durationMs)}
                    </Text>
                  ) : null}
                </Pressable>
              ))}
              {!searching && query.trim().length > 1 && results.length === 0 && (
                <Text className="font-sans text-sm text-theme-muted text-center py-12">
                  <LocalizedText>No songs found for "</LocalizedText>
                  {query}
                  <LocalizedText>"</LocalizedText>
                </Text>
              )}
            </ScrollView>

            {loadingLyrics && (
              <View className="absolute inset-0 bg-theme-canvas/80 items-center justify-center gap-4 px-8">
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text className="font-sans-medium text-theme-heading">
                  <LocalizedText>Loading lyrics...</LocalizedText>
                </Text>

                <Pressable
                  onPress={handleCancelLyrics}
                  accessibilityRole="button"
                  accessibilityLabel={translate('Cancel loading lyrics')}
                  className="mt-4 flex-row items-center justify-center gap-2 rounded-xl border border-theme-border px-8 py-3 active:bg-theme-surface"
                >
                  <X size={18} color={themeColors.foreground} strokeWidth={2.5} />
                  <Text className="font-sans-semibold text-base text-theme-foreground">
                    <LocalizedText>Cancel</LocalizedText>
                  </Text>
                </Pressable>
              </View>
            )}
          </>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
}
