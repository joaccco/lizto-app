import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/ui';
export default function ClienteLayout() {
  const { t } = useTranslation();
  return <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: '#A8FF35', tabBarInactiveTintColor: '#9C99A8', tabBarStyle: { backgroundColor: '#131318', borderTopColor: '#24222C' }, tabBarLabelStyle: { fontFamily: 'Manrope_600SemiBold', fontSize: 11 } }}>
    <Tabs.Screen name="index" options={{ title: t('navigation.home'), tabBarIcon: ({ color }) => <Text style={{ color }} variant="h2">⌂</Text> }} />
    <Tabs.Screen name="catalog" options={{ title: t('navigation.catalog'), tabBarIcon: ({ color }) => <Text style={{ color }} variant="h2">▦</Text> }} />
    <Tabs.Screen name="requests" options={{ title: t('navigation.requests'), tabBarIcon: ({ color }) => <Text style={{ color }} variant="h2">≡</Text> }} />
    <Tabs.Screen name="account" options={{ title: t('navigation.account'), tabBarIcon: ({ color }) => <Text style={{ color }} variant="h2">○</Text> }} />
  </Tabs>;
}
