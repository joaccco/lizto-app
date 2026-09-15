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
import { sessionRedirect } from '@/core/navigation/sessionRoute';
import { View, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ErrorState, GlassButton } from '@/components/ui';
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
  const { t } = useTranslation();
  const { data: user, isError: userError, refetch } = useMe();

  const [fontsLoaded, fontError] = useAppFonts();

  useEffect(() => {
    void initializeSession();
  }, []);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  // Suscribirse a respuestas 401 para limpiar sesión de forma reactiva
  useEffect(() => {
    const unsubscribe = subscribeOnUnauthorized(() => {
      void logout();
      queryClient.clear();
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

    const destination = sessionRedirect({ token, role: user ? activeRole : null, group: segments[0] });
    if (destination) router.replace(destination);
  }, [token, activeRole, user, isInitialized, fontsLoaded, fontError, segments, router]);


  if (!isInitialized || (!fontsLoaded && !fontError)) {
    return null;
  }

  if (token && userError) {
    return <View className="flex-1 bg-background justify-center p-6 gap-4"><ErrorState message={t('catalog.errorDescription')} onRetry={() => void refetch()} /><GlassButton variant="outline" onPress={() => { void logout(); queryClient.clear(); }}>{t('common.logout')}</GlassButton></View>;
  }
  if (token && (!user || !activeRole || sessionRedirect({ token, role: activeRole, group: segments[0] }))) {
    return <View className="flex-1 bg-background justify-center"><ActivityIndicator color="#7C5CFF" accessibilityLabel={t('common.loading')} /></View>;
  }
  if (!token && (segments[0] === '(pro)' || segments[0] === 'chat')) return null;

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
