import React, { useRef, useState } from 'react';
import { View, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { loginSchema, LoginFormData } from '@/features/auth/schemas/authSchema';
import { authApi } from '@/features/auth/api/authApi';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import { loginError } from '@/features/auth/domain/loginError';
import { GlassCard, GlassButton, Input, Text } from '@/components/ui';
import { OAuthButtons } from '@/features/auth/components/OAuthButtons';

export default function LoginScreen() {
  const { t } = useTranslation();
  const setSession = useAuthStore((state) => state.setSession);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [oauthBusy, setOAuthBusy] = useState(false);
  const submitting = useRef(false);

  const {
    control,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    if (submitting.current) return;
    if (Platform.OS === 'web') { setServerError(t('auth.nativeLoginRequired')); return; }
    submitting.current = true;
    clearErrors();
    setServerError(null);
    setLoading(true);
    try {
      const response = await authApi.login(data);
      queryClient.clear();
      await setSession(response.data.token);
    } catch (err) {
      const failure = loginError(err);
      setServerError(t(failure.message));
      for (const field of failure.fields) setError(field, { type: 'server', message: failure.message });
    } finally {
      submitting.current = false;
      setLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-background px-6 py-12" keyboardShouldPersistTaps="handled">
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
          <Text variant="caption" className="text-danger" accessibilityRole="alert">
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
                error={errors.email?.message ? t(errors.email.message) : undefined}
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
                error={errors.password?.message ? t(errors.password.message) : undefined}
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
          disabled={oauthBusy}
          testID="login-submit-button"
        >
          {t('auth.loginButton')}
        </GlassButton>
      </GlassCard>
      <OAuthButtons mode="login" lock={submitting} disabled={loading} onBusyChange={setOAuthBusy} />
      <GlassButton variant="outline" disabled={loading || oauthBusy} className="mt-6 mb-12" onPress={() => router.replace('/(cliente)')}>{t('auth.browse')}</GlassButton>
    </ScrollView>
  );
}
