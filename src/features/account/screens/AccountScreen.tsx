import { useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { Screen } from '@/components/layout/Screen';
import { SignInPrompt } from '@/components/layout/SignInPrompt';
import { Text, GlassButton, ErrorState } from '@/components/ui';
import { useMe } from '@/features/auth/api/useMe';
import { authApi } from '@/features/auth/api/authApi';
import { useAuthStore } from '@/features/auth/store/useAuthStore';

export default function AccountScreen() {
  const { t } = useTranslation();
  const { token, activeRole, setActiveRole, logout } = useAuthStore();
  const query = useMe();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const signOut = async () => {
    setBusy(true); setFailed(false);
    try { await authApi.logout(); await logout(); queryClient.clear(); }
    catch { setFailed(true); }
    finally { setBusy(false); }
  };
  return <Screen title={t('account.title')} subtitle={t('account.description')}>
    {!token ? <SignInPrompt /> : query.isPending ? <ActivityIndicator color="#7C5CFF" accessibilityLabel={t('common.loading')} /> : query.isError ?
      <ErrorState title={t('common.error')} message={t('catalog.errorDescription')} onRetry={() => void query.refetch()} /> : query.data ? <>
        <View className="p-6 bg-card border border-border rounded-2xl gap-3">
          <Text variant="h2" weight="bold">{query.data.name}</Text>
          <Text muted>{query.data.email}</Text>
          {query.data.phone ? <Text muted>{query.data.phone}</Text> : null}
          <Text color="#A8FF35" variant="caption">{t(activeRole === 'provider' ? 'auth.roleProvider' : 'auth.roleClient')}</Text>
        </View>
        {query.data.roles.includes('client') && query.data.roles.includes('provider') ?
          <GlassButton variant="outline" onPress={() => { setFailed(false); void setActiveRole(activeRole === 'provider' ? 'client' : 'provider').catch(() => setFailed(true)); }}>{t(activeRole === 'provider' ? 'account.switchClient' : 'account.switchProvider')}</GlassButton> : null}
      </> : null}
    {failed ? <Text color="#FF5A5A">{t('account.actionError')}</Text> : null}
    {token ? <GlassButton variant="danger" loading={busy} onPress={() => void signOut()}>{t('common.logout')}</GlassButton> : null}
  </Screen>;
}
