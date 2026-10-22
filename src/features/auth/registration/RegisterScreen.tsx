import { useRef, useState } from 'react';
import { Platform, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { GlassButton, GlassCard, Input, Text } from '@/components/ui';
import { authApi } from '../api/authApi';
import { registerSchema } from '../schemas/authSchema';
import type { RegisterFormData, RegisterResponse } from '../schemas/authSchema';
import { useAuthStore } from '../store/useAuthStore';
import { registrationError } from './registrationError';

export default function RegisterScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const client = useQueryClient();
  const lock = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mutation = useMutation({ mutationFn: authApi.register, gcTime: 0 });
  const { control, handleSubmit, setError: setFieldError, clearErrors, reset, formState: { errors } } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '', password_confirmation: '' },
  });
  const establishSession = async (response: RegisterResponse) => {
    try {
      client.removeQueries();
      await useAuthStore.getState().setSession(response.data.token);
      client.getMutationCache().clear();
    } catch { setError('registration.createdSessionFailed'); }
  };
  const submit = handleSubmit(async data => {
    if (lock.current || mutation.isSuccess) return;
    if (Platform.OS === 'web') { setError('registration.nativeRequired'); return; }
    lock.current = true; setBusy(true); setError(null); clearErrors();
    try {
      const response = await mutation.mutateAsync(data);
      reset();
      await establishSession(response);
    } catch (failure) {
      const result = registrationError(failure);
      setError(result.message);
      for (const field of result.fields) setFieldError(field, { type: 'server', message: field === 'email' ? 'registration.emailUnavailable' : 'registration.validationFailed' });
    } finally { lock.current = false; setBusy(false); }
  });
  const retrySession = async () => {
    if (lock.current || !mutation.data) return;
    lock.current = true; setBusy(true); setError(null);
    try { await establishSession(mutation.data); }
    finally { lock.current = false; setBusy(false); }
  };
  const fields = ['name', 'email', 'password', 'password_confirmation'] as const;
  return <ScrollView className="flex-1 bg-background px-6 py-12" keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
    <View className="mt-8 mb-8 gap-3">
      <Text variant="h1">{t('registration.title')}</Text>
      <Text muted>{t('registration.description')}</Text>
    </View>
    <GlassCard className="p-6"><View className="gap-4">
      {mutation.isSuccess ? <>
        <Text>{t('registration.created')}</Text>
        {error ? <Text accessibilityRole="alert" color="#FF5A5A">{t(error)}</Text> : null}
        <GlassButton loading={busy} accessibilityRole="button" onPress={() => void retrySession()}>{t('registration.retrySession')}</GlassButton>
      </> : <>
        {fields.map(name => <Controller key={name} name={name} control={control} render={({ field: { value, onChange, onBlur } }) => <Input
          label={t(`registration.${name}`)} value={value} onChangeText={onChange} onBlur={onBlur} editable={!busy}
          autoCapitalize={name === 'name' ? 'words' : 'none'} keyboardType={name === 'email' ? 'email-address' : 'default'}
          autoComplete={name === 'name' ? 'name' : name === 'email' ? 'email' : 'new-password'}
          secureTextEntry={name === 'password' || name === 'password_confirmation'}
          error={errors[name]?.message ? t(errors[name].message) : undefined} />} />)}
        <Text variant="caption" muted>{t('recovery.passwordHint')}</Text>
        {error ? <Text accessibilityRole="alert" color="#FF5A5A">{t(error)}</Text> : null}
        <GlassButton loading={busy} accessibilityRole="button" onPress={() => void submit()}>{t('registration.submit')}</GlassButton>
      </>}
    </View></GlassCard>
    <GlassButton className="mt-4 mb-12" variant="outline" disabled={busy} onPress={() => router.replace('/(auth)/login')}>{t('registration.backToLogin')}</GlassButton>
  </ScrollView>;
}
