import React, { useCallback } from 'react';
import { View, Text, FlatList, RefreshControl, Pressable, SafeAreaView } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useWorkRequests } from '@/features/work-requests/api/useWorkRequests';
import { WorkRequestCard } from '@/features/work-requests/components/WorkRequestCard';
import { WorkRequestSkeleton } from '@/features/work-requests/components/WorkRequestSkeleton';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import { useMe } from '@/features/auth/api/useMe';
import { authApi } from '@/features/auth/api/authApi';

export default function ProWorkRequestsScreen() {
  const { t } = useTranslation();
  const { data: requests, isLoading, isError, error, refetch, isRefetching } = useWorkRequests();
  const { data: user } = useMe();
  const logout = useAuthStore((state) => state.logout);

  // Recarga automática al volver a primer plano / enfocar pantalla
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
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-900">
      {/* Header Bar */}
      <View className="px-6 py-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex-row justify-between items-center">
        <View>
          <Text className="text-xl font-bold text-slate-900 dark:text-white">
            {t('workRequests.title')}
          </Text>
          {user && (
            <Text className="text-xs text-slate-500 dark:text-slate-400">
              Hola, {user.name.split(' ')[0]} 👋
            </Text>
          )}
        </View>
        <Pressable
          onPress={handleLogout}
          className="bg-slate-100 dark:bg-slate-700 px-3 py-2 rounded-xl"
          testID="logout-button"
        >
          <Text className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            {t('common.logout')}
          </Text>
        </Pressable>
      </View>

      {/* Main Content States */}
      {isLoading && !isRefetching ? (
        <WorkRequestSkeleton />
      ) : isError ? (
        <View className="flex-1 justify-center items-center px-6 py-12" testID="work-requests-error">
          <View className="bg-red-100 dark:bg-red-900/30 p-4 rounded-full mb-4">
            <Text className="text-2xl">⚠️</Text>
          </View>
          <Text className="text-lg font-bold text-slate-900 dark:text-white text-center mb-2">
            {t('workRequests.errorTitle')}
          </Text>
          <Text className="text-sm text-slate-500 dark:text-slate-400 text-center mb-6 px-4">
            {error?.message || t('workRequests.errorSubtitle')}
          </Text>
          <Pressable
            onPress={() => refetch()}
            className="bg-sky-600 active:bg-sky-700 px-6 py-3 rounded-xl shadow"
            testID="retry-button"
          >
            <Text className="text-white font-bold text-sm">
              {t('workRequests.retryButton')}
            </Text>
          </Pressable>
        </View>
      ) : requests && requests.length === 0 ? (
        <View className="flex-1 justify-center items-center px-8 py-12" testID="work-requests-empty">
          <View className="bg-slate-200 dark:bg-slate-800 p-5 rounded-full mb-4">
            <Text className="text-3xl">📥</Text>
          </View>
          <Text className="text-lg font-bold text-slate-900 dark:text-white text-center mb-2">
            {t('workRequests.emptyTitle')}
          </Text>
          <Text className="text-sm text-slate-500 dark:text-slate-400 text-center leading-5 mb-6">
            {t('workRequests.emptySubtitle')}
          </Text>
          <Pressable
            onPress={() => refetch()}
            className="bg-slate-200 dark:bg-slate-800 px-5 py-2.5 rounded-xl"
          >
            <Text className="text-slate-700 dark:text-slate-300 font-semibold text-xs">
              Actualizar lista
            </Text>
          </Pressable>
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
              onRefresh={refetch}
              tintColor="#0284C7"
              colors={['#0284C7']}
            />
          }
          testID="work-requests-list"
        />
      )}
    </SafeAreaView>
  );
}
