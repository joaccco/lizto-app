import Constants from 'expo-constants';

export const getApiUrl = (): string => {
  const apiUrl = Constants.expoConfig?.extra?.apiUrl;
  if (!apiUrl) {
    throw new Error('CONFIG_ERROR: EXPO_PUBLIC_API_URL no está configurada en app.config.ts');
  }
  return apiUrl;
};
