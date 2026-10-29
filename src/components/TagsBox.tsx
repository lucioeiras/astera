import type { ComponentType } from 'react';
import { useAppTheme } from '@/lib/theme';
import {
  RedditLogoIcon,
  TwitterLogoIcon,
  TiktokLogoIcon,
  YoutubeLogoIcon,
} from 'phosphor-react-native';
import {
  Newspaper,
  RefreshCw,
  BookOpen,
  Bookmark,
  CircleCheck,
  Clock,
  FileText,
  Clapperboard,
  Tv,
  Folder,
  Gamepad2,
  Hash,
  ImageIcon,
  LinkIcon,
  Music2,
  SquarePen,
  Ban,
  Quote,
  Tag,
  X,
  Video,
} from 'lucide-react-native';
import { useRef, useState } from 'react';
import {
  type LayoutChangeEvent,
  type NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  type TextInputKeyPressEventData,
  View,
} from 'react-native';

import type { LibraryItemType } from '@/lib/library/types';
import { translate, useLocalization } from '@/lib/i18n';

const cardTypeTags = {
  note: { label: 'Note', icon: SquarePen },
  quote: { label: 'Quote', icon: Quote },
  image: { label: 'Image', icon: ImageIcon },
  pdf: { label: 'PDF', icon: FileText },
  video: { label: 'Video', icon: Video },
  audio: { label: 'Recorded audio', icon: Music2 },
  link: { label: 'Link', icon: LinkIcon },
  article: { label: 'Article', icon: Newspaper },
  youtube: { label: 'YouTube', icon: YoutubeLogoIcon },
  tiktok: { label: 'TikTok', icon: TiktokLogoIcon },
  tweet: { label: 'Tweet', icon: TwitterLogoIcon },
  reddit: { label: 'Reddit', icon: RedditLogoIcon },
  book: { label: 'Book', icon: BookOpen },
  music: { label: 'Music', icon: Music2 },
  movie: { label: 'Movie', icon: Clapperboard },
  tvshow: { label: 'TV show', icon: Tv },
  game: { label: 'Game', icon: Gamepad2 },
} satisfies Record<
  LibraryItemType,
  { label: string; icon: ComponentType<{ size?: number; color?: string }> }
>;

export type TagsBoxProps = {
  /** Current array of tags */
  tags: string[];
  /** Array of automatically generated / smart tags */
  autoTags?: string[];
  /** Saved folder names whose matching tags should use the folder appearance. */
  folderTags?: readonly string[];
  /** Callback when tags list changes */
  onTagsChange?: (tags: string[] | ((prev: string[]) => string[])) => void;
  /** Callback when autoTags list changes */
  onAutoTagsChange?: (autoTags: string[] | ((prev: string[]) => string[])) => void;
  /** Controlled input value */
  tagInput?: string;
  /** Callback when tag input value changes */
  onTagInputChange?: (text: string) => void;
  /** Ref for the TextInput */
  inputRef?: React.RefObject<TextInput | null>;
  /** Placeholder when tags array is empty */
  placeholder?: string;
  /** Custom section header title */
  title?: string;
  /** Container className */
  containerClassName?: string;
  /** Optional className alias */
  className?: string;
  /** Whether to show the X remove icon on tag pills */
  showRemoveIcon?: boolean;
  /** Whether the text input can be edited */
  editable?: boolean;
  /** Callback when user hits enter on empty input */
  onSubmitEditing?: () => void;
  /** Custom callback when adding a single tag */
  onAddTag?: (tag: string) => void;
  /** Custom callback when removing a tag */
  onRemoveTag?: (tag: string, index: number) => void;
  /** Custom press handler on a tag pill */
  onTagPress?: (tag: string, index: number) => void;
  /** Custom long press handler on a tag pill */
  onTagLongPress?: (tag: string, index: number) => void;
  /** Custom press handler on the tags box container */
  onContainerPress?: () => void;
  /** Callback when the text input is focused */
  onInputFocus?: () => void;
  /** Callback for layout measurement */
  onLayout?: (e: LayoutChangeEvent) => void;
  /** Custom wrapper around each tag pill */
  renderTagWrapper?: (tag: string, index: number, children: React.ReactNode) => React.ReactNode;
  /** A prominent, non-removable pill displayed before the regular tags. */
  priorityTag?: {
    label: string;
    tone: 'blue' | 'amber' | 'emerald' | 'zinc';
    icon: 'want' | 'in-progress' | 'completed' | 'abandoned';
    onPress?: () => void;
    accessibilityLabel?: string;
  };
  /** Derived card type pill, shown after the status and before saved tags. */
  cardType?: LibraryItemType;
  onCardTypePress?: (type: LibraryItemType, label: string) => void;
};

