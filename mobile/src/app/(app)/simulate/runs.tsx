import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { AppScreen } from '@/components/ui/app-screen';
import { ContentState } from '@/components/ui/content-state';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { apiRequest } from '@/lib/api';

interface Run {
  id: string;
  scenario_id: string;
  scenario_name: string;
  outcome: { yieldKg: number; baselineYieldKg: number; waterLiters: number; baselineWaterLiters: number; cost: number; baselineCost: number; score: number };
  score: number | string;
  created_at: string;
}

export default function SimulationRunsScreen() {
  const theme = useTheme();
  const [runs, setRuns] = useState<Run[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest<{ runs: Run[] }>('/scenarios/runs')
      .then((response) => setRuns(response.runs))
      .catch((loadError: unknown) => setError(loadError instanceof Error ? loadError.message : 'Unable to load results'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppScreen title="Results" subtitle="Review your recent experiments.">
      {loading ? <ContentState variant="loading" message="Loading results…" /> : null}
      {error ? <ContentState variant="error" title="Unable to load results" message={error} /> : null}
      {!loading && !runs.length && !error ? <ContentState variant="empty" title="No results yet" message="Run a scenario to start building your learning history." /> : null}
      {runs.map((run) => (
        <Pressable
          key={run.id}
          onPress={() => router.push({
            pathname: '/(app)/simulate/results',
            params: {
              runId: run.id,
              score: String(run.score),
              yieldKg: String(run.outcome.yieldKg),
              baselineYieldKg: String(run.outcome.baselineYieldKg),
              waterLiters: String(run.outcome.waterLiters),
              baselineWaterLiters: String(run.outcome.baselineWaterLiters),
              cost: String(run.outcome.cost),
              baselineCost: String(run.outcome.baselineCost),
            },
          })}
          style={[styles.run, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          <View style={styles.runHeading}>
            <ThemedText type="smallBold">{run.scenario_name}</ThemedText>
            <ThemedText type="smallBold" style={{ color: theme.primaryText }}>{Number(run.score)} / 100</ThemedText>
          </View>
          <ThemedText type="small" themeColor="textSecondary">{new Date(run.created_at).toLocaleString()}</ThemedText>
        </Pressable>
      ))}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  run: { padding: Spacing.three, borderRadius: 16, borderWidth: 1, gap: Spacing.two },
  runHeading: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.two },
});
