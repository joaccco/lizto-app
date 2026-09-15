import { View, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text, ErrorState, EmptyState } from '@/components/ui';
import { useCategories } from '../api/useCatalog';

export function CategoryGrid() {
  const { t } = useTranslation();
  const router = useRouter();
  const query = useCategories();
  if (query.isPending) return <ActivityIndicator color="#7C5CFF" accessibilityLabel={t('common.loading')} />;
  if (query.isError) return <ErrorState title={t('catalog.errorTitle')} message={t('catalog.errorDescription')} onRetry={() => void query.refetch()} />;
  if (!query.data.length) return <EmptyState title={t('catalog.noCategories')} />;
  return <View className="flex-row flex-wrap gap-3">{query.data.map(category => (
    <Pressable key={category.slug} accessibilityRole="button" accessibilityLabel={t('catalog.browseCategory', { name: category.name })}
      onPress={() => router.push({ pathname: '/(cliente)/catalog', params: { category: category.slug, name: category.name } })}
      className="grow basis-[44%] rounded-2xl border border-border bg-card p-5" style={{ minHeight: 112 }}>
      <Text color="#A8FF35" variant="h2" accessibilityElementsHidden>{category.name.charAt(0).toUpperCase()}</Text>
      <Text weight="semibold" className="mt-3">{category.name}</Text>
    </Pressable>
  ))}</View>;
}
