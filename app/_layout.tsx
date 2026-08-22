import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useColorScheme } from 'react-native';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
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
  const { token, activeRole, isInitialized, initializeSession, logout } = useAuthStore();
  const colorScheme = useColorScheme();

  useEffect(() => {
    initializeSession();
  }, []);

  // Suscribirse a respuestas 401 para limpiar sesión y reaccionar desde el layout
  useEffect(() => {
    const unsubscribe = subscribeOnUnauthorized(() => {
      logout();
    });
    return unsubscribe;
  }, [logout]);

  // Protección reactiva de rutas basada en sesión y rol activo
  useEffect(() => {
    if (!isInitialized) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!token && !inAuthGroup) {
      // Redirigir a login si no hay token
      router.replace('/(auth)/login');
    } else if (token && inAuthGroup) {
      // Redirigir al grupo del rol activo si ya hay sesión
      if (activeRole === 'provider') {
        router.replace('/(pro)');
      } else {
        router.replace('/(cliente)');
      }
    }
  }, [token, activeRole, isInitialized, segments]);

  if (!isInitialized) {
    return null;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: colorScheme === 'dark' ? '#0F172A' : '#F8FAFC',
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
