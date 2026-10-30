import { useAppTheme } from '@/lib/theme';
import { Tabs } from 'expo-router';
import { CircleUser, Folder, LayoutGrid, RotateCcw } from 'lucide-react-native';

import { ProgressiveBlur } from '@/components/effects/ProgressiveBlur';
import { FloatingTabOverlayProvider } from '@/components/menus/FloatingTabOverlay';
import { translate, useLocalization } from '@/lib/i18n';

const iconSize = 28;

export default function TabLayout() {
  const { colors: themeColors } = useAppTheme();
  useLocalization();
  return (
    <FloatingTabOverlayProvider>
      <Tabs
        initialRouteName="board"
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: themeColors.foreground, // tailwind blue-500
          tabBarInactiveTintColor: themeColors.strongBorder, // tailwind zinc-500
          tabBarBackground: () => <ProgressiveBlur height={160} darkLayerOpacity={0.9} />,
          tabBarStyle: {
            position: 'absolute',
            backgroundColor: 'transparent',
            borderTopWidth: 0,
            elevation: 0,
            paddingTop: 8,
            paddingHorizontal: 24,
          },
          tabBarLabelStyle: {
            fontFamily: 'InstrumentSans_700Bold',
            fontSize: 10,
            marginTop: 4,
          },
        }}
      >
        <Tabs.Screen
          name="board"
          options={{
            title: translate('Board'),
            tabBarIcon: ({ color, focused }) => (
              <LayoutGrid size={iconSize} color={color as string} strokeWidth={focused ? 2 : 1.5} />
            ),
          }}
        />
        <Tabs.Screen
          name="folders"
          options={{
            title: translate('Folders'),
            tabBarIcon: ({ color, focused }) => (
              <Folder size={iconSize} color={color as string} strokeWidth={focused ? 2 : 1.5} />
            ),
          }}
        />
        <Tabs.Screen
          name="review"
          options={{
            title: translate('Review'),
            tabBarIcon: ({ color, focused }) => (
              <RotateCcw size={iconSize} color={color as string} strokeWidth={focused ? 2 : 1.5} />
            ),
          }}
        />
        <Tabs.Screen name="add" options={{ href: null }} />
        <Tabs.Screen
          name="profile"
          options={{
            title: translate('Profile'),
            tabBarIcon: ({ color, focused }) => (
              <CircleUser size={iconSize} color={color as string} strokeWidth={focused ? 2 : 1.5} />
            ),
          }}
        />
      </Tabs>
    </FloatingTabOverlayProvider>
  );
}
