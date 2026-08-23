import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from '@expo-google-fonts/manrope';
import {
  IBMPlexMono_400Regular,
  IBMPlexMono_500Medium,
  IBMPlexMono_600SemiBold,
} from '@expo-google-fonts/ibm-plex-mono';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import { useMe } from '@/features/auth/api/useMe';
import { subscribeOnUnauthorized } from '@/core/api/httpClient';
import '@/core/i18n';
import '../global.css';

// Prevenir ocultamiento automático del splash screen hasta completar la carga de fuentes
SplashScreen.preventAutoHideAsync().catch(() => {});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 30,
    },
  },
});

export function useAppFonts() {
  return useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
    IBMPlexMono_400Regular,
    IBMPlexMono_500Medium,
    IBMPlexMono_600SemiBold,
  });
}

function RootLayoutNav() {
  const router = useRouter();
  const segments = useSegments();
  const { token, activeRole, isInitialized, initializeSession, deriveActiveRoleFromUser, logout } = useAuthStore();
  const { data: user } = useMe();

  const [fontsLoaded, fontError] = useAppFonts();

  useEffect(() => {
    initializeSession();
  }, []);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

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
    if (!isInitialized || (!fontsLoaded && !fontError)) return;

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
  }, [token, activeRole, user, isInitialized, fontsLoaded, fontError, segments]);

  if (!isInitialized || (!fontsLoaded && !fontError)) {
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
