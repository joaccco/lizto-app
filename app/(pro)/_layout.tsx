import React, { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import { useMe } from '@/features/auth/api/useMe';
import { View, ActivityIndicator } from 'react-native';

export default function ProLayout() {
  const router = useRouter();
  const { token, activeRole } = useAuthStore();
  const { data: user, isLoading } = useMe();

  useEffect(() => {
    if (!token) {
      router.replace('/(auth)/login');
      return;
    }

    if (activeRole !== 'provider') {
      router.replace('/(cliente)');
      return;
    }

    if (user && !user.roles.includes('provider')) {
      // Si el usuario no tiene asignado el rol de proveedor en el backend (Correction #5)
      router.replace('/(cliente)');
    }
  }, [token, activeRole, user, router]);

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-slate-50 dark:bg-slate-900">
        <ActivityIndicator size="large" color="#0284C7" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ title: 'Solicitudes Disponibles' }} />
    </Stack>
  );
}
