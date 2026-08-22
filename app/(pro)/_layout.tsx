import React, { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import { useMe } from '@/features/auth/api/useMe';
import { View, ActivityIndicator } from 'react-native';

export default function ProLayout() {
  const router = useRouter();
  const { token, isInitialized } = useAuthStore();
  const { data: user, isLoading, isError } = useMe();

  const isAuthorized = Boolean(
    isInitialized &&
    token &&
    user &&
    Array.isArray(user.roles) &&
    user.roles.includes('provider')
  );

  useEffect(() => {
    if (!isInitialized) return;

    if (!token || isError) {
      router.replace('/(auth)/login');
      return;
    }

    if (!isLoading && user && !user.roles.includes('provider')) {
      // Si el usuario no tiene rol provider en el servidor, redirigir a cliente
      if (user.roles.includes('client')) {
        router.replace('/(cliente)');
      } else {
        router.replace('/(auth)/login');
      }
    }
  }, [token, isInitialized, isLoading, isError, user, router]);

  // Si está cargando o no está explícitamente autorizado, NO pintar contenido protegido
  if (!isInitialized || isLoading || !isAuthorized) {
    return (
      <View className="flex-1 justify-center items-center bg-[#08080A]">
        <ActivityIndicator size="large" color="#7C5CFF" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ title: 'Solicitudes Disponibles' }} />
    </Stack>
  );
}