export function TagsBox({
  tags,
  autoTags,
  folderTags,
  onTagsChange,
  onAutoTagsChange,
  tagInput: tagInputProp,
  onTagInputChange: onTagInputChangeProp,
  inputRef,
  placeholder,
  title,
  className,
  containerClassName,
  showRemoveIcon = true,
  editable = true,
  onSubmitEditing,
  onAddTag,
  onRemoveTag,
  onTagPress,
  onTagLongPress,
  onContainerPress,
  onInputFocus,
  onLayout,
  renderTagWrapper,
  priorityTag,
  cardType,
  onCardTypePress,
}: TagsBoxProps) {
  const { colors: themeColors } = useAppTheme();
  useLocalization();
  const fallbackInputRef = useRef<TextInput>(null);
  const effectiveInputRef = inputRef ?? fallbackInputRef;

  const [internalTagInput, setInternalTagInput] = useState('');
  const isControlled = tagInputProp !== undefined;
  const effectiveTagInput = isControlled ? tagInputProp : internalTagInput;

  const setTagInput = (text: string) => {
    if (isControlled) {
      onTagInputChangeProp?.(text);
    } else {
      setInternalTagInput(text);
    }
  };

  const handleRemoveTag = (indexToRemove: number) => {
    const removed = tags[indexToRemove];
    if (!removed) return;

    if (onRemoveTag) {
      onRemoveTag(removed, indexToRemove);
    }
    if (onTagsChange) {
      onTagsChange((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    }
    if (onAutoTagsChange) {
      onAutoTagsChange((prev) => prev.filter((t) => t !== removed));
    }
  };

  const handleTagInputChange = (text: string) => {
    if (text.includes(' ') || text.includes(',')) {
      const parts = text.split(/[\s,]+/);
      const endsWithDelimiter = text.endsWith(' ') || text.endsWith(',');
      const tokensToAdd = endsWithDelimiter
        ? parts.filter(Boolean)
        : parts.slice(0, -1).filter(Boolean);
      const remainder = endsWithDelimiter ? '' : parts[parts.length - 1];

      if (tokensToAdd.length > 0) {
        if (onAddTag) {
          for (const token of tokensToAdd) {
            const clean = token.replace(/^#/, '').trim();
            if (clean && !tags.includes(clean)) {
              onAddTag(clean);
            }
          }
        } else if (onTagsChange) {
          onTagsChange((prev) => {
            const next = [...prev];
            for (const token of tokensToAdd) {
              const clean = token.replace(/^#/, '').trim();
              if (clean && !next.includes(clean)) {
                next.push(clean);
              }
            }
            return next;
          });
        }
      }
      setTagInput(remainder);
    } else {
      setTagInput(text);
    }
  };

  const handleTagInputKeyPress = (e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
    if (e.nativeEvent.key === 'Backspace' && effectiveTagInput === '' && tags.length > 0) {
      handleRemoveTag(tags.length - 1);
    }
  };

  const handleTagInputSubmit = () => {
    const clean = effectiveTagInput.replace(/^#/, '').trim();
    if (clean) {
      if (!tags.includes(clean)) {
        if (onAddTag) {
          onAddTag(clean);
        } else if (onTagsChange) {
          onTagsChange((prev) => [...prev, clean]);
        }
      }
      setTagInput('');
    } else {
      onSubmitEditing?.();
    }
  };

  const baseContainerClass =
    containerClassName ?? className ?? 'py-6 px-8 border-b border-theme-raised gap-4';
  const priorityTagStyles = {
    blue: {
      container: 'bg-blue-500/15',
      text: 'text-theme-blue',
      icon: themeColors.blueSoft,
    },
    amber: {
      container: 'bg-amber-400/15',
      text: 'text-theme-amber',
      icon: themeColors.yellow,
    },
    emerald: {
      container: 'bg-emerald-400/15',
      text: 'text-theme-green',
      icon: themeColors.green,
    },
    zinc: {
      container: 'bg-theme-border/60',
      text: 'text-theme-body',
      icon: themeColors.secondary,
    },
  } as const;
  const priorityTagIcons = {
    want: Bookmark,
    'in-progress': Clock,
    completed: CircleCheck,
    abandoned: Ban,
  } as const;
  const PriorityTagIcon = priorityTag ? priorityTagIcons[priorityTag.icon] : null;
  const cardTypeTag = cardType ? cardTypeTags[cardType] : null;
  const CardTypeIcon = cardTypeTag?.icon;

  return (
    <View onLayout={onLayout} className={baseContainerClass}>
      {/* Header */}
      <View className="flex-row items-center gap-2">
        <Tag size={14} color={themeColors.heading} strokeWidth={2} />
        <Text className="font-sans-semibold text-sm tracking-wider uppercase text-theme-heading">
          {title ?? `Tags${tags.length > 0 ? ` (${tags.length})` : ''}`}
        </Text>
      </View>

      {/* Tags & Input Container */}
      <Pressable
        onPress={() => {
          if (onContainerPress) {
            onContainerPress();
          } else {
            effectiveInputRef.current?.focus();
          }
        }}
        className="w-full flex-row flex-wrap gap-y-3 items-center gap-2 min-h-[28px]"
      >
        {priorityTag && PriorityTagIcon ? (
          <Pressable
            onPress={priorityTag.onPress}
            accessibilityRole={priorityTag.onPress ? 'button' : undefined}
            accessibilityLabel={priorityTag.accessibilityLabel ?? priorityTag.label}
            className={`flex-row items-center gap-1.5 rounded-full px-3 py-1 active:opacity-70 ${priorityTagStyles[priorityTag.tone].container}`}
          >
            <PriorityTagIcon
              size={14}
              color={priorityTagStyles[priorityTag.tone].icon}
              strokeWidth={2}
            />
            <Text
              className={`font-sans-medium text-base ${priorityTagStyles[priorityTag.tone].text}`}
            >
              {priorityTag.label}
            </Text>
            <RefreshCw size={12} color={priorityTagStyles[priorityTag.tone].icon} />
          </Pressable>
        ) : null}

        {cardType && cardTypeTag && CardTypeIcon ? (
          <Pressable
            onPress={() => onCardTypePress?.(cardType, cardTypeTag.label)}
            accessibilityRole="button"
            accessibilityLabel={translate('Search %{type} cards', {
              type: translate(cardTypeTag.label),
            })}
            className="flex-row items-center gap-2 rounded-full bg-theme-muted/15 px-3 py-1 active:opacity-70"
          >
            <CardTypeIcon
              size={12}
              color={themeColors.secondary}
              {...(['youtube', 'tiktok', 'tweet', 'reddit'].includes(cardType)
                ? { weight: 'regular' as const }
                : { strokeWidth: 2 })}
            />
            <Text className="font-sans-medium text-base text-theme-body">{cardTypeTag.label}</Text>
          </Pressable>
        ) : null}

        {tags.map((tag, idx) => {
          const isFolder = folderTags?.includes(tag.trim()) ?? false;
          const isAuto = autoTags?.includes(tag);
          const tagColor = isFolder
            ? themeColors.purple
            : isAuto
              ? themeColors.secondary
              : themeColors.blue;
          const TagPillIcon = isFolder ? Folder : Hash;

          const pill = (
            <Pressable
              key={`${tag}-${idx}`}
              onPress={() => {
                if (onTagPress) {
                  onTagPress(tag, idx);
                } else {
                  handleRemoveTag(idx);
                }
              }}
              onLongPress={onTagLongPress ? () => onTagLongPress(tag, idx) : undefined}
              delayLongPress={250}
              accessibilityRole="button"
              accessibilityLabel={isFolder ? `Folder ${tag}` : `Tag ${tag}`}
              className={`flex-row items-center gap-2 rounded-full px-3 py-1 active:opacity-70 ${
                isFolder ? 'bg-violet-500/15' : isAuto ? 'bg-theme-muted/15' : 'bg-blue-500/15'
              }`}
            >
              <TagPillIcon size={12} color={tagColor} strokeWidth={2} />
              <Text
                className={`font-sans-medium text-base ${isFolder ? 'text-theme-purple' : isAuto ? 'text-theme-body' : 'text-theme-blue'}`}
              >
                {tag}
              </Text>
              {showRemoveIcon && <X size={14} color={tagColor} />}
            </Pressable>
          );

          return renderTagWrapper ? renderTagWrapper(tag, idx, pill) : pill;
        })}

        {editable && (
          <TextInput
            ref={effectiveInputRef}
            value={effectiveTagInput}
            onFocus={onInputFocus}
            onChangeText={handleTagInputChange}
            onKeyPress={handleTagInputKeyPress}
            placeholder={translate(
              tags.length === 0 ? (placeholder ?? 'Add tags here...') : '+ Add more'
            )}
            placeholderTextColor={themeColors.muted}
            returnKeyType="done"
            onSubmitEditing={handleTagInputSubmit}
            className={`font-sans text-lg leading-tight text-theme-heading flex-grow min-w-[120px] ${tags.length === 0 ? '' : 'ml-2'}`}
            style={styles.borderlessInput}
            underlineColorAndroid="transparent"
            autoCapitalize="none"
            autoCorrect={false}
          />
        )}
      </Pressable>
    </View>
  );
}

export const TagBox = TagsBox;

const styles = StyleSheet.create({
  borderlessInput: {
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
});
