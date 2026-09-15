import React, { useState } from 'react';
import { View, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { ME_QUERY_KEY } from '@/features/auth/api/useMe';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { loginSchema, LoginFormData } from '@/features/auth/schemas/authSchema';
import { authApi } from '@/features/auth/api/authApi';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import { HttpError } from '@/core/api/httpClient';
import { GlassCard, GlassButton, Input, Text } from '@/components/ui';

export default function LoginScreen() {
  const { t } = useTranslation();
  const setSession = useAuthStore((state) => state.setSession);
  const router = useRouter();
  const queryClient = useQueryClient();
  const deriveRole = useAuthStore(state => state.deriveActiveRoleFromUser);
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
      queryClient.clear();
      const role = await deriveRole(response.data.user);
      queryClient.setQueryData(ME_QUERY_KEY, response.data.user);
      await setSession(response.data.token, role);
    } catch (err) {
      if (err instanceof HttpError) {
        setServerError(err.status === 401 || err.status === 422 ? t('auth.invalidCredentials') : t('auth.connectionError'));
      } else {
        setServerError(t('auth.connectionError'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-background px-6 py-12">
      <View className="mt-8 mb-8">
        <Text variant="h1" className="mb-2">
          {t('auth.title')}
        </Text>
        <Text variant="subtitle" muted>
          {t('auth.subtitle')}
        </Text>
      </View>

      {serverError && (
        <View className="bg-danger/15 border border-danger/30 rounded-2xl p-4 mb-6">
          <Text variant="caption" className="text-danger">
            {serverError}
          </Text>
        </View>
      )}

      <GlassCard className="p-6">
        {/* Email Input */}
        <View className="mb-4">
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label={t('auth.emailLabel')}
                placeholder={t('auth.emailPlaceholder')}
                autoCapitalize="none"
                keyboardType="email-address"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={errors.email?.message}
                testID="login-email-input"
              />
            )}
          />
        </View>

        {/* Password Input */}
        <View className="mb-6">
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label={t('auth.passwordLabel')}
                placeholder={t('auth.passwordPlaceholder')}
                secureTextEntry
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={errors.password?.message}
                testID="login-password-input"
              />
            )}
          />
        </View>

        {/* Submit Button */}
        <GlassButton
          variant="primary"
          size="lg"
          onPress={() => { handleSubmit(onSubmit)(); }}
          loading={loading}
          testID="login-submit-button"
        >
          {t('auth.loginButton')}
        </GlassButton>
      </GlassCard>
      <GlassButton variant="outline" className="mt-6 mb-12" onPress={() => router.replace('/(cliente)')}>{t('auth.browse')}</GlassButton>
    </ScrollView>
  );
}
