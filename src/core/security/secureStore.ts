import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'lizto_auth_token';
const roleKey = (userId: string) => `lizto_active_role.${userId}`;
const webRoles = new Map<string, 'provider' | 'client'>();

export async function saveToken(token: string): Promise<void> {
  if (Platform.OS === 'web') throw new Error('SECURE_STORE_UNAVAILABLE');
  await SecureStore.setItemAsync(TOKEN_KEY, token);
  if (await SecureStore.getItemAsync(TOKEN_KEY) !== token) throw new Error('SECURE_STORE_WRITE_FAILED');
}

export async function getToken(): Promise<string | null> {
  if (Platform.OS === 'web') return null;
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function removeToken(): Promise<void> {
  if (Platform.OS === 'web') return;
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  if (await SecureStore.getItemAsync(TOKEN_KEY) !== null) throw new Error('SECURE_STORE_DELETE_FAILED');
}

export async function saveActiveRole(userId: string, role: 'provider' | 'client'): Promise<void> {
  if (Platform.OS === 'web') { webRoles.set(userId, role); return; }
  await SecureStore.setItemAsync(roleKey(userId), role);
  if (await SecureStore.getItemAsync(roleKey(userId)) !== role) throw new Error('SECURE_STORE_WRITE_FAILED');
}

export async function getActiveRole(userId: string): Promise<'provider' | 'client' | null> {
  const role = Platform.OS === 'web' ? webRoles.get(userId) : await SecureStore.getItemAsync(roleKey(userId));
  return role === 'provider' || role === 'client' ? role : null;
}
