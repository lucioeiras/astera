import { ThemedModal as Modal } from '@/components/ThemedModal';
import { useAppTheme, type ThemeColors } from '@/lib/theme';
import { Book, Clapperboard, Gamepad2, Music, Tv } from 'lucide-react-native';
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
    icon: <Book size={20} color={themeColors.foreground} strokeWidth={2} />,
  },
  {
    id: 'music',
    label: 'Music',
    icon: <Music size={20} color={themeColors.foreground} strokeWidth={2} />,
  },
  {
    id: 'movie',
    label: 'Film',
    icon: <Clapperboard size={20} color={themeColors.foreground} strokeWidth={2} />,
  },
  {
    id: 'tvshow',
    label: 'TV',
    icon: <Tv size={20} color={themeColors.foreground} strokeWidth={2} />,
  },
  {
    id: 'game',
    label: 'Game',
    icon: <Gamepad2 size={20} color={themeColors.foreground} strokeWidth={2} />,
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
      contentContainerStyle={{ paddingHorizontal: 32, gap: 8 }}
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
  const typePicker = <EntertainmentTabs selectedType={selectedType} onSelect={setSelectedType} />;

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
            <View className="flex-1">
              <NewBookModal
                visible={visible && selectedType === 'book'}
                embedded
                typePicker={typePicker}
                onClose={onClose}
              />
              <NewMusicModal
                visible={visible && selectedType === 'music'}
                embedded
                typePicker={typePicker}
                onClose={onClose}
              />
              <NewMovieModal
                visible={visible && selectedType === 'movie'}
                embedded
                typePicker={typePicker}
                onClose={onClose}
              />
              <NewTvShowModal
                visible={visible && selectedType === 'tvshow'}
                embedded
                typePicker={typePicker}
                onClose={onClose}
                onDismiss={onDismiss}
              />
              <NewGameModal
                visible={visible && selectedType === 'game'}
                embedded
                typePicker={typePicker}
                onClose={onClose}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
