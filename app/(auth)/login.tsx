import React, { useState } from 'react';
import { View, Pressable, ScrollView } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { loginSchema, LoginFormData } from '@/features/auth/schemas/authSchema';
import { authApi } from '@/features/auth/api/authApi';
import { useAuthStore, Role } from '@/features/auth/store/useAuthStore';
import { HttpError } from '@/core/api/httpClient';
import { GlassCard, GlassButton, Input, Text } from '@/components/ui';

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
        {/* Selector de rol para la sesión */}
        <View className="mb-5">
          <Text variant="caption" weight="semibold" className="uppercase tracking-wider mb-2">
            {t('auth.roleSelector')}
          </Text>
          <View className="flex-row bg-muted rounded-2xl p-1 border border-border">
            <Pressable
              onPress={() => setSelectedRole('provider')}
              className={`flex-1 py-3 rounded-xl items-center ${
                selectedRole === 'provider' ? 'bg-primary' : 'bg-transparent'
              }`}
            >
              <Text
                variant="body"
                weight="bold"
                className={selectedRole === 'provider' ? 'text-foreground' : 'text-muted-foreground'}
              >
                {t('auth.roleProvider')}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setSelectedRole('client')}
              className={`flex-1 py-3 rounded-xl items-center ${
                selectedRole === 'client' ? 'bg-primary' : 'bg-transparent'
              }`}
            >
              <Text
                variant="body"
                weight="bold"
                className={selectedRole === 'client' ? 'text-foreground' : 'text-muted-foreground'}
              >
                {t('auth.roleClient')}
              </Text>
            </Pressable>
          </View>
        </View>

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
    </ScrollView>
  );
}
