import { Redirect, Stack } from 'expo-router';

import { useAuth } from '@/lib/auth';

export default function AuthLayout() {
  const { ready, user } = useAuth();
  if (!ready) return null;
  if (user) return <Redirect href="/(app)" />;
  return <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />;
}
