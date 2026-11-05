import { Link, router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { AppScreen } from '@/components/ui/app-screen';
import { ContentState } from '@/components/ui/content-state';
import { FarmCard, type Farm } from '@/components/ui/farm-card';
import { PrimaryButton } from '@/components/ui/primary-button';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { apiRequest } from '@/lib/api';

export default function FarmsScreen() {
  const theme = useTheme();
  const [farms, setFarms] = useState<Farm[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    let active = true;
    apiRequest<{ farms: Farm[] }>('/farms')
      .then((response) => {
        if (!active) return;
        setFarms(response.farms);
        setError('');
      })
      .catch((loadError: unknown) => {
        if (active) setError(loadError instanceof Error ? loadError.message : 'Unable to load farms');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []));

  return (
    <AppScreen
      title="My farms"
      subtitle="Keep your fields and farm data together."
      action={<Link href="/(app)/farm/create" style={[styles.addLink, { color: theme.primaryText }]}>+ Add</Link>}>
      {loading ? <ContentState variant="loading" message="Loading farms…" /> : null}
      {error ? <ContentState variant="error" title="Unable to load farms" message={error} /> : null}
      {!loading && !farms.length && !error ? (
        <View style={[styles.empty, { backgroundColor: theme.card }]}>
          <ThemedText type="subtitle" style={styles.emptyTitle}>Start with a farm</ThemedText>
          <ThemedText themeColor="textSecondary">Add your first farm to keep fields and simulation results organized.</ThemedText>
          <PrimaryButton onPress={() => router.push('/(app)/farm/create')}>Add a farm</PrimaryButton>
        </View>
      ) : null}
      {farms.map((farm) => (
        <FarmCard
          key={farm.id}
          farm={farm}
          onPress={() => router.push({ pathname: '/(app)/farm/[id]', params: { id: farm.id } })}
        />
      ))}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  addLink: { fontWeight: '700' },
  empty: { gap: Spacing.three, padding: Spacing.four, borderRadius: 20 },
  emptyTitle: { fontSize: 24, lineHeight: 30 },
});
