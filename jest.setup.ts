jest.mock('nativewind', () => ({
  cssInterop: jest.fn(),
  vars: (values: Record<string, string>) => values,
}));

jest.mock('expo-image', () => ({
  Image: require('react-native').Image,
}));

jest.mock('expo-video', () => ({
  useVideoPlayer: jest.fn(() => ({})),
  VideoView: () => null,
}));

jest.mock('expo-audio', () => ({
  useAudioPlayer: jest.fn(() => ({
    playbackRate: 1,
    play: jest.fn(),
    pause: jest.fn(),
    seekTo: jest.fn(),
    setPlaybackRate: jest.fn(),
  })),
  useAudioPlayerStatus: jest.fn(() => ({
    duration: 0,
    currentTime: 0,
    playbackRate: 1,
    playing: false,
  })),
}));
