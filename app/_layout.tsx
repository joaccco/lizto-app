import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import { useMe } from '@/features/auth/api/useMe';
import { subscribeOnUnauthorized } from '@/core/api/httpClient';
import '@/core/i18n';
import '../global.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 30,
    },
  },
});

function RootLayoutNav() {
  const router = useRouter();
  const segments = useSegments();
  const { token, activeRole, isInitialized, initializeSession, deriveActiveRoleFromUser, logout } = useAuthStore();
  const { data: user, isLoading } = useMe();

  useEffect(() => {
    initializeSession();
  }, []);

  // Suscribirse a respuestas 401 para limpiar sesión de forma reactiva
  useEffect(() => {
    const unsubscribe = subscribeOnUnauthorized(() => {
      logout();
    });
    return unsubscribe;
  }, [logout]);

  // Derivar rol activo dinámicamente según datos del servidor
  useEffect(() => {
    if (token && user) {
      deriveActiveRoleFromUser(user);
    }
  }, [token, user]);

  // Protección y ruteo reactivo basado en sesión y rol activo derivado
  useEffect(() => {
    if (!isInitialized) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!token && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (token && user && activeRole && inAuthGroup) {
      if (activeRole === 'provider') {
        router.replace('/(pro)');
      } else {
        router.replace('/(cliente)');
      }
    }
  }, [token, activeRole, user, isInitialized, segments]);

  if (!isInitialized) {
    return null;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: '#08080A', // Exclusivamente oscuro Liquid Glass
        },
      }}
    >
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(pro)" options={{ headerShown: false }} />
      <Stack.Screen name="(cliente)" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <RootLayoutNav />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
