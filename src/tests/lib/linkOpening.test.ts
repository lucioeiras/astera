import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

import {
  LINK_OPENING_STORAGE_KEY,
  openExternalLink,
  readLinkOpeningPreference,
  writeLinkOpeningPreference,
} from '@/lib/linkOpening';

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: { getItem: jest.fn(), setItem: jest.fn(), removeItem: jest.fn() },
}));
jest.mock('expo-linking', () => ({ openURL: jest.fn() }));
jest.mock('expo-web-browser', () => ({ openBrowserAsync: jest.fn() }));

const storage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

beforeEach(() => {
  jest.clearAllMocks();
  storage.getItem.mockResolvedValue(null);
  storage.setItem.mockResolvedValue();
  storage.removeItem.mockResolvedValue();
});

it('defaults to the device browser and clears the stored default preference', async () => {
  expect(await readLinkOpeningPreference()).toBe('device');
  await writeLinkOpeningPreference('device');
  expect(storage.removeItem).toHaveBeenCalledWith(LINK_OPENING_STORAGE_KEY);
});

it('persists and uses the embedded browser when selected', async () => {
  await writeLinkOpeningPreference('embedded');
  expect(storage.setItem).toHaveBeenCalledWith(LINK_OPENING_STORAGE_KEY, 'embedded');
  storage.getItem.mockResolvedValue('embedded');

  await openExternalLink('https://example.com');
  expect(WebBrowser.openBrowserAsync).toHaveBeenCalledWith('https://example.com');
  expect(Linking.openURL).not.toHaveBeenCalled();
});

it('opens links in the device default browser by default', async () => {
  await openExternalLink('https://example.com');
  expect(Linking.openURL).toHaveBeenCalledWith('https://example.com');
  expect(WebBrowser.openBrowserAsync).not.toHaveBeenCalled();
});
