import { useEffect, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { GlassButton, GlassCard, Input, Text } from '@/components/ui';
import { passwordRecoveryApi, recoveryEmailSchema, recoveryVerifySchema, recoveryResetSchema, recoveryErrorKey } from './passwordRecovery';
import { useAuthStore } from '../store/useAuthStore';
import { useRecoveryRequest, useRecoveryCooldown, recoveryCooldownKey, remainingCooldown, formatCooldown } from './useRecoveryCooldown';
import type { RecoveryCooldown } from './passwordRecovery';
import type { RecoveryReset, RecoveryVerify } from './passwordRecovery';

export default function PasswordRecoveryScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const verification = useMutation({ mutationFn: passwordRecoveryApi.verify, gcTime: 0 });
  const clearVerification = verification.reset;
  useEffect(() => () => clearVerification(), [clearVerification]);
  const [email, setEmail] = useState<string | null>(null);
  const emailDraft = useRef('');
  const remaining = useRecoveryCooldown(email ?? '');
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  return <ScrollView className="flex-1 bg-background px-6 py-12" keyboardShouldPersistTaps="handled">
    <View className="mt-8 mb-8 gap-3">
      <Text variant="h1">{t(done ? 'recovery.successTitle' : 'recovery.title')}</Text>
      <Text muted>{t(done ? 'recovery.successDescription' : verification.isSuccess ? 'recovery.passwordDescription' : email ? 'recovery.codeDescription' : 'recovery.description')}</Text>
    </View>
    {done ? null : email
      ? verification.isSuccess
        ? <ResetForm email={email} resetToken={verification.data.data.reset_token} onDone={() => { setDone(true); verification.reset(); }} onBusy={setBusy} />
        : <CodeForm email={email} onVerify={async input => { await verification.mutateAsync(input); }} onBusy={setBusy} error={verification.isError ? recoveryErrorKey(verification.error) : null} />
      : <RequestForm initialEmail={emailDraft.current} onSent={value => { emailDraft.current = value; setEmail(value); }} onBusy={setBusy} />}
    {email && !done && remaining > 0 ? <Text className="mt-4" muted>{t('recovery.resendWait', { time: formatCooldown(remaining) })}</Text> : null}
    {email && !done ? <GlassButton className="mt-4" variant="outline" disabled={busy} onPress={() => { verification.reset(); setEmail(null); }}>{t('recovery.requestAnother')}</GlassButton> : null}
    <GlassButton className="mt-4 mb-12" variant="outline" disabled={busy} onPress={() => router.replace('/(auth)/login')}>{t('recovery.backToLogin')}</GlassButton>
  </ScrollView>;
}
function RequestForm({ initialEmail, onSent, onBusy }: { initialEmail: string; onSent: (email: string) => void; onBusy: (busy: boolean) => void }) {
  const { t } = useTranslation();
  const lock = useRef(false);
  const client = useQueryClient();
  const { control, handleSubmit, watch, formState: { errors } } = useForm<z.infer<typeof recoveryEmailSchema>>({ resolver: zodResolver(recoveryEmailSchema), defaultValues: { email: initialEmail } });
  const enteredEmail = watch('email').trim().toLowerCase();
  const remaining = useRecoveryCooldown(enteredEmail);
  const mutation = useRecoveryRequest();
  const submit = handleSubmit(async data => {
    if (lock.current || remainingCooldown(client.getQueryData<RecoveryCooldown>(recoveryCooldownKey(data.email)))) return;
    lock.current = true; onBusy(true);
    try { await mutation.mutateAsync(data); onSent(data.email); }
    catch { /* Mutation owns the failure displayed below. */ }
    finally { lock.current = false; onBusy(false); }
  });
  return <GlassCard className="p-6"><View className="gap-4">
    <Controller control={control} name="email" render={({ field: { value, onChange, onBlur } }) => <Input label={t('auth.emailLabel')} autoCapitalize="none" keyboardType="email-address" autoComplete="email" value={value} onChangeText={onChange} onBlur={onBlur} editable={!mutation.isPending} error={errors.email?.message ? t(errors.email.message) : undefined} />} />
    {mutation.isError ? <Text accessibilityRole="alert" color="#FF5A5A">{t(recoveryErrorKey(mutation.error))}</Text> : null}
    {remaining > 0 ? <Text muted>{t('recovery.resendWait', { time: formatCooldown(remaining) })}</Text> : null}
    <GlassButton disabled={remaining > 0} loading={mutation.isPending} onPress={() => void submit()}>{t('recovery.sendCode')}</GlassButton>
  </View></GlassCard>;
}
function CodeForm({ email, onVerify, onBusy, error }: { email: string; onVerify: (input: RecoveryVerify) => Promise<void>; onBusy: (busy: boolean) => void; error: string | null }) {
  const { t } = useTranslation();
  const lock = useRef(false);
  const [pending, setPending] = useState(false);
  const { control, handleSubmit, formState: { errors } } = useForm<RecoveryVerify>({ resolver: zodResolver(recoveryVerifySchema), defaultValues: { email, code: '' } });
  const submit = handleSubmit(async data => {
    if (lock.current) return;
    lock.current = true; setPending(true); onBusy(true);
    try { await onVerify(data); }
    catch { /* The verification mutation owns the error. */ }
    finally { lock.current = false; setPending(false); onBusy(false); }
  });
  return <GlassCard className="p-6"><View className="gap-4">
    <Text muted>{email}</Text>
    <Controller control={control} name="code" render={({ field: { value, onChange, onBlur } }) => <Input label={t('recovery.codeLabel')} value={value} onChangeText={onChange} onBlur={onBlur}
      keyboardType="number-pad" autoComplete="one-time-code" maxLength={6} editable={!pending} error={errors.code?.message ? t(errors.code.message) : undefined} />} />
    {error ? <Text accessibilityRole="alert" color="#FF5A5A">{t(error)}</Text> : null}
    <GlassButton loading={pending} onPress={() => void submit()}>{t('recovery.verifyCode')}</GlassButton>
  </View></GlassCard>;
}
function ResetForm({ email, resetToken, onDone, onBusy }: { email: string; resetToken: string; onDone: () => void; onBusy: (busy: boolean) => void }) {
  const { t } = useTranslation();
  const client = useQueryClient();
  const [sessionFailed, setSessionFailed] = useState(false);
  const lock = useRef(false);
  const { control, handleSubmit, formState: { errors } } = useForm<RecoveryReset>({ resolver: zodResolver(recoveryResetSchema), defaultValues: { email, reset_token: resetToken, password: '', password_confirmation: '' } });
  const mutation = useMutation({ mutationFn: passwordRecoveryApi.reset, gcTime: 0 });
  const submit = handleSubmit(async data => {
    if (lock.current) return;
    lock.current = true; onBusy(true);
    try {
      const response = await mutation.mutateAsync(data);
      try { client.removeQueries(); await useAuthStore.getState().setSession(response.data.token); onDone(); client.getMutationCache().clear(); }
      catch { setSessionFailed(true); }
    }
    catch { /* Mutation owns the failure displayed below. */ }
    finally { lock.current = false; onBusy(false); }
  });
  return <GlassCard className="p-6"><View className="gap-4">
    <Text muted>{email}</Text>
    {(['password', 'password_confirmation'] as const).map(name => <Controller key={name} control={control} name={name} render={({ field: { value, onChange, onBlur } }) => <Input
      label={t(name === 'password' ? 'recovery.newPassword' : 'recovery.confirmPassword')}
      value={value} onChangeText={onChange} onBlur={onBlur} editable={!mutation.isPending}
      secureTextEntry autoCapitalize="none" autoComplete="new-password"
      error={errors[name]?.message ? t(errors[name].message) : undefined} />} />)}
    <Text variant="caption" muted>{t('recovery.passwordHint')}</Text>
    {mutation.isError ? <Text accessibilityRole="alert" color="#FF5A5A">{t(recoveryErrorKey(mutation.error) === 'recovery.invalidCode' ? 'recovery.verificationExpired' : recoveryErrorKey(mutation.error))}</Text> : null}
    {sessionFailed ? <Text accessibilityRole="alert" color="#FF5A5A">{t('auth.storageError')}</Text> : null}
    <GlassButton disabled={sessionFailed} loading={mutation.isPending} onPress={() => void submit()}>{t('recovery.changePassword')}</GlassButton>
  </View></GlassCard>;
}
