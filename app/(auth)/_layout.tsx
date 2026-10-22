import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

export default function AuthLayout() {
  const { t } = useTranslation();
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" options={{ title: t('auth.loginButton') }} />
      <Stack.Screen name="recover-password" options={{ title: t('recovery.title') }} />
    </Stack>
  );
}
