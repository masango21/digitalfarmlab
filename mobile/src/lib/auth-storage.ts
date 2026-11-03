import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const ACCESS_TOKEN_KEY = 'digitalfarmlab.accessToken';
const REFRESH_TOKEN_KEY = 'digitalfarmlab.refreshToken';
const USER_KEY = 'digitalfarmlab.user';
let onSessionInvalidated: (() => void) | undefined;

async function getValue(key: string) {
  if (Platform.OS === 'web') {
    return typeof window === 'undefined' ? null : window.localStorage.getItem(key);
  }
  return SecureStore.getItemAsync(key);
}

async function setValue(key: string, value: string) {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') window.localStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function removeValue(key: string) {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') window.localStorage.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

export async function getAccessToken() {
  return getValue(ACCESS_TOKEN_KEY);
}

export async function getRefreshToken() {
  return getValue(REFRESH_TOKEN_KEY);
}

export async function getStoredUser() {
  return getValue(USER_KEY);
}

export async function storeSession(accessToken: string, refreshToken: string, user: string) {
  await Promise.all([
    setValue(ACCESS_TOKEN_KEY, accessToken),
    setValue(REFRESH_TOKEN_KEY, refreshToken),
    setValue(USER_KEY, user),
  ]);
}

export async function clearStoredSession() {
  await Promise.all([
    removeValue(ACCESS_TOKEN_KEY),
    removeValue(REFRESH_TOKEN_KEY),
    removeValue(USER_KEY),
  ]);
}

export async function invalidateStoredSession() {
  await clearStoredSession();
  onSessionInvalidated?.();
}

export function listenForSessionInvalidation(listener: () => void) {
  onSessionInvalidated = listener;
  return () => {
    if (onSessionInvalidated === listener) onSessionInvalidated = undefined;
  };
}
