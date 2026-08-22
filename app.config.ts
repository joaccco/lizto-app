import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Lizto',
  slug: 'lizto-mobile',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  scheme: 'lizto',
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.lizto.app',
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#1E293B',
    },
    package: 'com.lizto.app',
  },
  web: {
    bundler: 'metro',
    output: 'static',
    favicon: './assets/favicon.png',
  },
  plugins: ['expo-router', 'expo-secure-store'],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    apiUrl: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api/v1',
  },
});
