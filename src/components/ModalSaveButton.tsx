import type { ReactNode } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function ModalSaveButton({
  children,
  embedded = false,
}: {
  children: ReactNode;
  embedded?: boolean;
}) {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ position: 'absolute', top: embedded ? 0 : insets.top, right: 28, zIndex: 30 }}>
      {children}
    </View>
  );
}
