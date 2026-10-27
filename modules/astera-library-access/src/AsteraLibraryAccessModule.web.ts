import { registerWebModule, NativeModule } from 'expo';

class AsteraLibraryAccessModule extends NativeModule<{}> {}

export default registerWebModule(AsteraLibraryAccessModule, 'AsteraLibraryAccessModule');
