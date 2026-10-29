import { loadEditorFonts } from '@/lib/noteEditor/fonts';

const mockRead = jest.fn(async () => 'AQI=');
const mockDownload = jest.fn(async () => {});
const mockFile = jest.fn();
jest.mock('expo-asset', () => ({
  Asset: {
    fromModule: () => ({
      downloadAsync: mockDownload,
      uri: 'https://unused.invalid/font',
      localUri: 'file:///packaged/font.ttf',
    }),
  },
}));
jest.mock('expo-file-system', () => ({
  File: class {
    constructor(uri: string) {
      mockFile(uri);
    }
    base64 = mockRead;
  },
}));
it('reads packaged native fonts through Expo asset paths and caches the result', async () => {
  const first = loadEditorFonts();
  expect(loadEditorFonts()).toBe(first);
  await expect(first).resolves.toEqual({
    regular: 'data:font/ttf;base64,AQI=',
    medium: 'data:font/ttf;base64,AQI=',
    semibold: 'data:font/ttf;base64,AQI=',
    bold: 'data:font/ttf;base64,AQI=',
    italic: 'data:font/ttf;base64,AQI=',
  });
  expect(mockDownload).toHaveBeenCalledTimes(5);
  expect(mockFile).toHaveBeenCalledTimes(5);
  expect(mockFile).toHaveBeenCalledWith('file:///packaged/font.ttf');
});
