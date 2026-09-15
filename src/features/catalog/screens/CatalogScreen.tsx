import { ActivityIndicator, FlatList, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text, GlassButton, EmptyState, ErrorState } from '@/components/ui';
import { useProviders } from '../api/useCatalog';

export default function CatalogScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ category?: string; name?: string }>();
  const category = typeof params.category === 'string' ? params.category : undefined;
  const query = useProviders(category);
  const providers = query.data?.pages.flatMap(page => page.data) ?? [];
  return <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-background">
    <FlatList data={providers} keyExtractor={item => item.uuid}
      contentContainerStyle={{ padding: 24, width: '100%', maxWidth: 576, alignSelf: 'center', flexGrow: 1 }}
      refreshing={query.isRefetching} onRefresh={() => void query.refetch()}
      ListHeaderComponent={<View className="mb-6 mt-2 gap-3">
        <Text accessibilityRole="header" variant="h1" weight="extrabold">{params.name || t('catalog.title')}</Text>
        <Text muted>{t('catalog.description')}</Text>
        {category ? <GlassButton variant="outline" onPress={() => router.setParams({ category: '', name: '' })}>{t('catalog.clearFilter')}</GlassButton> : null}
      </View>}
      ListEmptyComponent={query.isPending ? <ActivityIndicator color="#7C5CFF" accessibilityLabel={t('common.loading')} /> : query.isError ?
        <ErrorState title={t('catalog.errorTitle')} message={t('catalog.errorDescription')} onRetry={() => void query.refetch()} /> :
        <EmptyState title={t('catalog.emptyTitle')} description={t('catalog.emptyDescription')} />}
      renderItem={({ item }) => <View className="p-5 mb-4 bg-card border border-border rounded-2xl gap-3">
        <View className="flex-row items-center gap-3">
          <View className="w-12 h-12 rounded-2xl bg-primary/20 items-center justify-center"><Text color="#B9A5FF" weight="bold" variant="h2">{item.name.charAt(0)}</Text></View>
          <View className="flex-1"><Text weight="bold" variant="h3">{item.name}</Text><Text muted variant="caption">{item.category_name}</Text></View>
        </View>
        {item.is_verified ? <Text variant="caption" color="#A8FF35">{t('catalog.verified')}</Text> : null}
        {item.bio ? <Text muted className="leading-6">{item.bio}</Text> : null}
        {item.specialties.length ? <Text variant="caption" muted>{item.specialties.join(' · ')}</Text> : null}
        <Text variant="caption">{item.total_reviews > 0 ? t('catalog.reviews', { rating: item.avg_rating, count: item.total_reviews }) : t('catalog.noReviews')}</Text>
      </View>}
      ListFooterComponent={query.hasNextPage ? <View className="gap-3">{query.isFetchNextPageError ? <Text color="#FF5A5A">{t('catalog.errorDescription')}</Text> : null}<GlassButton variant="outline" loading={query.isFetchingNextPage} onPress={() => void query.fetchNextPage()}>{t('common.loadMore')}</GlassButton></View> : null}
    />
  </SafeAreaView>;
}
