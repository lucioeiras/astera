import { useContext } from 'react';
import { Platform, Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { LibraryProvider } from '@/hooks/useLibrary';
import { LibraryAssetContext } from '@/lib/library/assetContext';

jest.mock('@react-native-async-storage/async-storage', () => ({}));
jest.mock('@/lib/library/cache', () => ({}));
jest.mock('@/lib/library/storage', () => ({
  getSavedLibrarySource: jest.fn().mockResolvedValue({ kind: 'local' }),
  getRecentFolders: jest.fn().mockResolvedValue([]),
  resolveFolderSource: (source: unknown) => source,
  getSourceId: () => 'local',
  getLibraryDirectory: () => ({ uri: 'file:///library', exists: false }),
  getFolderDisplayName: () => 'Library',
  loadLibrary: jest.fn().mockResolvedValue({ items: [], issues: [], pendingDownloads: 0 }),
}));
function Consumer() {
  return <Text>{useContext(LibraryAssetContext) ?? 'embedded-images'}</Text>;
}
it.each(['ios', 'web'] as const)(
  'resolves note attachments on %s without using native paths on web',
  async (platform) => {
    const previous = Platform.OS;
    Object.defineProperty(Platform, 'OS', { configurable: true, value: platform });
    try {
      const view = await render(
        <LibraryProvider>
          <Consumer />
        </LibraryProvider>
      );
      expect(
        view.getByText(platform === 'web' ? 'embedded-images' : 'file:///library')
      ).toBeTruthy();
    } finally {
      Object.defineProperty(Platform, 'OS', { configurable: true, value: previous });
    }
  }
);
