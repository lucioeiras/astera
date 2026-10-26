import { useAppTheme } from '@/lib/theme';
import { Tabs } from 'expo-router';
import {
  ArrowCounterClockwiseIcon,
  FolderIcon,
  UserCircleIcon,
  SquaresFourIcon,
} from 'phosphor-react-native';

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
          tabBarInactiveTintColor: themeColors.secondary, // tailwind zinc-500
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
              <SquaresFourIcon
                size={iconSize}
                color={color as string}
                weight={focused ? 'fill' : 'regular'}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="folders"
          options={{
            title: translate('Folders'),
            tabBarIcon: ({ color, focused }) => (
              <FolderIcon
                size={iconSize}
                color={color as string}
                weight={focused ? 'fill' : 'regular'}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="review"
          options={{
            title: translate('Review'),
            tabBarIcon: ({ color, focused }) => (
              <ArrowCounterClockwiseIcon
                size={iconSize}
                color={color as string}
                weight={focused ? 'fill' : 'regular'}
              />
            ),
          }}
        />
        <Tabs.Screen name="add" options={{ href: null }} />
        <Tabs.Screen
          name="profile"
          options={{
            title: translate('Profile'),
            tabBarIcon: ({ color, focused }) => (
              <UserCircleIcon
                size={iconSize}
                color={color as string}
                weight={focused ? 'fill' : 'regular'}
              />
            ),
          }}
        />
      </Tabs>
    </FloatingTabOverlayProvider>
  );
}
