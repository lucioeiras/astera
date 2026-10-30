/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './app/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        theme: Object.fromEntries(
          [
            'canvas',
            'surface',
            'raised',
            'border',
            'strongBorder',
            'muted',
            'secondary',
            'body',
            'heading',
            'bright',
            'foreground',
            'inverse',
            'blue',
            'blueSoft',
            'green',
            'yellow',
            'statusWant',
            'statusInProgress',
            'statusCompleted',
            'statusAbandoned',
            'red',
            'purple',
            'pink',
            'amber',
          ].map((name) => [name, `rgb(var(--color-${name}) / <alpha-value>)`])
        ),
      },
      fontFamily: {
        sans: ['InstrumentSans_400Regular', 'sans-serif'],
        'sans-medium': ['InstrumentSans_500Medium', 'sans-serif'],
        'sans-semibold': ['InstrumentSans_600SemiBold', 'sans-serif'],
        'sans-bold': ['InstrumentSans_700Bold', 'sans-serif'],
        'sans-italic': ['InstrumentSans_400Regular_Italic', 'sans-serif'],
        'serif-italic': ['InstrumentSerif_400Regular_Italic', 'serif'],
      },
    },
  },
  plugins: [],
};
