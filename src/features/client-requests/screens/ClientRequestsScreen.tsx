import { ActivityIndicator, FlatList, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Screen } from '@/components/layout/Screen';
import { SignInPrompt } from '@/components/layout/SignInPrompt';
import { Text, GlassButton, EmptyState, ErrorState } from '@/components/ui';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import { formatToArgentinaTime } from '@/core/domain/time';
import { useClientRequests } from '../api/useClientRequests';

export default function ClientRequestsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const token = useAuthStore(state => state.token);
  const query = useClientRequests();
  if (!token) return <Screen title={t('requests.title')}><SignInPrompt /></Screen>;
  return <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-background">
    <FlatList data={query.data?.pages.flatMap(page => page.data) ?? []} keyExtractor={item => item.uuid}
      contentContainerStyle={{ padding: 24, width: '100%', maxWidth: 576, alignSelf: 'center', flexGrow: 1 }}
      refreshing={query.isRefetching} onRefresh={() => void query.refetch()}
      ListHeaderComponent={<View className="mt-2 mb-7 gap-2"><Text variant="h1" weight="extrabold">{t('requests.title')}</Text><Text muted>{t('requests.description')}</Text></View>}
      ListEmptyComponent={query.isPending ? <ActivityIndicator color="#7C5CFF" accessibilityLabel={t('common.loading')} /> : query.isError ?
        <ErrorState title={t('requests.errorTitle')} message={t('catalog.errorDescription')} onRetry={() => void query.refetch()} /> :
        <EmptyState title={t('requests.emptyTitle')} description={t('requests.emptyDescription')} actionLabel={t('home.explore')} onAction={() => router.push('/(cliente)/catalog')} />}
      renderItem={({ item }) => <View className="p-5 mb-4 rounded-2xl border border-border bg-card gap-3">
        <Text color="#B9A5FF" weight="semibold" variant="caption">{t(`requests.status.${item.status}`)}</Text>
        <Text variant="h3" weight="bold">{item.raw_prompt}</Text>
        {item.full_prompt !== item.raw_prompt ? <Text muted>{item.full_prompt}</Text> : null}
        {item.category ? <Text muted variant="caption">{item.category.name}</Text> : null}
        {item.created_at ? <Text muted variant="caption">{formatToArgentinaTime(item.created_at)}</Text> : null}
        {item.conversation_id ? <GlassButton variant="outline" onPress={() => router.push({ pathname: '/chat/[id]', params: { id: item.conversation_id! } })}>{t('requests.openChat')}</GlassButton> : null}
      </View>}
      ListFooterComponent={query.hasNextPage ? <View className="gap-3">{query.isFetchNextPageError ? <Text color="#FF5A5A">{t('catalog.errorDescription')}</Text> : null}<GlassButton variant="outline" loading={query.isFetchingNextPage} onPress={() => void query.fetchNextPage()}>{t('common.loadMore')}</GlassButton></View> : null}
    />
  </SafeAreaView>;
}
