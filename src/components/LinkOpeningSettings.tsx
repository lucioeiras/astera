import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ExternalLink } from 'lucide-react-native';

import { useAppTheme } from '@/lib/theme';
import { useLocalization } from '@/lib/i18n';
import {
  readLinkOpeningPreference,
  writeLinkOpeningPreference,
  type LinkOpeningPreference,
} from '@/lib/linkOpening';

const options: { value: LinkOpeningPreference; label: string }[] = [
  { value: 'device', label: 'Default browser' },
  { value: 'embedded', label: 'In-app browser' },
];

export function LinkOpeningSettings() {
  const { colors } = useAppTheme();
  const { t } = useLocalization();
  const [preference, setPreference] = useState<LinkOpeningPreference>('device');

  useEffect(() => {
    let mounted = true;
    void readLinkOpeningPreference().then((value) => {
      if (mounted) setPreference(value);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const choose = (value: LinkOpeningPreference) => {
    setPreference(value);
    void writeLinkOpeningPreference(value);
  };

  return (
    <View className="gap-4 border-b border-theme-raised px-8 py-6">
      <View className="flex-row items-center gap-2">
        <ExternalLink size={16} color={colors.heading} />
        <Text className="font-sans-semibold text-sm uppercase tracking-wider text-theme-heading">
          {t('Links')}
        </Text>
      </View>
      <Text className="font-sans text-base leading-relaxed text-theme-secondary">
        {t('Choose where links open.')}
      </Text>
      <View
        accessibilityRole="radiogroup"
        accessibilityLabel={t('Select link browser')}
        className="gap-1"
      >
        {options.map(({ value, label }) => (
          <Pressable
            key={value}
            onPress={() => choose(value)}
            accessibilityRole="radio"
            accessibilityLabel={t(label)}
            accessibilityState={{ checked: preference === value }}
            testID={`link-opening-${value}`}
            className="min-h-12 flex-row items-center gap-3 py-2 active:opacity-70"
          >
            <View
              className={`h-5 w-5 items-center justify-center rounded-full border ${preference === value ? 'border-theme-blue' : 'border-theme-strongBorder'}`}
            >
              {preference === value && <View className="h-2.5 w-2.5 rounded-full bg-theme-blue" />}
            </View>
            <Text className="font-sans text-base text-theme-foreground">{t(label)}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
