import { ThemedModal as Modal } from '@/components/ThemedModal';
import { useAppTheme, type ThemeColors } from '@/lib/theme';
import { CheckIcon, LinkIcon, NotePencilIcon, TextTIcon, XIcon } from 'phosphor-react-native';
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
import { TagsBox } from '@/components/TagsBox';
import { useLibrary } from '@/hooks/useLibrary';
import { type ResolvedMetadata, resolveUrlMetadata } from '@/lib/library/metadata';
import type { LinkUploadItem } from '@/lib/library/storage';
import { generateAutoTags, generateAutoTagsAsync } from '@/lib/tags/autoTags';
import { LocalizedText } from '@/components/LocalizedText';
import { translate, useLocalization } from '@/lib/i18n';

type NewLinkModalProps = {
  visible: boolean;
  initialUrl?: string;
  initialTitle?: string;
  onClose: () => void;
  onDismiss?: () => void;
  onSaved?: (item: LinkUploadItem) => void;
};

export function NewLinkModal({
  visible,
  initialUrl,
  initialTitle,
  onClose,
  onDismiss,
  onSaved,
}: NewLinkModalProps) {
  const { colors: themeColors } = useAppTheme();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);
  useLocalization();
  const { addLinkItem, getTags } = useLibrary();
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);
  const titleInputRef = useRef<TextInput>(null);
  const tagsInputRef = useRef<TextInput>(null);
  const noteInputRef = useRef<TextInput>(null);

  const [url, setUrl] = useState(initialUrl ?? '');
  const [title, setTitle] = useState(initialTitle ?? '');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [resolvedMetadata, setResolvedMetadata] = useState<ResolvedMetadata | null>(null);
  const lastFetchedUrlRef = useRef<string>('');
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

  const handleUrlChange = (newUrl: string) => {
    setUrl(newUrl);
    if (!newUrl.trim()) {
      setResolvedMetadata(null);
      lastFetchedUrlRef.current = '';
      clearAutoTags();
      return;
    }

    let target = newUrl.trim();
    if (!/^https?:\/\//i.test(target)) {
      target = `https://${target}`;
    }
    try {
      const parsed = new URL(target);
      if (parsed.hostname.includes('.') && parsed.hostname.length >= 4) {
        if (target !== lastFetchedUrlRef.current) {
          clearAutoTags();
          const instantTags = generateAutoTags({
            url: target,
            note: note.trim() || undefined,
            existingTags,
          });
          updateAutoTags(instantTags);
        }
      } else {
        lastFetchedUrlRef.current = '';
        clearAutoTags();
      }
    } catch {
      lastFetchedUrlRef.current = '';
      clearAutoTags();
    }
  };

  const handleClearUrl = () => {
    setUrl('');
    setResolvedMetadata(null);
    lastFetchedUrlRef.current = '';
    clearAutoTags();
    inputRef.current?.focus();
  };

  useEffect(() => {
    let targetUrl = url.trim();
    if (!targetUrl) {
      return;
    }

    if (!/^https?:\/\//i.test(targetUrl)) {
      targetUrl = `https://${targetUrl}`;
    }

    try {
      const parsed = new URL(targetUrl);
      if (!parsed.hostname.includes('.') || parsed.hostname.length < 4) {
        return;
      }
    } catch {
      return;
    }

    if (targetUrl === lastFetchedUrlRef.current) return;

    const timer = setTimeout(async () => {
      lastFetchedUrlRef.current = targetUrl;
      try {
        const meta = await resolveUrlMetadata(targetUrl);
        if (lastFetchedUrlRef.current !== targetUrl) return;
        setResolvedMetadata(meta);

        const title = 'title' in meta ? meta.title : 'siteTitle' in meta ? meta.siteTitle : '';
        const text = 'text' in meta ? meta.text : 'description' in meta ? meta.description : '';
        const origin = 'origin' in meta ? meta.origin : undefined;
        const author = 'author' in meta ? meta.author : undefined;
        const subreddit = 'subreddit' in meta ? meta.subreddit : undefined;

        const auto = await generateAutoTagsAsync({
          title,
          text,
          note: note.trim() || undefined,
          url: meta.url,
          origin,
          author,
          subreddit,
          type: meta.type,
          existingTags,
        });

        if (lastFetchedUrlRef.current !== targetUrl) return;

        updateAutoTags(auto);
      } catch (e) {
        console.warn('Failed to pre-fetch metadata:', e);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [url, existingTags, note, updateAutoTags]);

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
    setUrl('');
    setTitle('');
    setTags([]);
    setAutoTags([]);
    autoTagsRef.current = [];
    setTagInput('');
    setNote('');
    setResolvedMetadata(null);
    lastFetchedUrlRef.current = '';
    onClose();
  };

  const handleSave = async () => {
    let targetUrl = url.trim();
    if (!targetUrl || saving) return;

    if (!/^https?:\/\//i.test(targetUrl)) {
      targetUrl = `https://${targetUrl}`;
    }

    setSaving(true);
    try {
      const finalTags = [...tags];
      const pending = tagInput.replace(/^#/, '').trim();
      if (pending && !finalTags.includes(pending)) {
        finalTags.push(pending);
      }
      const savedAutoTags = autoTagsRef.current.filter((t) => finalTags.includes(t));

      const item = await addLinkItem(targetUrl, {
        title: title.trim() || undefined,
        tags: finalTags.length > 0 ? finalTags : undefined,
        autoTags: savedAutoTags.length > 0 ? savedAutoTags : undefined,
        note: note.trim() || undefined,
        preloadedMetadata: resolvedMetadata ?? undefined,
      });
      setUrl('');
      setTitle('');
      setTags([]);
      setAutoTags([]);
      autoTagsRef.current = [];
      setTagInput('');
      setNote('');
      setResolvedMetadata(null);
      lastFetchedUrlRef.current = '';
      onSaved?.(item);
      onClose();
    } catch (e) {
      console.error('Failed to save link:', e);
      Alert.alert(translate('Error'), e instanceof Error ? e.message : 'Failed to save link');
    } finally {
      setSaving(false);
    }
  };

  const canSave = url.trim().length > 0 && !saving;

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
            <View className="gap-3 p-8 pt-0">
              <Text className="font-sans-semibold text-2xl text-theme-foreground">
                <LocalizedText>Add a new link</LocalizedText>
              </Text>
              <Text className="font-sans text-base text-theme-secondary leading-relaxed">
                <LocalizedText>
                  You can add any link, but YouTube videos, Tweets, Reddit posts, and articles have
                  special views.
                </LocalizedText>
              </Text>
            </View>

            {/* Link Input */}
            <View className="flex-row items-center gap-4 py-5 px-8 border-t border-b border-theme-raised">
              <LinkIcon size={20} color={themeColors.body} />

              <TextInput
                ref={inputRef}
                value={url}
                onChangeText={handleUrlChange}
                placeholder={translate('Type or paste your link here')}
                placeholderTextColor={themeColors.muted}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                returnKeyType="next"
                onSubmitEditing={() => {
                  titleInputRef.current?.focus();
                }}
                className="flex-1 font-sans text-xl text-theme-foreground leading-tight"
                style={styles.borderlessInput}
                underlineColorAndroid="transparent"
                clearButtonMode="never"
              />

              {url.length > 0 && (
                <Pressable
                  onPress={handleClearUrl}
                  hitSlop={10}
                  className="p-1.5 rounded-full bg-theme-raised items-center justify-center active:opacity-70"
                  accessibilityRole="button"
                  accessibilityLabel={translate('Clear link')}
                >
                  <XIcon size={12} color={themeColors.heading} weight="bold" />
                </Pressable>
              )}
            </View>

            {/* Title Input */}
            <View className="flex-row items-center gap-4 py-5 px-8 border-b border-theme-raised">
              <TextTIcon size={20} color={themeColors.body} />
              <TextInput
                ref={titleInputRef}
                value={title}
                onChangeText={setTitle}
                placeholder={translate('Add a title here...')}
                placeholderTextColor={themeColors.muted}
                returnKeyType="next"
                onSubmitEditing={() => {
                  tagsInputRef.current?.focus();
                }}
                className="flex-1 font-sans text-xl text-theme-foreground leading-tight"
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
                  placeholder={translate('Add a text note to this link...')}
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
              accessibilityLabel={translate('Save link')}
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
              text={translate('Save link')}
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
