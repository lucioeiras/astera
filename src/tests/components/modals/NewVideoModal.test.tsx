import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { NewVideoModal } from '@/components/modals/NewVideoModal';

const mockAddVideo = jest.fn();
const mockPlayer = {
  status: 'readyToPlay',
  playing: false,
  videoTrack: { size: { width: 1920, height: 1080 } },
  generateThumbnailsAsync: jest.fn().mockResolvedValue([{ width: 1920, height: 1080 }]),
  addListener: jest.fn(() => ({ remove: jest.fn() })),
  play: jest.fn(),
  pause: jest.fn(),
};

jest.mock('expo-video', () => ({ useVideoPlayer: () => mockPlayer }));
jest.mock('expo-image', () => ({ Image: () => null }));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));
jest.mock('@/hooks/useLibrary', () => ({
  useLibrary: () => ({ addVideo: mockAddVideo, getTags: () => [] }),
}));
jest.mock('@/lib/tags/autoTags', () => ({
  generateAutoTagsAsync: jest.fn().mockResolvedValue([]),
  isGibberishOrMachineId: () => false,
}));
describe('NewVideoModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAddVideo.mockResolvedValue({ id: 'video-1', type: 'video' });
  });

  it('lets the user edit title, tags and note before saving', async () => {
    const asset = { uri: 'file:///clip.mp4', fileName: 'clip.mp4', fileSize: 1234 };
    const onClose = jest.fn();
    const { getByPlaceholderText, getByTestId, getByLabelText } = await render(
      <NewVideoModal visible videoAsset={asset} onClose={onClose} />
    );

    const title = getByPlaceholderText('Add a title to this video');
    expect(title.props.value).toBe('clip');
    await waitFor(() => expect(mockPlayer.generateThumbnailsAsync).toHaveBeenCalledWith(0));
    const previewStyle = getByTestId('video-asset-preview').props.style;
    expect(previewStyle.width / previewStyle.height).toBeCloseTo(16 / 9);
    await fireEvent.changeText(title, '  Weekend trip  ');
    await fireEvent.changeText(getByPlaceholderText('Add tags here...'), 'travel ');
    await fireEvent.changeText(
      getByPlaceholderText('Add a text note to this video...'),
      '  Keep this memory  '
    );
    await fireEvent.press(getByLabelText('Save video'));

    await waitFor(() =>
      expect(mockAddVideo).toHaveBeenCalledWith(asset, {
        title: 'Weekend trip',
        note: 'Keep this memory',
        tags: ['travel'],
        autoTags: undefined,
      })
    );
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not save if the user cancels', async () => {
    const onClose = jest.fn();
    const { getByLabelText } = await render(
      <NewVideoModal visible videoAsset={{ uri: 'file:///clip.mp4' }} onClose={onClose} />
    );

    await fireEvent.press(getByLabelText('Close'));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(mockAddVideo).not.toHaveBeenCalled();
  });
});
