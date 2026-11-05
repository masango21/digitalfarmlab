import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useAuth } from '@/lib/auth';
import { useTheme } from '@/hooks/use-theme';

export default function IndexRoute() {
  const { ready, user } = useAuth();
  const theme = useTheme();
  if (!ready) {
    return (
      <View style={[styles.loading, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.accent} size="large" />
      </View>
    );
  }
  return <Redirect href={user ? '/(app)' : '/(auth)/onboarding'} />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
