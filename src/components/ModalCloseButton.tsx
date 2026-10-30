import { Button } from '@/components/Button';
import { translate } from '@/lib/i18n';
import { X } from 'lucide-react-native';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function ModalCloseButton({
  onPress,
  disabled = false,
  embedded = false,
}: {
  onPress: () => void;
  disabled?: boolean;
  embedded?: boolean;
}) {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ position: 'absolute', top: embedded ? 0 : insets.top, left: 28, zIndex: 30 }}>
      <Button
        size="small"
        accessibilityLabel={translate('Close')}
        onPress={onPress}
        disabled={disabled}
        icon={<X size={20} />}
      />
    </View>
  );
}
