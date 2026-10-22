import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { skipToken, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { HttpError } from '@/core/api/httpClient';
import { passwordRecoveryApi, recoveryCooldownResponseSchema } from './passwordRecovery';
import type { RecoveryCooldown } from './passwordRecovery';

export const recoveryCooldownKey = (email: string) => ['auth', 'recovery-cooldown', email];
export function remainingCooldown(data: RecoveryCooldown | undefined, now = Date.now()) {
  return data ? Math.max(0, Math.ceil((Date.parse(data.retry_at) - now) / 1000)) : 0;
}
export function useRecoveryCooldown(email: string) {
  const { data } = useQuery<RecoveryCooldown>({ queryKey: recoveryCooldownKey(email), queryFn: skipToken, staleTime: Infinity });
  const [clock, setClock] = useState(Date.now);
  useEffect(() => {
    if (!data) return;
    let timer: ReturnType<typeof setInterval> | undefined;
    const stop = () => { if (timer) clearInterval(timer); timer = undefined; };
    const tick = () => { setClock(Date.now()); if (!remainingCooldown(data)) stop(); };
    const start = () => { stop(); tick(); if (remainingCooldown(data)) timer = setInterval(tick, 1000); };
    if (AppState.currentState !== 'background') start();
    const subscription = AppState.addEventListener('change', state => { if (state === 'active') start(); else stop(); });
    return () => { stop(); subscription.remove(); };
  }, [data?.retry_at]);
  return remainingCooldown(data, clock);
}
export function useRecoveryRequest() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: passwordRecoveryApi.request,
    onSuccess: (response, input) => { client.setQueryData(recoveryCooldownKey(input.email), response.data); },
    onError: (error, input) => {
      if (!(error instanceof HttpError)) return;
      const parsed = recoveryCooldownResponseSchema.safeParse(error.body);
      if (parsed.success) client.setQueryData(recoveryCooldownKey(input.email), parsed.data.data);
    },
  });
}
export function formatCooldown(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}
