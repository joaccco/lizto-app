import { useEffect, useMemo, useRef, useState } from 'react';
import type { MutableRefObject } from 'react';
import { Image, Platform, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { GlassButton, Text } from '@/components/ui';
import { useAuthStore } from '../store/useAuthStore';
import { ME_QUERY_KEY, useMe } from '../api/useMe';
import type { User } from '../schemas/authSchema';
import { createOAuthBackend } from '../oauth/oauthApi';
import { createOAuthFlow, createOAuthLinkFlow } from '../oauth/oauthFlow';
import type { OAuthProvider } from '../oauth/oauthFlow';
import { getGoogleOAuthConfig, requireFacebookOAuthConfig } from '../oauth/oauthConfig';
import { authorizeNativeOAuth } from '../oauth/nativeOAuth';
import { oauthErrorKey } from '../oauth/oauthError';

interface Props {
  mode: 'login' | 'link';
  lock: MutableRefObject<boolean>;
  disabled?: boolean;
  onBusyChange?: (busy: boolean) => void;
}

export function OAuthButtons({ mode, lock, disabled = false, onBusyChange }: Props) {
  const { t } = useTranslation();
  const client = useQueryClient();
  const me = useMe(mode === 'link');
  const [busy, setBusy] = useState<OAuthProvider | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [linked, setLinked] = useState(false);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => {
    if (!linked) return;
    const timer = setTimeout(() => setLinked(false), 30_000);
    return () => clearTimeout(timer);
  }, [linked]);
  const run = useMemo(() => mode === 'login'
    ? createOAuthFlow(createOAuthBackend(mode), authorizeNativeOAuth)
    : createOAuthLinkFlow(createOAuthBackend(mode), authorizeNativeOAuth), [mode]);
  const providers = useMemo(() => {
    const result: OAuthProvider[] = [];
    if (Platform.OS !== 'ios' && Platform.OS !== 'android') return result;
    try { getGoogleOAuthConfig(); result.push('google'); } catch { /* Not configured in this build. */ }
    try { requireFacebookOAuthConfig(); result.push('facebook'); } catch { /* Not configured in this build. */ }
    return result;
  }, []);

  const authorize = async (provider: OAuthProvider) => {
    if (lock.current || disabled || (mode === 'link' && me.data?.linked_oauth_providers?.includes(provider))) return;
    lock.current = true;
    const originalToken = useAuthStore.getState().token;
    setBusy(provider); setError(null); setLinked(false); onBusyChange?.(true);
    try {
      const result = await run(provider);
      if (!mounted.current || useAuthStore.getState().token !== originalToken || result.status !== 'success') return;
      if ('session' in result) {
        client.clear();
        await useAuthStore.getState().setSession(result.session.data.token);
      } else {
        client.setQueryData<User>(ME_QUERY_KEY, result.user);
        await client.invalidateQueries({ queryKey: ME_QUERY_KEY });
        if (mounted.current) setLinked(true);
      }
    } catch (failure) {
      if (mounted.current && useAuthStore.getState().token === originalToken) setError(oauthErrorKey(failure));
    } finally {
      lock.current = false;
      if (mounted.current) { setBusy(null); onBusyChange?.(false); }
    }
  };
  if (!providers.length) return null;
  return <View className="gap-3 mt-5">
    <Text variant="caption">{t(mode === 'login' ? 'oauth.signInTitle' : 'oauth.linkTitle')}</Text>
    {mode === 'link' ? <Text muted variant="caption">{t('oauth.linkExplanation')}</Text> : null}
    {providers.map(provider => {
      const isLinked = mode === 'link' && me.data?.linked_oauth_providers?.includes(provider) === true;
      return <OAuthProviderButton key={provider} provider={provider}
      onPress={() => void authorize(provider)} disabled={disabled || busy !== null || isLinked} loading={busy === provider}
      label={t(isLinked ? (provider === 'google' ? 'oauth.googleLinked' : 'oauth.facebookLinked') : provider === 'google'
        ? (mode === 'login' ? 'oauth.google' : 'oauth.linkGoogle')
        : (mode === 'login' ? 'oauth.facebook' : 'oauth.linkFacebook'))} />;
    })}
    {error ? <Text accessibilityRole="alert" color="#FF5A5A">{t(error)}</Text> : null}
    {linked ? <Text accessibilityLiveRegion="polite">{t('oauth.linked')}</Text> : null}
  </View>;
}

function OAuthProviderButton({ provider, onPress, disabled, loading, label }: { provider: OAuthProvider; onPress: () => void; disabled: boolean; loading: boolean; label: string }) {
  return <GlassButton variant="outline" onPress={onPress} disabled={disabled} loading={loading}
    accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled: disabled || loading, busy: loading }}
    style={{ backgroundColor: '#131314', borderColor: '#8E918F', minHeight: 48 }}>
    <View className="flex-row items-center justify-center gap-3">
      <Image source={provider === 'google' ? require('../../../../assets/google-g.png') : require('../../../../assets/facebook-f.png')}
        style={{ width: 20, height: 20 }} resizeMode="contain" accessible={false} />
      <Text weight="semibold" color="#E3E3E3">{label}</Text>
    </View>
  </GlassButton>;
}
