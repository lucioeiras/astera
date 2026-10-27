import { NativeModule, requireNativeModule } from 'expo';

declare class AsteraAudioTranscriptionModule extends NativeModule {
  convertToWav(inputPath: string, outputPath: string): Promise<string>;
}

export default requireNativeModule<AsteraAudioTranscriptionModule>('AsteraAudioTranscription');
