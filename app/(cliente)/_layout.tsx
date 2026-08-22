import React, { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import { useMe } from '@/features/auth/api/useMe';
import { View, ActivityIndicator } from 'react-native';

export default function ClienteLayout() {
  const router = useRouter();
  const { token, isInitialized } = useAuthStore();
  const { data: user, isLoading, isError } = useMe();

  const isAuthorized = Boolean(
    isInitialized &&
    token &&
    user &&
    Array.isArray(user.roles) &&
    user.roles.includes('client')
  );

  useEffect(() => {
    if (!isInitialized) return;

    if (!token || isError) {
      router.replace('/(auth)/login');
      return;
    }

    if (!isLoading && user && !user.roles.includes('client')) {
      if (user.roles.includes('provider')) {
        router.replace('/(pro)');
      } else {
        router.replace('/(auth)/login');
      }
    }
  }, [token, isInitialized, isLoading, isError, user, router]);

  if (!isInitialized || isLoading || !isAuthorized) {
    return (
      <View className="flex-1 justify-center items-center bg-[#08080A]">
        <ActivityIndicator size="large" color="#7C5CFF" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ title: 'Mi Cuenta Cliente' }} />
    </Stack>
  );
}
