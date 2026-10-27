import { Modal, type ModalProps } from 'react-native';
import { ThemeScope } from '@/lib/theme';

/** Keep NativeWind variables available inside native modals and web portals. */
export function ThemedModal({ children, ...props }: ModalProps) {
  return (
    <Modal {...props}>
      <ThemeScope>{children}</ThemeScope>
    </Modal>
  );
}
