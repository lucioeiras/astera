export const palettes = {
  dark: {
    canvas: '#09090b',
    surface: '#18181b',
    raised: '#27272a',
    border: '#3f3f46',
    strongBorder: '#52525b',
    muted: '#71717a',
    secondary: '#a1a1aa',
    body: '#d4d4d8',
    heading: '#e4e4e7',
    bright: '#f4f4f5',
    foreground: '#ffffff',
    inverse: '#000000',
    blue: '#60a5fa',
    blueSoft: '#93c5fd',
    green: '#6ee7b7',
    yellow: '#fcd34d',
    red: '#f87171',
    purple: '#c4b5fd',
    pink: '#fb7185',
    amber: '#fbbf24',
  },
  light: {
    canvas: '#ffffff',
    surface: '#ededf0',
    raised: '#d4d4d8',
    border: '#a1a1aa',
    strongBorder: '#71717a',
    muted: '#71717a',
    secondary: '#52525b',
    body: '#3f3f46',
    heading: '#27272a',
    bright: '#18181b',
    foreground: '#09090b',
    inverse: '#ffffff',
    blue: '#2563eb',
    blueSoft: '#1d4ed8',
    green: '#047857',
    yellow: '#a16207',
    red: '#dc2626',
    purple: '#7c3aed',
    pink: '#be123c',
    amber: '#a16207',
  },
} as const;

export type ThemeColors = { [K in keyof typeof palettes.dark]: string };
export type ThemePreference = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

export function parseThemePreference(value: unknown): ThemePreference {
  return value === 'light' || value === 'dark' ? value : 'system';
}

export function resolveTheme(
  preference: ThemePreference,
  system: string | null | undefined
): ResolvedTheme {
  return preference === 'system' ? (system === 'dark' ? 'dark' : 'light') : preference;
}

export function themeVariables(colors: ThemeColors) {
  return Object.fromEntries(
    Object.entries(colors).map(([name, color]) => {
      const hex = color.slice(1);
      const rgb = [0, 2, 4].map((start) => parseInt(hex.slice(start, start + 2), 16));
      return [`--color-${name}`, rgb.join(' ')];
    })
  );
}
