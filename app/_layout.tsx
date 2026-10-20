import React, { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
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
import { ConversationNameField } from '@/core/navigation/ConversationPresentation';
import { sessionRedirect } from '@/core/navigation/sessionRoute';
import { View, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ErrorState, GlassButton, Text } from '@/components/ui';
import { getActiveRole, saveActiveRole } from '@/core/security/secureStore';
import { resolveRole } from '@/features/auth/domain/resolveRole';
import type { Role } from '@/features/auth/store/useAuthStore';
import '@/core/i18n';
import '../global.css';

// Prevenir ocultamiento automático del splash screen hasta completar la carga de fuentes
SplashScreen.preventAutoHideAsync().catch(() => {});

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

function RootLayoutNav({ queryClient }: { queryClient: QueryClient }) {
  const router = useRouter();
  const segments = useSegments();
  const { token, isInitialized, storageError, initializeSession, logout } = useAuthStore();
  const { t } = useTranslation();
  const { data: user, isError: userError, refetch } = useMe();

  const [fontsLoaded, fontError] = useAppFonts();

  useEffect(() => {
    void initializeSession();
  }, [initializeSession]);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  // Suscribirse a respuestas 401 para limpiar sesión de forma reactiva
  useEffect(() => {
    const unsubscribe = subscribeOnUnauthorized(() => {
      void logout().catch(() => {}); // El store conserva el error y bloquea la UI.
      queryClient.clear();
    });
    return unsubscribe;
  }, [logout, queryClient]);

  const [preference, setPreference] = useState<{ userId: string; role: Role | null } | null>(null);
  const [roleBusy, setRoleBusy] = useState(false);
  const [roleError, setRoleError] = useState(false);
  useEffect(() => {
    let current = true;
    setPreference(null);
    useAuthStore.setState({ activeRole: null });
    if (user && token && !storageError) {
      getActiveRole(user.id).then(async preference => {
        const initial = resolveRole(user.roles, preference);
        const role = initial.status === 'resolved' ? initial.role : null;
        if (current && role && role !== preference) await saveActiveRole(user.id, role);
        if (current) setPreference({ userId: user.id, role });
      }).catch(() => { if (current) useAuthStore.setState({ storageError: 'read' }); });
    }
    return () => { current = false; };
  }, [user?.id, token, storageError]);
  const resolution = user && preference?.userId === user.id
    ? resolveRole(user.roles, preference.role) : null;
  const role = resolution?.status === 'resolved' ? resolution.role : null;
  useEffect(() => { useAuthStore.setState({ activeRole: role }); }, [role]);
  const chooseRole = async (nextRole: Role) => {
    if (!user || !user.roles.includes(nextRole) || roleBusy) return;
    setRoleBusy(true);
    setRoleError(false);
    try {
      await saveActiveRole(user.id, nextRole);
      setPreference({ userId: user.id, role: nextRole });
    } catch { setRoleError(true); }
    finally { setRoleBusy(false); }
  };

  // Protección y ruteo reactivo basado en sesión y rol activo derivado
  useEffect(() => {
    if (!isInitialized || storageError || (!fontsLoaded && !fontError)) return;

    const destination = sessionRedirect({ token, role: user ? role : null, group: segments[0] });
    if (destination) router.replace(destination);
  }, [token, role, user, isInitialized, storageError, fontsLoaded, fontError, segments, router]);


  if (!isInitialized || (!fontsLoaded && !fontError)) {
    return null;
  }

  if (storageError) {
    return <View className="flex-1 bg-background justify-center p-6"><ErrorState message={t('auth.storageError')} onRetry={() => {
      if (storageError === 'delete') void logout().then(() => queryClient.clear()).catch(() => {});
      else void initializeSession();
    }} /></View>;
  }
  if (token && userError) {
    return <View className="flex-1 bg-background justify-center p-6 gap-4"><ErrorState message={t('catalog.errorDescription')} onRetry={() => void refetch()} /><GlassButton variant="outline" onPress={() => { void logout().then(() => queryClient.clear()).catch(() => {}); }}>{t('common.logout')}</GlassButton></View>;
  }
  if (token && resolution && resolution.status !== 'resolved') {
    return <SafeAreaView className="flex-1 bg-background justify-center p-6 gap-4">
      <Text variant="h1">{t(resolution.status === 'unsupported' ? 'auth.unsupportedRole' : 'auth.chooseRole')}</Text>
      {resolution.status === 'selection_required' ? <>
        <GlassButton disabled={roleBusy} onPress={() => void chooseRole('client')}>{t('auth.chooseClient')}</GlassButton>
        <GlassButton disabled={roleBusy} onPress={() => void chooseRole('provider')}>{t('auth.chooseProvider')}</GlassButton>
      </> : null}
      {roleError ? <Text accessibilityRole="alert">{t('account.actionError')}</Text> : null}
      <GlassButton variant="outline" onPress={() => void logout().catch(() => {})}>{t('common.logout')}</GlassButton>
    </SafeAreaView>;
  }
  if (token && (!user || !role)) {
    return <View className="flex-1 bg-background justify-center"><ActivityIndicator color="#7C5CFF" accessibilityLabel={t('common.loading')} /></View>;
  }

  const canSwitch = user?.roles.includes('client') && user.roles.includes('provider')
    && (segments[0] === '(cliente)' || segments[0] === '(pro)');
  return (
    <View className="flex-1 bg-background">
      {canSwitch && role ? <SafeAreaView edges={['top', 'left', 'right']} className="px-4 pb-2 gap-2">
        <Text variant="caption">{t(role === 'provider' ? 'auth.roleProvider' : 'auth.roleClient')}</Text>
        <GlassButton size="sm" variant="outline" disabled={roleBusy} onPress={() => void chooseRole(role === 'provider' ? 'client' : 'provider')}>
          {t(role === 'provider' ? 'account.switchClient' : 'account.switchProvider')}
        </GlassButton>
        {roleError ? <Text accessibilityRole="alert">{t('account.actionError')}</Text> : null}
      </SafeAreaView> : null}
    <ConversationNameField.Provider value={role === 'provider' ? 'client_name' : role === 'client' ? 'provider_name' : null}>
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: '#08080A', // Exclusivamente oscuro Liquid Glass
        },
      }}
    >
      <Stack.Protected guard={!token}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={Boolean(token) && role === 'provider'}>
        <Stack.Screen name="(pro)" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={!token || role === 'client'}>
        <Stack.Screen name="(cliente)" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={Boolean(token) && Boolean(role)}>
        <Stack.Screen name="chat/[id]" options={{ headerShown: false }} />
      </Stack.Protected>
    </Stack>
    </ConversationNameField.Provider>
    </View>
  );
}

function SessionQueries() {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
  }));
  useEffect(() => () => {
    void queryClient.cancelQueries();
    queryClient.clear();
  }, [queryClient]);
  return <QueryClientProvider client={queryClient}><RootLayoutNav queryClient={queryClient} /></QueryClientProvider>;
}

export default function RootLayout() {
  const token = useAuthStore(state => state.token);
  return <SafeAreaProvider><SessionQueries key={token ?? 'anonymous'} /></SafeAreaProvider>;
}
