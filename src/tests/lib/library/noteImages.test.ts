import { saveNoteImage } from '@/lib/library/noteImages';
import { Platform } from 'react-native';

const mockCreate = jest.fn();
const mockWrite = jest.fn();
const mockCopy = jest.fn();
const mockDelete = jest.fn();
const mockRead = jest.fn();
const mockDirectory = { create: jest.fn() };
jest.mock('@/lib/library/storage', () => ({
  generateId: () => 'attachment-id',
  getImagesDirectory: () => mockDirectory,
}));
jest.mock('expo-file-system', () => ({
  File: class {
    exists = true;
    create = mockCreate;
    write = mockWrite;
    copy = mockCopy;
    delete = mockDelete;
    arrayBuffer = mockRead;
  },
}));
beforeEach(() => {
  jest.clearAllMocks();
  mockCopy.mockResolvedValue(undefined);
  mockRead.mockResolvedValue(new Uint8Array([1, 2]).buffer);
});

it('stores clipboard bytes as a relative attachment without card metadata', async () => {
  expect(await saveNoteImage({ kind: 'local' }, { uri: 'data:image/png;base64,AQI=' })).toBe(
    'images/attachment-id.png'
  );
  expect(mockWrite).toHaveBeenCalledWith(new Uint8Array([1, 2]));
  expect(mockCopy).not.toHaveBeenCalled();
});
it('copies picker images with their original format', async () => {
  expect(
    await saveNoteImage(
      { kind: 'folder', uri: 'file:///chosen' },
      {
        uri: 'file:///temporary/photo',
        mimeType: 'image/heic',
      }
    )
  ).toBe('images/attachment-id.heic');
  expect(mockCopy).toHaveBeenCalledTimes(1);
  expect(mockWrite).not.toHaveBeenCalled();
});
it('falls back to reading bytes when the platform cannot copy', async () => {
  mockCopy.mockRejectedValueOnce(new Error('copy unavailable'));
  await saveNoteImage({ kind: 'local' }, { uri: 'content://photo', fileName: 'photo.webp' });
  expect(mockWrite).toHaveBeenCalledWith(new Uint8Array([1, 2]));
});
it('rejects invalid clipboard data before writing a file', async () => {
  await expect(
    saveNoteImage({ kind: 'local' }, { uri: 'data:text/html;base64,AQI=' })
  ).rejects.toThrow('Invalid image');
  expect(mockCreate).not.toHaveBeenCalled();
});
it('cleans up an incomplete attachment when writing fails', async () => {
  mockWrite.mockImplementationOnce(() => {
    throw new Error('disk full');
  });
  await expect(
    saveNoteImage({ kind: 'local' }, { uri: 'data:image/png;base64,AQI=' })
  ).rejects.toThrow('disk full');
  expect(mockDelete).toHaveBeenCalledTimes(1);
});

it('embeds clipboard images on web without accessing the native filesystem', async () => {
  const previousOS = Platform.OS;
  Object.defineProperty(Platform, 'OS', { configurable: true, value: 'web' });
  try {
    const uri = 'data:image/png;base64,AQI=';
    expect(await saveNoteImage({ kind: 'local' }, { uri })).toBe(uri);
    expect(mockCreate).not.toHaveBeenCalled();
    expect(mockDirectory.create).not.toHaveBeenCalled();
  } finally {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: previousOS });
  }
});

it('replaces temporary browser image URLs with embedded bytes', async () => {
  const previousOS = Platform.OS;
  const originalFetch = globalThis.fetch;
  Object.defineProperty(Platform, 'OS', { configurable: true, value: 'web' });
  globalThis.fetch = jest.fn().mockResolvedValue({
    ok: true,
    headers: { get: () => 'image/png' },
    arrayBuffer: async () => new Uint8Array([1, 2]).buffer,
  });
  try {
    expect(await saveNoteImage({ kind: 'local' }, { uri: 'blob:temporary' })).toBe(
      'data:image/png;base64,AQI='
    );
    expect(mockCreate).not.toHaveBeenCalled();
  } finally {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: previousOS });
    globalThis.fetch = originalFetch;
  }
});
