import { useState } from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppThemeProvider, THEME_STORAGE_KEY, useAppTheme } from '@/lib/theme';
import { palettes, parseThemePreference, resolveTheme, themeVariables } from '@/lib/theme/palette';
import { AppearanceSettings } from '@/components/AppearanceSettings';
import { Button } from '@/components/Button';
import { MarkdownNote } from '@/components/card/MarkdownNote';
import { NewFolderModal } from '@/components/modals/NewFolderModal';
import { ActivityCalendar } from '@/components/profile/ActivityCalendar';
import { setActiveLanguage } from '@/lib/i18n/locale';

let mockScheme: string | null = 'light';
jest.mock('react-native/Libraries/Utilities/useColorScheme', () => ({
  __esModule: true,
  default: () => mockScheme,
}));
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: { getItem: jest.fn(), setItem: jest.fn(), removeItem: jest.fn() },
}));
jest.mock('expo-system-ui', () => ({
  setBackgroundColorAsync: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

const storage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

function Probe() {
  const { theme, colors } = useAppTheme();
  return (
    <Text testID="theme" style={{ color: colors.foreground, backgroundColor: colors.canvas }}>
      {theme}
    </Text>
  );
}
function Fixture() {
  return (
    <AppThemeProvider>
      <AppearanceSettings />
      <Probe />
    </AppThemeProvider>
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  mockScheme = 'light';
  setActiveLanguage('en');
  storage.getItem.mockResolvedValue(null);
  storage.setItem.mockResolvedValue();
  storage.removeItem.mockResolvedValue();
  jest.spyOn(Appearance, 'setColorScheme').mockImplementation(() => {});
});

function luminance(hex: string) {
  const channels = [1, 3, 5].map((start) => {
    const value = parseInt(hex.slice(start, start + 2), 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

function contrastWithWhite(color: string) {
  return 1.05 / (luminance(color) + 0.05);
}

describe('theme resolution', () => {
  it('uses a white board canvas with visibly gray card surfaces and stronger separators', () => {
    expect(palettes.light.canvas).toBe('#ffffff');
    expect(contrastWithWhite(palettes.light.surface)).toBeGreaterThan(1.15);
    expect(contrastWithWhite(palettes.light.raised)).toBeGreaterThan(1.45);
    expect(contrastWithWhite(palettes.light.border)).toBeGreaterThan(2.5);
    expect(contrastWithWhite(palettes.light.strongBorder)).toBeGreaterThan(4.5);
  });

  it.each([null, undefined, '', 'invalid', {}, 42])(
    'uses System for invalid preference %p',
    (input) => {
      expect(parseThemePreference(input)).toBe('system');
    }
  );
  it('resolves system changes and respects manual choices', () => {
    expect(resolveTheme('system', 'dark')).toBe('dark');
    expect(resolveTheme('system', null)).toBe('light');
    expect(resolveTheme('system', 'unspecified')).toBe('light');
    expect(resolveTheme('light', 'dark')).toBe('light');
    expect(resolveTheme('dark', 'light')).toBe('dark');
  });
  it('provides RGB variables for NativeWind opacity modifiers', () => {
    expect(themeVariables(palettes.light)['--color-canvas']).toBe('255 255 255');
    expect(themeVariables(palettes.dark)['--color-foreground']).toBe('255 255 255');
  });
});

describe('appearance preference', () => {
  it('keeps the UI hidden until the preference has loaded', async () => {
    let complete!: (value: string | null) => void;
    storage.getItem.mockReturnValue(
      new Promise((resolve) => {
        complete = resolve;
      })
    );
    const view = await render(<Fixture />);
    expect(view.queryByTestId('theme')).toBeNull();
    await act(async () => {
      complete('dark');
    });
    expect(view.getByTestId('theme').props.children).toBe('dark');
    expect(storage.getItem).toHaveBeenCalledWith(THEME_STORAGE_KEY);
  });

  it.each(['invalid', null])('follows the system with preference %p', async (stored) => {
    storage.getItem.mockResolvedValue(stored);
    const view = await render(<Fixture />);
    await waitFor(() => expect(view.getByTestId('theme').props.children).toBe('light'));
    mockScheme = 'dark';
    await view.rerender(<Fixture />);
    expect(view.getByTestId('theme').props.children).toBe('dark');
    expect(Appearance.setColorScheme).toHaveBeenCalledWith('unspecified');
  });

  it('uses System if storage cannot be read', async () => {
    storage.getItem.mockRejectedValue(new Error('unavailable'));
    const view = await render(<Fixture />);
    await waitFor(() =>
      expect(view.getByTestId('appearance-system').props.accessibilityState.checked).toBe(true)
    );
    expect(view.getByTestId('theme').props.children).toBe('light');
  });

  it('applies and persists a manual selection, restores it, and returns to System', async () => {
    const view = await render(<Fixture />);
    await waitFor(() => expect(view.getByTestId('theme')).toBeTruthy());
    await fireEvent.press(view.getByRole('radio', { name: 'Dark' }));
    expect(view.getByRole('radio', { name: 'Dark' }).props.accessibilityState.checked).toBe(true);
    expect(view.getByTestId('theme').props.children).toBe('dark');
    await waitFor(() => expect(storage.setItem).toHaveBeenCalledWith(THEME_STORAGE_KEY, 'dark'));
    expect(Appearance.setColorScheme).toHaveBeenCalledWith('dark');
    await view.unmount();

    storage.getItem.mockResolvedValue('dark');
    const reopened = await render(<Fixture />);
    await waitFor(() => expect(reopened.getByTestId('theme').props.children).toBe('dark'));
    mockScheme = 'light';
    await reopened.rerender(<Fixture />);
    expect(reopened.getByTestId('theme').props.children).toBe('dark');
    await fireEvent.press(reopened.getByRole('radio', { name: 'System' }));
    expect(reopened.getByTestId('theme').props.children).toBe('light');
    await waitFor(() => expect(storage.removeItem).toHaveBeenCalledWith(THEME_STORAGE_KEY));
  });

  it('keeps the selected appearance when a write fails', async () => {
    storage.setItem.mockRejectedValue(new Error('full'));
    const view = await render(<Fixture />);
    await waitFor(() => expect(view.getByTestId('theme')).toBeTruthy());
    await fireEvent.press(view.getByRole('radio', { name: 'Dark' }));
    await waitFor(() => expect(storage.setItem).toHaveBeenCalled());
    expect(view.getByTestId('theme').props.children).toBe('dark');
    await fireEvent.press(view.getByRole('radio', { name: 'Light' }));
    expect(view.getByTestId('theme').props.children).toBe('light');
  });

  it('serializes writes so an earlier request cannot overwrite a newer preference', async () => {
    let finish!: () => void;
    storage.setItem.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        })
    );
    const view = await render(<Fixture />);
    await waitFor(() => expect(view.getByTestId('theme')).toBeTruthy());
    await fireEvent.press(view.getByRole('radio', { name: 'Dark' }));
    await fireEvent.press(view.getByRole('radio', { name: 'Light' }));
    expect(storage.setItem).toHaveBeenCalledTimes(1);
    expect(view.getByTestId('theme').props.children).toBe('light');
    await act(async () => {
      finish();
    });
    expect(storage.setItem).toHaveBeenLastCalledWith(THEME_STORAGE_KEY, 'light');
  });

  it('translates the appearance choices to Portuguese', async () => {
    setActiveLanguage('pt');
    const view = await render(<Fixture />);
    await waitFor(() =>
      expect(view.getByLabelText('Selecionar aparência do aplicativo')).toBeTruthy()
    );
    expect(view.getByRole('radio', { name: 'Claro' })).toBeTruthy();
    expect(view.getByRole('radio', { name: 'Escuro' })).toBeTruthy();
    expect(view.getByRole('radio', { name: 'Sistema' })).toBeTruthy();
    setActiveLanguage('en');
  });
});

function ComponentFixture() {
  const [visible, setVisible] = useState(true);
  return (
    <View>
      <AppearanceSettings />
      <Button
        text="Primary action"
        accessibilityLabel="Primary action"
        variant="primary"
        onPress={() => {}}
      />
      <ActivityCalendar
        month={new Date(2026, 0, 1)}
        byDay={{ '2026-01-01': 10 }}
        onChangeMonth={() => {}}
        onPressDate={() => {}}
      />
      <MarkdownNote markdown={'# Heading\n\nBody'} />
      <NewFolderModal
        visible={visible}
        onClose={() => setVisible(false)}
        onCreate={async () => true}
      />
      <Pressable onPress={() => setVisible(true)}>
        <Text>Open modal</Text>
      </Pressable>
    </View>
  );
}

it('updates buttons, markdown, modal surfaces, and form placeholders without remounting', async () => {
  const view = await render(
    <AppThemeProvider>
      <ComponentFixture />
    </AppThemeProvider>
  );
  await waitFor(() => expect(view.getByLabelText('Folder name')).toBeTruthy());
  expect(view.getByLabelText('Folder name').props.placeholderTextColor).toBe(palettes.light.muted);
  expect(
    StyleSheet.flatten(view.getByTestId('new-folder-modal-surface').props.style).backgroundColor
  ).toBe(palettes.light.canvas);
  // Close the native modal to interact with the underlying settings.
  await fireEvent.press(view.getByLabelText('Cancel'));
  expect(
    StyleSheet.flatten(view.getByRole('button', { name: 'Primary action' }).props.style)
      .backgroundColor
  ).toBe(palettes.light.foreground);
  expect(view.getByTestId('markdown-heading-1').props.style.color).toBe(palettes.light.foreground);
  expect(view.getByTestId('activity-day-count-2026-01-01').props.className).toContain(
    'text-theme-foreground'
  );
  await fireEvent.press(view.getByRole('radio', { name: 'Dark' }));
  expect(
    StyleSheet.flatten(view.getByRole('button', { name: 'Primary action' }).props.style)
      .backgroundColor
  ).toBe(palettes.dark.foreground);
  expect(view.getByTestId('markdown-heading-1').props.style.color).toBe(palettes.dark.foreground);
  await fireEvent.press(view.getByText('Open modal'));
  expect(view.getByLabelText('Folder name').props.placeholderTextColor).toBe(palettes.dark.muted);
  expect(
    StyleSheet.flatten(view.getByTestId('new-folder-modal-surface').props.style).backgroundColor
  ).toBe(palettes.dark.canvas);
});

it('supports web without the native-only Appearance override API', async () => {
  const platform = jest.replaceProperty(Platform, 'OS', 'web');
  try {
    const view = await render(<Fixture />);
    await waitFor(() => expect(view.getByTestId('theme')).toBeTruthy());
    await fireEvent.press(view.getByRole('radio', { name: 'Dark' }));
    expect(view.getByTestId('theme').props.children).toBe('dark');
    expect(Appearance.setColorScheme).not.toHaveBeenCalled();
  } finally {
    platform.restore();
  }
});
