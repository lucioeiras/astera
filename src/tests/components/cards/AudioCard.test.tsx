import { fireEvent, render } from '@testing-library/react-native';
import { AudioCard } from '@/components/cards/AudioCard';

jest.mock('lucide-react-native', () => ({
  Play: (props: object) =>
    jest
      .requireActual('react')
      .createElement(jest.requireActual('react-native').View, { ...props, testID: 'play-icon' }),
  Pause: (props: object) =>
    jest.requireActual('react').createElement(jest.requireActual('react-native').View, {
      ...props,
      testID: 'pause-icon',
    }),
}));

let mockPlaying = false;

const mockPlayer = {
  playbackRate: 1,
  setPlaybackRate: jest.fn(),
  play: jest.fn(),
  pause: jest.fn(),
  seekTo: jest.fn(),
};

jest.mock('expo-audio', () => ({
  useAudioPlayer: () => mockPlayer,
  useAudioPlayerStatus: () => ({
    duration: 30,
    currentTime: 0,
    playbackRate: 1,
    playing: mockPlaying,
  }),
}));

describe('AudioCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPlayer.playbackRate = 1;
    mockPlaying = false;
  });

  it('changes speed while paused and uses the selected speed when playback starts', async () => {
    const { getByLabelText } = await render(<AudioCard uri="file:///audio.m4a" showPlaybackRate />);

    await fireEvent.press(getByLabelText('Playback speed 1x'));
    expect(mockPlayer.setPlaybackRate).toHaveBeenLastCalledWith(1.25);
    expect(getByLabelText('Playback speed 1.25x')).toBeTruthy();

    await fireEvent.press(getByLabelText('Play audio'));
    expect(mockPlayer.setPlaybackRate).toHaveBeenLastCalledWith(1.25);
    expect(mockPlayer.play).toHaveBeenCalledTimes(1);
  });

  it('places pinned playback controls below the waveform and centered', async () => {
    const { getByTestId, getByLabelText } = await render(
      <AudioCard uri="file:///audio.m4a" compactWaveform stackedControls />
    );

    expect(getByTestId('audio-stacked-controls').props.className).toContain('items-center');
    expect(getByTestId('audio-playback-button-wrapper').props.className).toContain('items-center');
    expect(getByLabelText('Play audio')).toBeTruthy();
    expect(getByTestId('audio-waveform')).toBeTruthy();
  });
});

it('switches between filled Lucide play and pause controls with accessible actions', async () => {
  mockPlaying = false;
  const view = await render(<AudioCard uri="file:///audio.m4a" />);
  const play = view.getByTestId('play-icon');
  expect(play.props.fill).toBe(play.props.color);
  await fireEvent.press(view.getByLabelText('Play audio'));
  expect(mockPlayer.play).toHaveBeenCalled();

  mockPlaying = true;
  await view.rerender(<AudioCard uri="file:///audio.m4a" title="Playing" />);
  const pause = view.getByTestId('pause-icon');
  expect(pause.props.fill).toBe(pause.props.color);
  expect(view.queryByTestId('play-icon')).toBeNull();
  await fireEvent.press(view.getByLabelText('Pause audio'));
  expect(mockPlayer.pause).toHaveBeenCalled();
});
