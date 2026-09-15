import Constants from 'expo-constants';

const DEV_API_PORT = 8000;
const API_PATH = '/api/v1';

/**
 * Resuelve la URL base de la API.
 *
 * En desarrollo, un teléfono físico no puede resolver "localhost" a la máquina
 * que corre el servidor: localhost es el propio teléfono. Cuando la URL
 * configurada apunta a localhost, derivamos el host real desde el servidor de
 * Expo, que ya conoce la IP de la máquina de desarrollo.
 *
 * En producción se usa siempre el valor configurado, sin excepción.
 */
export const getApiUrl = (): string => {
  const configured = Constants.expoConfig?.extra?.apiUrl as string | undefined;

  if (__DEV__) {
    const pointsToLocalhost =
      !configured || /localhost|127\.0\.0\.1/.test(configured);

    if (pointsToLocalhost) {
      const hostUri =
        Constants.expoConfig?.hostUri ?? Constants.expoGoConfig?.debuggerHost;
      const host = hostUri?.split(':')[0];

      if (host) {
        return `http://${host}:${DEV_API_PORT}${API_PATH}`;
      }
    }
  }

  if (!configured) {
    throw new Error(
      'CONFIG_ERROR: EXPO_PUBLIC_API_URL no está configurada en app.config.ts'
    );
  }

  return configured;
};
