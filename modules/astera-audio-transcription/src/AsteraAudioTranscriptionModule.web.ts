import { NativeModule, registerWebModule } from 'expo';

class AsteraAudioTranscriptionModule extends NativeModule {
  async convertToWav(): Promise<string> {
    throw new Error('Audio transcription is only available on iOS and Android.');
  }
}

export default registerWebModule(AsteraAudioTranscriptionModule, 'AsteraAudioTranscription');
