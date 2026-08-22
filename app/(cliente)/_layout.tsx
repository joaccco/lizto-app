import React, { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { useAuthStore } from '@/features/auth/store/useAuthStore';

export default function ClienteLayout() {
  const router = useRouter();
  const { token, activeRole } = useAuthStore();

  useEffect(() => {
    if (!token) {
      router.replace('/(auth)/login');
      return;
    }

    if (activeRole !== 'client') {
      router.replace('/(pro)');
    }
  }, [token, activeRole, router]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ title: 'Mi Cuenta Cliente' }} />
    </Stack>
  );
}
