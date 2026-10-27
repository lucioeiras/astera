import { useAppTheme } from '@/lib/theme';
import { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { LocalizedText } from '@/components/LocalizedText';
import { translate, useLocalization } from '@/lib/i18n';

type RestoreToastProps = {
  visible: boolean;
  count: number;
  bottomOffset?: number;
  onRestore: () => void;
  onDismiss: () => void;
};

const DURATION_MS = 5000;

export function RestoreToast({
  visible,
  count,
  bottomOffset = 0,
  onRestore,
  onDismiss,
}: RestoreToastProps) {
  const { colors: themeColors } = useAppTheme();
  useLocalization();
  const [progress, setProgress] = useState(1);
  const onDismissRef = useRef(onDismiss);

  useEffect(() => {
    onDismissRef.current = onDismiss;
  }, [onDismiss]);

  useEffect(() => {
    if (!visible) return;

    const startTime = Date.now();
    let animationFrameId: number;
    let lastUpdate = startTime;

    const tick = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const remaining = Math.max(0, 1 - elapsed / DURATION_MS);

      if (now - lastUpdate >= 30 || remaining <= 0) {
        lastUpdate = now;
        setProgress(remaining);
      }

      if (elapsed < DURATION_MS) {
        animationFrameId = requestAnimationFrame(tick);
      } else {
        onDismissRef.current();
      }
    };

    animationFrameId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(animationFrameId);
  }, [visible, count]);

  if (!visible) return null;

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        right: 0,
        bottom: bottomOffset,
        left: 0,
        alignItems: 'center',
      }}
    >
      <View
        className="relative flex-row items-center gap-32 overflow-hidden rounded-full border border-theme-foreground/10 px-2 py-2"
        style={{ backgroundColor: themeColors.surface + 'e0' }}
      >
        <Text className="pl-2 font-sans-medium text-base text-theme-body ml-2">
          <LocalizedText>You deleted </LocalizedText>
          <Text className="font-sans-bold text-theme-foreground">{count}</Text>{' '}
          {count === 1 ? 'card' : 'cards'}
        </Text>

        <Button
          accessibilityLabel={translate('Restore deleted cards')}
          variant="primary"
          icon={undefined}
          text={translate('Restore')}
          onPress={onRestore}
          shadowColor={themeColors.foreground}
          shadowOpacity={0.16}
        />

        <View
          pointerEvents="none"
          className="absolute bottom-0 left-0 h-[2px] bg-theme-foreground"
          style={{ width: `${Math.max(0, Math.min(1, progress)) * 100}%` }}
        />
      </View>
    </View>
  );
}
