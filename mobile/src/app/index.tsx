import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { useAuth } from '@/lib/auth';

export default function IndexRoute() {
  const { ready, user } = useAuth();
  if (!ready) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={Colors.light.primary} size="large" />
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
    backgroundColor: Colors.light.background,
  },
});
