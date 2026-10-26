import { ThemedModal as Modal } from '@/components/ThemedModal';
import { useAppTheme, type ThemeColors } from '@/lib/theme';
import { Image as ExpoImage } from 'expo-image';
import { useVideoPlayer, type VideoThumbnail } from 'expo-video';
import { CheckIcon, NotePencilIcon, TextTIcon, XIcon } from 'phosphor-react-native';
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
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActionFooter } from '@/components/ActionFooter';
import { Button } from '@/components/Button';
import { TagsBox } from '@/components/TagsBox';

import { useLibrary } from '@/hooks/useLibrary';
import type { PickedVideoAsset } from '@/lib/library/storage';
import type { VideoItem } from '@/lib/library/types';
import { generateAutoTagsAsync, isGibberishOrMachineId } from '@/lib/tags/autoTags';
import { LocalizedText } from '@/components/LocalizedText';
import { translate, useLocalization } from '@/lib/i18n';

function getCleanVideoTitle(fileName?: string | null): string {
  if (!fileName) return '';
  const nameWithoutExt = fileName.replace(/\.[a-zA-Z0-9]{2,5}$/, '').trim();
  if (isGibberishOrMachineId(nameWithoutExt)) return '';
  return nameWithoutExt.replace(/[-_]+/g, ' ').trim();
}

type NewVideoModalProps = {
  visible: boolean;
  videoAsset: PickedVideoAsset | null;
  onClose: () => void;
  onDismiss?: () => void;
  onSaved?: (item: VideoItem) => void;
};

function VideoAssetPreview({ uri }: { uri: string }) {
  useLocalization();
  const player = useVideoPlayer(uri);
  const { width: windowWidth } = useWindowDimensions();
  const [thumbnail, setThumbnail] = useState<VideoThumbnail | null>(null);
  const [aspectRatio, setAspectRatio] = useState(16 / 9);

  useEffect(() => {
    let active = true;
    let requested = false;
    const loadThumbnail = async () => {
      if (requested || player.status !== 'readyToPlay') return;
      requested = true;
      const videoSize = player.videoTrack?.size;
      if (videoSize && videoSize.width > 0 && videoSize.height > 0) {
        setAspectRatio(videoSize.width / videoSize.height);
      }
      try {
        const [frame] = await player.generateThumbnailsAsync(0);
        if (active && frame) {
          setThumbnail(frame);
          if (frame.width > 0 && frame.height > 0) setAspectRatio(frame.width / frame.height);
        }
      } catch (error) {
        console.warn('Failed to generate video preview:', error);
      }
    };
    void loadThumbnail();
    const subscription = player.addListener('statusChange', () => void loadThumbnail());
    return () => {
      active = false;
      subscription.remove();
    };
  }, [player]);

  const previewHeight = Math.min(160, Math.min(windowWidth * 0.4, 220) / aspectRatio);
  const previewWidth = previewHeight * aspectRatio;

  return (
    <View
      testID="video-asset-preview"
      className="overflow-hidden rounded-xl bg-theme-surface"
      style={{ width: previewWidth, height: previewHeight }}
    >
      {thumbnail ? (
        <ExpoImage source={thumbnail} contentFit="contain" style={StyleSheet.absoluteFill} />
      ) : (
        <View className="flex-1 items-center justify-center">
          <Text className="font-sans text-sm text-theme-secondary">
            <LocalizedText>Loading preview…</LocalizedText>
          </Text>
        </View>
      )}
    </View>
  );
}

export function NewVideoModal({
  visible,
  videoAsset,
  onClose,
  onDismiss,
  onSaved,
}: NewVideoModalProps) {
  const { colors: themeColors } = useAppTheme();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);
  const [title, setTitle] = useState(() => getCleanVideoTitle(videoAsset?.fileName));
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const titleInputRef = useRef<TextInput>(null);
  const tagsInputRef = useRef<TextInput>(null);
  const noteInputRef = useRef<TextInput>(null);
  const [autoTags, setAutoTags] = useState<string[]>([]);
  const autoTagsRef = useRef<string[]>([]);

  const { addVideo, getTags } = useLibrary();
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
    if (autoTagsRef.current.length === 0) return;
    setTags((prev) => prev.filter((t) => !autoTagsRef.current.includes(t)));
    autoTagsRef.current = [];
    setAutoTags([]);
  }, []);

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
    const fallbackTitle = getCleanVideoTitle(videoAsset?.fileName);

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
          type: 'video',
          existingTags,
        });
        if (auto.length > 0) {
          updateAutoTags(auto);
        }
      } catch (e) {
        console.warn('Failed to generate video tags:', e);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [visible, title, note, videoAsset, existingTags, updateAutoTags, clearAutoTags]);

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
    if (!videoAsset || saving) return;

    setSaving(true);
    try {
      const finalTags = [...tags];
      const pending = tagInput.replace(/^#/, '').trim();
      if (pending && !finalTags.includes(pending)) {
        finalTags.push(pending);
      }
      const savedAutoTags = autoTagsRef.current.filter((t) => finalTags.includes(t));

      const item = await addVideo(videoAsset, {
        title: title.trim() || getCleanVideoTitle(videoAsset.fileName) || undefined,
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
      console.error('Failed to save video:', e);
      Alert.alert(translate('Error'), e instanceof Error ? e.message : 'Failed to save video');
    } finally {
      setSaving(false);
    }
  };

  if (!videoAsset && !visible) {
    return null;
  }

  const canSave = Boolean(videoAsset) && !saving;

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
              {videoAsset && (
                <View className="self-center overflow-hidden bg-theme-surface border border-theme-raised">
                  <VideoAssetPreview uri={videoAsset.uri} />
                </View>
              )}
              <View className="flex-1 gap-3">
                <Text className="font-sans-semibold text-2xl text-theme-foreground">
                  <LocalizedText>Add a new video</LocalizedText>
                </Text>
                <Text className="font-sans text-base text-theme-secondary leading-relaxed">
                  <LocalizedText>
                    Save videos from your gallery to your board with a title, tags and note.
                  </LocalizedText>
                </Text>
              </View>
            </View>

            {/* Title Input */}
            <View className="flex-row items-center gap-4 py-5 px-8 border-b border-theme-raised">
              <TextTIcon size={20} color={themeColors.body} />

              <TextInput
                ref={titleInputRef}
                value={title}
                onChangeText={setTitle}
                placeholder={translate('Add a title to this video')}
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
                <NotePencilIcon size={14} color={themeColors.heading} weight="bold" />
                <Text className="font-sans-semibold text-sm tracking-wider uppercase text-theme-heading">
                  <LocalizedText>Note</LocalizedText>
                </Text>
              </View>

              <Pressable onPress={() => noteInputRef.current?.focus()} className="w-full">
                <TextInput
                  ref={noteInputRef}
                  value={note}
                  onChangeText={setNote}
                  placeholder={translate('Add a text note to this video...')}
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
              icon={<XIcon size={20} color={themeColors.foreground} weight="bold" />}
              text={translate('Cancel')}
            />
            <Button
              accessibilityLabel={translate('Save video')}
              variant="primary"
              onPress={handleSave}
              disabled={!canSave}
              icon={
                saving ? (
                  <ActivityIndicator size={20} color={themeColors.inverse} />
                ) : (
                  <CheckIcon
                    size={20}
                    color={canSave ? themeColors.inverse : themeColors.muted}
                    weight="bold"
                  />
                )
              }
              text={translate('Save video')}
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
