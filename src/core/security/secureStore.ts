import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'lizto_auth_token';
const ROLE_KEY = 'lizto_active_role';

// En memoria para entornos web / test donde SecureStore no está disponible
let memoryTokenStore: string | null = null;
let memoryRoleStore: string | null = null;

export const saveToken = async (token: string): Promise<void> => {
  if (Platform.OS === 'web') {
    memoryTokenStore = token;
    return;
  }
  try {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  } catch (error) {
    memoryTokenStore = token;
  }
};

export const getToken = async (): Promise<string | null> => {
  if (Platform.OS === 'web') {
    return memoryTokenStore;
  }
  try {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    return token ?? memoryTokenStore;
  } catch (error) {
    return memoryTokenStore;
  }
};

export const removeToken = async (): Promise<void> => {
  memoryTokenStore = null;
  if (Platform.OS === 'web') {
    return;
  }
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch (error) {
    // Ignore delete error if key did not exist
  }
};

export const saveActiveRole = async (role: 'provider' | 'client'): Promise<void> => {
  if (Platform.OS === 'web') {
    memoryRoleStore = role;
    return;
  }
  try {
    await SecureStore.setItemAsync(ROLE_KEY, role);
  } catch {
    memoryRoleStore = role;
  }
};

export const getActiveRole = async (): Promise<'provider' | 'client' | null> => {
  if (Platform.OS === 'web') {
    return memoryRoleStore as 'provider' | 'client' | null;
  }
  try {
    const role = await SecureStore.getItemAsync(ROLE_KEY);
    return (role as 'provider' | 'client') ?? (memoryRoleStore as 'provider' | 'client' | null);
  } catch {
    return memoryRoleStore as 'provider' | 'client' | null;
  }
};
