import { ThemedModal as Modal } from '@/components/ThemedModal';
import { useAppTheme, type ThemeColors } from '@/lib/theme';
import {
  BookIcon,
  FilmSlateIcon,
  GameControllerIcon,
  MusicNoteIcon,
  TelevisionIcon,
} from 'phosphor-react-native';
import { JSX, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { NewBookModal } from '@/components/modals/NewBookModal';
import { NewGameModal } from '@/components/modals/NewGameModal';
import { NewMovieModal } from '@/components/modals/NewMovieModal';
import { NewMusicModal } from '@/components/modals/NewMusicModal';
import { NewTvShowModal } from '@/components/modals/NewTvShowModal';
import { translate, useLocalization } from '@/lib/i18n';

type EntertainmentType = 'book' | 'music' | 'movie' | 'tvshow' | 'game';

type Props = {
  visible: boolean;
  onClose: () => void;
  onDismiss?: () => void;
};

const tabs = (
  themeColors: ThemeColors
): { id: EntertainmentType; label: string; icon: JSX.Element }[] => [
  {
    id: 'book',
    label: 'Book',
    icon: <BookIcon size={20} color={themeColors.foreground} weight="bold" />,
  },
  {
    id: 'music',
    label: 'Music',
    icon: <MusicNoteIcon size={20} color={themeColors.foreground} weight="bold" />,
  },
  {
    id: 'movie',
    label: 'Film',
    icon: <FilmSlateIcon size={20} color={themeColors.foreground} weight="bold" />,
  },
  {
    id: 'tvshow',
    label: 'TV',
    icon: <TelevisionIcon size={20} color={themeColors.foreground} weight="bold" />,
  },
  {
    id: 'game',
    label: 'Game',
    icon: <GameControllerIcon size={20} color={themeColors.foreground} weight="bold" />,
  },
];

export function EntertainmentTabs({
  selectedType,
  onSelect,
}: {
  selectedType: EntertainmentType;
  onSelect: (type: EntertainmentType) => void;
}) {
  const { colors: themeColors } = useAppTheme();
  useLocalization();
  return (
    <ScrollView
      horizontal
      testID="entertainment-type-picker"
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
      keyboardShouldPersistTaps="handled"
    >
      {tabs(themeColors).map((tab) => (
        <Button
          key={tab.id}
          accessibilityLabel={translate(tab.label)}
          accessibilityRole="tab"
          selected={selectedType === tab.id}
          onPress={() => onSelect(tab.id)}
          size="small"
          variant={selectedType === tab.id ? 'primary' : 'secondary'}
          backgroundColor={themeColors.foreground}
          contentColor={selectedType === tab.id ? themeColors.inverse : themeColors.foreground}
          text={translate(tab.label)}
          icon={tab.icon}
        />
      ))}
    </ScrollView>
  );
}

export function NewEntertainmentModal({ visible, onClose, onDismiss }: Props) {
  const [selectedType, setSelectedType] = useState<EntertainmentType>('book');
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
      onDismiss={onDismiss}
      statusBarTranslucent
      presentationStyle="overFullScreen"
    >
      <View className="flex-1">
        <View pointerEvents="none" className="bg-theme-canvas" style={StyleSheet.absoluteFill} />
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View className="flex-1" style={{ paddingTop: Math.max(insets.top, 16) }}>
            <View className="flex-row items-center pt-4">
              <EntertainmentTabs selectedType={selectedType} onSelect={setSelectedType} />
            </View>

            <View className="flex-1">
              <NewBookModal
                visible={visible && selectedType === 'book'}
                embedded
                onClose={onClose}
              />
              <NewMusicModal
                visible={visible && selectedType === 'music'}
                embedded
                onClose={onClose}
              />
              <NewMovieModal
                visible={visible && selectedType === 'movie'}
                embedded
                onClose={onClose}
              />
              <NewTvShowModal
                visible={visible && selectedType === 'tvshow'}
                embedded
                onClose={onClose}
                onDismiss={onDismiss}
              />
              <NewGameModal
                visible={visible && selectedType === 'game'}
                embedded
                onClose={onClose}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
