import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
export default function ProLayout() {
  const { t } = useTranslation();
  return <Stack screenOptions={{ headerShown: false }}>
    <Stack.Screen name="index" />
    <Stack.Screen name="account" options={{ headerShown: true, title: t('account.title'), headerBackTitle: t('common.back'), headerStyle: { backgroundColor: '#131318' }, headerTintColor: '#F4F3F7' }} />
  </Stack>;
}
