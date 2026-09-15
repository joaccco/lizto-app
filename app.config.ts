import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Lizto',
  slug: 'lizto-mobile',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'dark',
  scheme: 'lizto',
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.lizto.app',
    userInterfaceStyle: 'dark',
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#08080A',
    },
    package: 'com.lizto.app',
    userInterfaceStyle: 'dark',
  },
  plugins: ['expo-router', 'expo-secure-store', 'expo-font', 'expo-splash-screen'],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    apiUrl: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api/v1',
    // eas init no puede escribir en un config dinamico: va a mano.
    eas: {
      projectId: '8db99c30-f415-49c2-bb9a-9c259dac63ae',
    },
  },
});
