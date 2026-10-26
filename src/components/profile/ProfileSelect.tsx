import { useAppTheme } from '@/lib/theme';
import { CaretDownIcon, CaretUpIcon, CheckIcon } from 'phosphor-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, View, Text } from 'react-native';
import { translate, useLocalization } from '@/lib/i18n';

type Props = {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onSelect: (value: string) => void;
};
export function ProfileSelect({ label, value, options, onSelect }: Props) {
  const { colors: themeColors } = useAppTheme();
  useLocalization();
  const [open, setOpen] = useState(false);
  const Caret = open ? CaretUpIcon : CaretDownIcon;
  return (
    <View className="relative shrink-0" style={{ zIndex: open ? 20 : 0 }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={translate('%{label}: %{value}', {
          label: translate(label),
          value: translate(options.find((o) => o.value === value)?.label ?? value),
        })}
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen((current) => !current)}
        onAccessibilityEscape={() => setOpen(false)}
        hitSlop={{ top: 5, bottom: 5 }}
        className="flex-row items-center gap-2 rounded-full border border-theme-border px-4 py-2"
      >
        <Text className="font-sans-medium text-sm text-theme-body">
          {translate(options.find((o) => o.value === value)?.label ?? value)}
        </Text>
        <Caret size={16} color={themeColors.secondary} />
      </Pressable>
      {open && (
        <View
          testID={`${label.toLowerCase()}-dropdown`}
          accessibilityRole="menu"
          onAccessibilityEscape={() => setOpen(false)}
          className="absolute left-0 overflow-hidden rounded-xl border border-theme-border bg-theme-surface"
          style={{
            top: '100%',
            marginTop: 8,
            width: 144,
            zIndex: 20,
            elevation: 8,
            shadowColor: '#000000',
            shadowOpacity: 0.3,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 4 },
          }}
        >
          <ScrollView
            style={{ maxHeight: 240 }}
            nestedScrollEnabled
            keyboardShouldPersistTaps="always"
          >
            {options.map((option) => (
              <Pressable
                key={option.value}
                accessibilityRole="menuitem"
                accessibilityLabel={translate(option.label)}
                accessibilityState={{ selected: option.value === value }}
                className={`min-h-12 flex-row items-center justify-between gap-3 px-4 py-3 ${option.value === value ? 'bg-theme-raised' : ''}`}
                onPress={() => {
                  onSelect(option.value);
                  setOpen(false);
                }}
              >
                <Text className="font-sans-medium text-sm text-theme-heading">
                  {translate(option.label)}
                </Text>
                {option.value === value && <CheckIcon size={16} color={themeColors.foreground} />}
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}
