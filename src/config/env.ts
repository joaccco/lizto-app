import Constants from 'expo-constants';

export const getApiUrl = (): string => {
  const configured: unknown = Constants.expoConfig?.extra?.apiUrl;
  if (typeof configured !== 'string' || !configured.trim()) {
    throw new Error('CONFIG_ERROR: EXPO_PUBLIC_API_URL no está configurada.');
  }
  let url: URL;
  try { url = new URL(configured); }
  catch { throw new Error('CONFIG_ERROR: EXPO_PUBLIC_API_URL es inválida.'); }
  if (!['https:', 'http:'].includes(url.protocol) || !url.pathname.match(/\/api\/v1\/?$/) || url.search || url.hash || url.username || url.password) {
    throw new Error('CONFIG_ERROR: La base debe terminar en /api/v1.');
  }
  if (__DEV__ && ['localhost', '127.0.0.1'].includes(url.hostname)) {
    const hostUri = Constants.expoConfig?.hostUri ?? Constants.expoGoConfig?.debuggerHost;
    if (hostUri) url.hostname = new URL(`http://${hostUri}`).hostname;
  }
  return url.toString().replace(/\/$/, '');
};
