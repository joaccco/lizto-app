import React, { useCallback } from 'react';
import { View, FlatList, RefreshControl, SafeAreaView } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useWorkRequests } from '@/features/work-requests/api/useWorkRequests';
import { WorkRequestCard } from '@/features/work-requests/components/WorkRequestCard';
import { WorkRequestSkeleton } from '@/features/work-requests/components/WorkRequestSkeleton';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import { useMe } from '@/features/auth/api/useMe';
import { authApi } from '@/features/auth/api/authApi';
import { GlassNav, GlassButton, EmptyState, ErrorState, Text } from '@/components/ui';

export default function ProWorkRequestsScreen() {
  const { t } = useTranslation();
  const { data: requests, isLoading, isError, error, refetch, isRefetching } = useWorkRequests();
  const { data: user } = useMe();
  const logout = useAuthStore((state) => state.logout);

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const handleLogout = async () => {
    await authApi.logout();
    await logout();
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header Bar */}
      <GlassNav
        rightAction={
          <GlassButton
            variant="secondary"
            size="sm"
            onPress={handleLogout}
            testID="logout-button"
          >
            {t('common.logout')}
          </GlassButton>
        }
      >
        <View className="items-center">
          <Text variant="h2" weight="extrabold">
            {t('workRequests.title')}
          </Text>
          {user && (
            <Text variant="caption" muted>
              Hola, {user.name.split(' ')[0]} 👋
            </Text>
          )}
        </View>
      </GlassNav>

      {/* Main Content States */}
      {isLoading && !isRefetching ? (
        <WorkRequestSkeleton />
      ) : isError ? (
        <View className="flex-1 justify-center px-6" testID="work-requests-error">
          <ErrorState
            title={t('workRequests.errorTitle')}
            message={error?.message || t('workRequests.errorSubtitle')}
            onRetry={() => refetch()}
          />
        </View>
      ) : requests && requests.length === 0 ? (
        <View className="flex-1 justify-center px-6" testID="work-requests-empty">
          <EmptyState
            title={t('workRequests.emptyTitle')}
            description={t('workRequests.emptySubtitle')}
            actionLabel="Actualizar lista"
            onAction={() => refetch()}
          />
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <WorkRequestCard item={item} />}
          contentContainerStyle={{ padding: 20 }}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => { refetch(); }}
              tintColor="#7C5CFF"
              colors={['#7C5CFF']}
            />
          }
          testID="work-requests-list"
        />
      )}
    </SafeAreaView>
  );
}
