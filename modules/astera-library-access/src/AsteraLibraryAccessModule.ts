import { NativeModule, requireNativeModule } from 'expo';

declare class AsteraLibraryAccessModule extends NativeModule {
  bookmarkFolder(uri: string): string | null;
  resolveBookmark(base64: string): string | null;
  extractEntitiesAndTags(text: string): string[];
}

export default requireNativeModule<AsteraLibraryAccessModule>('AsteraLibraryAccess');
