const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

const { transformer, resolver } = config;
config.transformer = {
  ...transformer,
  babelTransformerPath: require.resolve('react-native-svg-transformer/expo'),
};
config.resolver = {
  ...resolver,
  // SQLite's web worker imports a bundled WASM asset.
  assetExts: [...resolver.assetExts.filter((ext) => ext !== 'svg'), 'wasm'],
  sourceExts: [...resolver.sourceExts, 'svg'],
};

module.exports = withNativeWind(config, { input: './src/global.css' });
