import type { ReactNode } from 'react';
import { Keyboard, Platform, ScrollView, View } from 'react-native';
import { useEffect, useState } from 'react';
import { KeyboardOff } from 'lucide-react-native';
import { Button, ButtonSizeContext } from '@/components/Button';
import { translate } from '@/lib/i18n';

type ActionFooterProps = {
  children?: ReactNode;
  bottomInset?: number;
  overlay?: boolean;
  horizontalScroll?: boolean;
  buttonSize?: 'default' | 'small';
};

/** Floating, transparent action row shared by card details and modal forms. */
export function ActionFooter({
  children,
  bottomInset = 0,
  overlay = false,
  horizontalScroll = false,
  buttonSize = 'default',
}: ActionFooterProps) {
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showEvent = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setKeyboardVisible(true)
    );
    const hideEvent = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardVisible(false)
    );
    return () => {
      showEvent.remove();
      hideEvent.remove();
    };
  }, []);

  const dismissKeyboardButton = keyboardVisible ? (
    <Button
      accessibilityLabel={translate('Hide keyboard')}
      onPress={() => Keyboard.dismiss()}
      icon={<KeyboardOff size={24} />}
    />
  ) : null;

  return (
    <ButtonSizeContext.Provider value={buttonSize}>
      <View
        pointerEvents="box-none"
        style={{
          marginHorizontal: horizontalScroll ? 4 : 12,
          marginBottom: keyboardVisible ? 12 : Math.max(bottomInset, 12),
          backgroundColor: 'transparent',
          ...(overlay ? { position: 'absolute', right: 0, bottom: 0, left: 0, zIndex: 20 } : null),
        }}
      >
        {horizontalScroll ? (
          <ScrollView
            horizontal
            className="w-full flex-grow-0"
            contentContainerStyle={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              paddingHorizontal: 8,
            }}
            keyboardShouldPersistTaps="always"
            showsHorizontalScrollIndicator={false}
          >
            {children}
            {dismissKeyboardButton}
          </ScrollView>
        ) : (
          <View className="w-full flex-row flex-wrap items-center justify-center gap-3 bg-transparent">
            {children}
            {dismissKeyboardButton}
          </View>
        )}
      </View>
    </ButtonSizeContext.Provider>
  );
}
