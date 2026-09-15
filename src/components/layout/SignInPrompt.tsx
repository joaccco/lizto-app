import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { EmptyState } from '@/components/ui';
export function SignInPrompt() {
  const { t } = useTranslation();
  const router = useRouter();
  return <EmptyState title={t('account.signInTitle')} description={t('account.signInDescription')} actionLabel={t('auth.loginButton')} onAction={() => router.push('/(auth)/login')} />;
}
