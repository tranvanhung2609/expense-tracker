module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // react-native-reanimated/plugin must be listed last in plugins for worklet transformations
      'react-native-reanimated/plugin',
    ],
  };
};
