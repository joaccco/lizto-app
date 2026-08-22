import React from 'react';
import { View, Text, Pressable, SafeAreaView } from 'react-native';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import { authApi } from '@/features/auth/api/authApi';
import { useMe } from '@/features/auth/api/useMe';

export default function ClienteHomeScreen() {
  const { data: user } = useMe();
  const logout = useAuthStore((state) => state.logout);
  const setActiveRole = useAuthStore((state) => state.setActiveRole);

  const handleLogout = async () => {
    await authApi.logout();
    await logout();
  };

  const handleSwitchToProvider = async () => {
    await setActiveRole('provider');
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-900 px-6 py-8">
      <View className="flex-1 justify-center items-center">
        <Text className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          Modo Cliente
        </Text>
        {user && (
          <Text className="text-base text-slate-600 dark:text-slate-400 mb-6">
            Bienvenido, {user.name}
          </Text>
        )}

        {user?.roles.includes('provider') && (
          <Pressable
            onPress={handleSwitchToProvider}
            className="bg-sky-600 px-6 py-3 rounded-xl mb-4"
          >
            <Text className="text-white font-bold text-sm">
              Cambiar a Perfil Profesional
            </Text>
          </Pressable>
        )}

        <Pressable
          onPress={handleLogout}
          className="bg-slate-200 dark:bg-slate-800 px-6 py-3 rounded-xl"
        >
          <Text className="text-slate-700 dark:text-slate-300 font-bold text-sm">
            Cerrar sesión
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
