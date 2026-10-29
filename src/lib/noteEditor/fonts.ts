import { Asset } from 'expo-asset';
import { File } from 'expo-file-system';

export type EditorFontSources = {
  regular: string;
  medium: string;
  semibold: string;
  bold: string;
  italic: string;
};
let fontData: Promise<EditorFontSources> | undefined;

/** A DOM document lives in www.bundle, while native assets can live in a
 * different directory (including after an OTA update). Read packaged fonts
 * through Expo's asset resolver rather than assuming a relative file URL. */
export function loadEditorFonts(): Promise<EditorFontSources> {
  if (!fontData) {
    fontData = (async () => {
      const modules = {
        regular: require('@expo-google-fonts/instrument-sans/400Regular/InstrumentSans_400Regular.ttf'),
        medium: require('@expo-google-fonts/instrument-sans/500Medium/InstrumentSans_500Medium.ttf'),
        semibold: require('@expo-google-fonts/instrument-sans/600SemiBold/InstrumentSans_600SemiBold.ttf'),
        bold: require('@expo-google-fonts/instrument-sans/700Bold/InstrumentSans_700Bold.ttf'),
        italic: require('@expo-google-fonts/instrument-sans/400Regular_Italic/InstrumentSans_400Regular_Italic.ttf'),
      };
      const sources: Record<string, string> = {};
      await Promise.all(
        Object.entries(modules).map(async ([name, module]) => {
          const asset = Asset.fromModule(module);
          await asset.downloadAsync();
          sources[name] =
            `data:font/ttf;base64,${await new File(asset.localUri ?? asset.uri).base64()}`;
        })
      );
      return sources as EditorFontSources;
    })();
    void fontData.catch(() => {
      fontData = undefined;
    });
  }
  return fontData;
}
