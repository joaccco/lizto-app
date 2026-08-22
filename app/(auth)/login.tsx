import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, ScrollView } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { loginSchema, LoginFormData } from '@/features/auth/schemas/authSchema';
import { authApi } from '@/features/auth/api/authApi';
import { useAuthStore, Role } from '@/features/auth/store/useAuthStore';
import { HttpError } from '@/core/api/httpClient';

export default function LoginScreen() {
  const { t } = useTranslation();
  const setSession = useAuthStore((state) => state.setSession);
  const [selectedRole, setSelectedRole] = useState<Role>('provider');
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null);
    setLoading(true);
    try {
      const response = await authApi.login(data);
      const userRoles = response.data.user.roles;
      
      // Determinar rol activo: si posee 'provider' y eligió provider, usar 'provider'
      const roleToUse: Role = userRoles.includes('provider') && selectedRole === 'provider'
        ? 'provider'
        : 'client';

      await setSession(response.data.token, roleToUse);
    } catch (err) {
      if (err instanceof HttpError) {
        setServerError(err.body?.message || t('auth.invalidCredentials'));
      } else {
        setServerError(t('auth.invalidCredentials'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-slate-50 dark:bg-slate-900 px-6 py-12">
      <View className="mt-8 mb-8">
        <Text className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">
          {t('auth.title')}
        </Text>
        <Text className="text-base text-slate-500 dark:text-slate-400">
          {t('auth.subtitle')}
        </Text>
      </View>

      {serverError && (
        <View className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6">
          <Text className="text-red-700 dark:text-red-300 text-sm font-medium">
            {serverError}
          </Text>
        </View>
      )}

      <View className="space-y-5">
        {/* Selector de rol para la sesión */}
        <View className="mb-4">
          <Text className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-2">
            {t('auth.roleSelector')}
          </Text>
          <View className="flex-row bg-slate-200 dark:bg-slate-800 rounded-xl p-1">
            <Pressable
              onPress={() => setSelectedRole('provider')}
              className={`flex-1 py-2.5 rounded-lg items-center ${
                selectedRole === 'provider'
                  ? 'bg-sky-600 shadow-sm'
                  : 'bg-transparent'
              }`}
            >
              <Text
                className={`font-bold text-sm ${
                  selectedRole === 'provider' ? 'text-white' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {t('auth.roleProvider')}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setSelectedRole('client')}
              className={`flex-1 py-2.5 rounded-lg items-center ${
                selectedRole === 'client'
                  ? 'bg-sky-600 shadow-sm'
                  : 'bg-transparent'
              }`}
            >
              <Text
                className={`font-bold text-sm ${
                  selectedRole === 'client' ? 'text-white' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {t('auth.roleClient')}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Email Input */}
        <View>
          <Text className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            {t('auth.emailLabel')}
          </Text>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white text-base focus:border-sky-500"
                placeholder={t('auth.emailPlaceholder')}
                placeholderTextColor="#94A3B8"
                autoCapitalize="none"
                keyboardType="email-address"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                testID="login-email-input"
              />
            )}
          />
          {errors.email && (
            <Text className="text-red-500 text-xs mt-1 font-medium">{errors.email.message}</Text>
          )}
        </View>

        {/* Password Input */}
        <View>
          <Text className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            {t('auth.passwordLabel')}
          </Text>
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white text-base focus:border-sky-500"
                placeholder={t('auth.passwordPlaceholder')}
                placeholderTextColor="#94A3B8"
                secureTextEntry
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                testID="login-password-input"
              />
            )}
          />
          {errors.password && (
            <Text className="text-red-500 text-xs mt-1 font-medium">{errors.password.message}</Text>
          )}
        </View>

        {/* Submit Button */}
        <Pressable
          onPress={handleSubmit(onSubmit)}
          disabled={loading}
          className="bg-sky-600 hover:bg-sky-700 active:bg-sky-800 py-4 rounded-xl items-center shadow-md mt-6"
          testID="login-submit-button"
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text className="text-white font-bold text-base">
              {t('auth.loginButton')}
            </Text>
          )}
        </Pressable>
      </View>
    </ScrollView>
  );
}
