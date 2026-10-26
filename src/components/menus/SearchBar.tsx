import { useAppTheme } from '@/lib/theme';
import { BlurView } from 'expo-blur';
import {
  Bookmark,
  Calendar,
  CircleCheck,
  Clock,
  Folder,
  Hash,
  Search,
  Ban,
  X,
} from 'lucide-react-native';
import { type ReactNode, type RefObject, useRef } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { translate, useLocalization } from '@/lib/i18n';
import { STATUS_FOLDERS } from '@/lib/library/organize';
import type { MediaProgressStatus } from '@/lib/library/types';

const statusIcons = {
  want: Bookmark,
  'in-progress': Clock,
  completed: CircleCheck,
  abandoned: Ban,
} satisfies Record<MediaProgressStatus, typeof Folder>;

type SearchFilter = {
  kind: 'tag' | 'folder' | 'date';
  label: string;
  status?: MediaProgressStatus;
  onRemove: () => void;
};

type SearchBarProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  visible?: boolean;
  filters?: SearchFilter[];
  blurTarget?: RefObject<View | null>;
  trailingAction?: ReactNode;
  bottomOffset?: number;
};

export function SearchBar({
  value,
  onChangeText,
  placeholder = 'Search cards, tags, notes...',
  visible = true,
  filters = [],
  blurTarget,
  trailingAction,
  bottomOffset = 0,
}: SearchBarProps) {
  const { colors: themeColors, isDark } = useAppTheme();
  useLocalization();
  const inputRef = useRef<TextInput>(null);

  if (!visible) return null;

  const handleClear = () => {
    onChangeText('');
    inputRef.current?.focus();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="w-full bg-transparent"
      style={{
        position: 'absolute',
        right: 0,
        bottom: bottomOffset,
        left: 0,
        zIndex: 1000,
        elevation: 1000,
      }}
    >
      <View className="mx-4 my-3 w-auto flex-row items-center gap-3">
        <View
          className="flex-1 rounded-full"
          style={{
            shadowColor: '#A1A1AA',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 10,
            elevation: 8,
          }}
        >
          <View
            className="h-full flex-row items-center overflow-hidden rounded-full border border-theme-foreground/15 px-6 py-4 gap-4"
            style={{ backgroundColor: themeColors.canvas + '33' }}
          >
            <BlurView
              intensity={48}
              tint={isDark ? 'dark' : 'light'}
              blurTarget={blurTarget}
              blurMethod="dimezisBlurView"
              pointerEvents="none"
              style={StyleSheet.absoluteFill}
            />

            <Search size={18} color={themeColors.foreground} strokeWidth={2.5} />

            <View className="flex-1 flex-row flex-nowrap items-center gap-2">
              {filters.map((filter) => {
                const isTag = filter.kind === 'tag';
                const status = filter.status
                  ? STATUS_FOLDERS.find((folder) => folder.key === filter.status)
                  : null;
                const Icon = status
                  ? statusIcons[status.key]
                  : isTag
                    ? Hash
                    : filter.kind === 'date'
                      ? Calendar
                      : Folder;
                const isDate = filter.kind === 'date';
                const iconColor =
                  (status
                    ? {
                        want: themeColors.blueSoft,
                        'in-progress': themeColors.yellow,
                        completed: themeColors.green,
                        abandoned: themeColors.secondary,
                      }[status.key]
                    : undefined) ??
                  (isTag ? themeColors.blue : isDate ? themeColors.amber : themeColors.purple);
                return (
                  <Pressable
                    key={`${filter.kind}:${filter.label}`}
                    onPress={filter.onRemove}
                    accessibilityRole="button"
                    accessibilityLabel={translate('Remove %{kind} filter %{label}', {
                      kind: translate(filter.kind),
                      label: filter.label,
                    })}
                    className={`max-w-full flex-row items-center gap-1.5 rounded-full px-3 py-1.5 active:opacity-70 ${status ? '' : isTag ? 'bg-blue-500/15' : isDate ? 'bg-amber-500/15' : 'bg-violet-500/15'}`}
                    style={status ? { backgroundColor: `${status.color}26` } : undefined}
                  >
                    <Icon size={16} color={iconColor} strokeWidth={2.5} />
                    <Text
                      numberOfLines={1}
                      className={`max-w-[180px] font-sans-medium text-base ${isTag ? 'text-theme-blue' : isDate ? 'text-theme-amber' : 'text-theme-purple'}`}
                      style={status ? { color: iconColor } : undefined}
                    >
                      {filter.label}
                    </Text>
                    <X size={14} color={iconColor} strokeWidth={2.5} />
                  </Pressable>
                );
              })}
              <TextInput
                ref={inputRef}
                value={value}
                onChangeText={onChangeText}
                placeholder={translate(filters.length > 0 ? 'Search within...' : placeholder)}
                placeholderTextColor={themeColors.muted}
                className="min-w-0 flex-1 font-sans text-2xl text-theme-foreground leading-tight"
                returnKeyType="search"
                multiline={false}
                scrollEnabled
                autoCorrect={false}
                autoCapitalize="none"
                clearButtonMode="never"
              />
            </View>
            {value.length > 0 && (
              <Pressable
                onPress={handleClear}
                hitSlop={10}
                className="p-1.5 rounded-full bg-theme-border items-center justify-center active:opacity-70"
                accessibilityLabel={translate('Clear search')}
              >
                <X size={12} color={themeColors.heading} strokeWidth={2.5} />
              </Pressable>
            )}
          </View>
        </View>
        {trailingAction}
      </View>
    </KeyboardAvoidingView>
  );
}
