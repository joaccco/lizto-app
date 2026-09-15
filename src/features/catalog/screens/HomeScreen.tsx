import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { Screen } from '@/components/layout/Screen';
import { Text, GlassButton } from '@/components/ui';
import { CategoryGrid } from '../components/CategoryGrid';

export default function HomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  return <Screen title={t('brand.name')} subtitle={t('home.eyebrow')}>
    <LinearGradient colors={['#30204F', '#171322', '#131318']} style={{ borderRadius: 28, padding: 28, borderWidth: 1, borderColor: '#483363' }}>
      <Text variant="caption" color="#A8FF35" weight="bold">{t('home.heroLabel')}</Text>
      <Text variant="h1" weight="extrabold" style={{ fontSize: 36, lineHeight: 42, marginTop: 20 }}>{t('home.title')}</Text>
      <Text muted className="mt-4 mb-7 leading-6">{t('home.description')}</Text>
      <GlassButton variant="fluor" size="lg" accessibilityRole="button" onPress={() => router.push('/(cliente)/catalog')}>{t('home.explore')}</GlassButton>
    </LinearGradient>
    <View className="flex-row items-center justify-between mt-3">
      <Text variant="h3" weight="bold">{t('home.categories')}</Text>
      <Text variant="caption" muted>{t('home.categoriesHint')}</Text>
    </View>
    <CategoryGrid />
    <View className="rounded-2xl bg-card border border-border p-5">
      <Text weight="semibold">{t('home.requestsTitle')}</Text>
      <Text muted className="mt-2 mb-4 leading-5">{t('home.requestsDescription')}</Text>
      <GlassButton variant="outline" onPress={() => router.push('/(cliente)/requests')}>{t('home.requestsAction')}</GlassButton>
    </View>
  </Screen>;
}
