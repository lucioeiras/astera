import colors from 'tailwindcss/colors';

export const palettes = {
  dark: {
    canvas: colors.zinc[950],
    surface: colors.zinc[900],
    raised: colors.zinc[800],
    border: colors.zinc[700],
    strongBorder: colors.zinc[600],
    muted: colors.zinc[500],
    secondary: colors.zinc[400],
    body: colors.zinc[300],
    heading: colors.zinc[200],
    bright: colors.zinc[100],
    foreground: colors.white,
    inverse: colors.black,
    blue: colors.blue[400],
    blueSoft: colors.blue[300],
    green: colors.emerald[300],
    yellow: colors.amber[300],
    statusWant: colors.blue[300],
    statusInProgress: colors.amber[300],
    statusCompleted: colors.emerald[300],
    statusAbandoned: colors.zinc[400],
    red: colors.red[400],
    purple: colors.violet[300],
    pink: colors.rose[400],
    amber: colors.amber[400],
  },
  light: {
    canvas: colors.white,
    surface: colors.zinc[100],
    raised: colors.zinc[300],
    border: colors.zinc[400],
    strongBorder: colors.zinc[500],
    muted: colors.zinc[500],
    secondary: colors.zinc[600],
    body: colors.zinc[700],
    heading: colors.zinc[800],
    bright: colors.zinc[900],
    foreground: colors.zinc[950],
    inverse: colors.white,
    blue: colors.blue[600],
    blueSoft: colors.blue[500],
    green: colors.emerald[700],
    yellow: colors.amber[700],
    statusWant: colors.blue[500],
    statusInProgress: colors.amber[500],
    statusCompleted: colors.emerald[500],
    statusAbandoned: colors.zinc[500],
    red: colors.red[600],
    purple: colors.violet[600],
    pink: colors.rose[700],
    amber: colors.amber[700],
  },
} as const;

export type ThemeColors = { [K in keyof typeof palettes.dark]: string };
export type ThemePreference = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

export function colorWithAlpha(color: string, alpha: string): string {
  const rawHex = color.slice(1);
  const hex =
    rawHex.length === 3 ? [...rawHex].map((channel) => channel + channel).join('') : rawHex;
  return `#${hex}${alpha}`;
}

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
      const hex = colorWithAlpha(color, '').slice(1);
      const rgb = [0, 2, 4].map((start) => parseInt(hex.slice(start, start + 2), 16));
      return [`--color-${name}`, rgb.join(' ')];
    })
  );
}
