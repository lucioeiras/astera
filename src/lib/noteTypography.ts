export const NOTE_BODY_TYPOGRAPHY = {
  fontFamily: 'InstrumentSans_400Regular',
  fontSize: 18,
  lineHeight: 32,
} as const;

export const NOTE_HEADING_TYPOGRAPHY = [
  { fontFamily: 'InstrumentSans_700Bold', fontSize: 34, lineHeight: 40, weight: 700 },
  { fontFamily: 'InstrumentSans_700Bold', fontSize: 29, lineHeight: 35, weight: 700 },
  { fontFamily: 'InstrumentSans_600SemiBold', fontSize: 25, lineHeight: 30, weight: 600 },
  { fontFamily: 'InstrumentSans_600SemiBold', fontSize: 22, lineHeight: 27, weight: 600 },
  { fontFamily: 'InstrumentSans_500Medium', fontSize: 20, lineHeight: 24, weight: 500 },
  { fontFamily: 'InstrumentSans_500Medium', fontSize: 18, lineHeight: 22, weight: 500 },
] as const;

// CSS variables keep the DOM editor's metrics in sync with the native renderer.
export const NOTE_EDITOR_TYPOGRAPHY = {
  '--note-body-size': `${NOTE_BODY_TYPOGRAPHY.fontSize}px`,
  '--note-body-height': `${NOTE_BODY_TYPOGRAPHY.lineHeight}px`,
  ...Object.fromEntries(
    NOTE_HEADING_TYPOGRAPHY.flatMap((heading, index) => [
      [`--note-h${index + 1}-size`, `${heading.fontSize}px`],
      [`--note-h${index + 1}-height`, `${heading.lineHeight}px`],
      [`--note-h${index + 1}-weight`, heading.weight],
    ])
  ),
};
