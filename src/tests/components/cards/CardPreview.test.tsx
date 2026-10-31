import { fireEvent, render } from '@testing-library/react-native';

import { CardPreview } from '@/components/card/CardPreview';
import type { ImageItem, NoteItem } from '@/lib/library/types';

jest.mock('@/components/card/ImageViewerModal', () => ({
  ImageViewerModal: ({ visible, onClose }: { visible: boolean; onClose: () => void }) => {
    const { Pressable, Text } = jest.requireActual('react-native');
    return visible ? (
      <Pressable accessibilityRole="button" accessibilityLabel="Close image" onPress={onClose}>
        <Text>Image preview</Text>
      </Pressable>
    ) : null;
  },
}));

jest.mock('expo-audio', () => ({
  useAudioPlayer: () => ({ play: jest.fn(), pause: jest.fn(), setPlaybackRate: jest.fn() }),
  useAudioPlayerStatus: () => ({ duration: 0, currentTime: 0, playbackRate: 1, playing: false }),
}));

describe('CardPreview', () => {
  it('renders the note body as Markdown', async () => {
    const item: NoteItem = {
      id: 'note-1',
      version: 1,
      type: 'note',
      text: '# Read later',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };
    const { getByText } = await render(
      <CardPreview
        item={item}
        title=""
        editedText={item.text}
        onTextChange={jest.fn()}
        onTextBlur={jest.fn()}
        onTextFocus={jest.fn()}
        onDismissEditingTags={jest.fn()}
      />
    );

    expect(getByText('Read later')).toBeTruthy();
  });

  it('opens and closes the full image preview when the image is pressed', async () => {
    const item: ImageItem = {
      id: 'image-1',
      version: 1,
      type: 'image',
      image: 'file:///image.jpg',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };
    const { getByRole, getByText, queryByText } = await render(
      <CardPreview
        item={item}
        title=""
        editedText=""
        onTextChange={jest.fn()}
        onTextBlur={jest.fn()}
        onTextFocus={jest.fn()}
        onDismissEditingTags={jest.fn()}
      />
    );

    expect(queryByText('Image preview')).toBeNull();
    fireEvent.press(getByRole('button', { name: 'Open image' }));
    expect(getByText('Image preview')).toBeTruthy();
    fireEvent.press(getByRole('button', { name: 'Close image' }));
    expect(queryByText('Image preview')).toBeNull();
  });

  it('does not add the image preview action to other card types', async () => {
    const item: NoteItem = {
      id: 'note-2',
      version: 1,
      type: 'note',
      text: 'A note',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };
    const { queryByRole } = await render(
      <CardPreview
        item={item}
        title=""
        editedText={item.text}
        onTextChange={jest.fn()}
        onTextBlur={jest.fn()}
        onTextFocus={jest.fn()}
        onDismissEditingTags={jest.fn()}
      />
    );

    expect(queryByRole('button', { name: 'Open image' })).toBeNull();
  });
});
