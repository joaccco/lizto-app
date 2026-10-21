import { ExpoConfig, ConfigContext } from 'expo/config';
import { z } from 'zod';

// Expo evaluates this file in Node without compiling imported TypeScript modules.
const googleClientId = z.string().regex(/^\d+-[a-z0-9]+\.apps\.googleusercontent\.com$/);
const googleOAuthConfigSchema = z.object({ iosClientId: googleClientId, webClientId: googleClientId })
  .refine(value => value.iosClientId.split('-')[0] === value.webClientId.split('-')[0], {
    message: 'Google OAuth clients must belong to the same project.',
  });
const facebookOAuthBuildConfigSchema = z.object({ appId: z.string().regex(/^\d+$/), clientToken: z.string().min(1) });

const google = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID
  ? googleOAuthConfigSchema.parse({
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  }) : undefined;
const facebook = process.env.EXPO_PUBLIC_FACEBOOK_APP_ID || process.env.EXPO_PUBLIC_FACEBOOK_CLIENT_TOKEN
  ? facebookOAuthBuildConfigSchema.parse({
    appId: process.env.EXPO_PUBLIC_FACEBOOK_APP_ID,
    clientToken: process.env.EXPO_PUBLIC_FACEBOOK_CLIENT_TOKEN,
  }) : undefined;
const oauthPlugins: NonNullable<ExpoConfig['plugins']> = [];
if (google) oauthPlugins.push(['react-native-nitro-google-signin', {
  iosUrlScheme: google.iosClientId.split('.').reverse().join('.'),
}], './plugins/withGoogleOAuthCallback');
if (facebook) oauthPlugins.push(['react-native-fbsdk-next', {
  appID: facebook.appId,
  clientToken: facebook.clientToken,
  displayName: 'Lizto',
  scheme: `fb${facebook.appId}`,
  advertiserIDCollectionEnabled: false,
  autoLogAppEventsEnabled: false,
  isAutoInitEnabled: false,
  iosUserTrackingPermission: false,
}]);

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
  plugins: [
    'expo-router',
    'expo-secure-store',
    'expo-font',
    'expo-splash-screen',
    ['expo-build-properties', { ios: { enableSceneSupport: true } }],
    ...oauthPlugins,
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    apiUrl: process.env.EXPO_PUBLIC_API_URL,
    oauth: { google, facebook: facebook ? { appId: facebook.appId } : undefined },
    // eas init no puede escribir en un config dinamico: va a mano.
    eas: {
      projectId: '8db99c30-f415-49c2-bb9a-9c259dac63ae',
    },
  },
});
