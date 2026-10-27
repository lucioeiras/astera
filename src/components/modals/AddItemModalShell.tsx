import { ThemedModal as Modal } from '@/components/ThemedModal';
import type { ReactNode } from 'react';
import { View } from 'react-native';

type Props = {
  visible: boolean;
  embedded?: boolean;
  onRequestClose: () => void;
  onDismiss?: () => void;
  children: ReactNode;
};

export function AddItemModalShell({
  visible,
  embedded = false,
  onRequestClose,
  onDismiss,
  children,
}: Props) {
  if (embedded) return visible ? <>{children}</> : null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onRequestClose}
      onDismiss={onDismiss}
      statusBarTranslucent
    >
      <View className="flex-1">{children}</View>
    </Modal>
  );
}
