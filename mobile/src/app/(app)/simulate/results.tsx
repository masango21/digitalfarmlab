import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { AppScreen } from '@/components/ui/app-screen';
import { PrimaryButton } from '@/components/ui/primary-button';
import { ScoreBadge } from '@/components/ui/score-badge';
import { StatCard } from '@/components/ui/stat-card';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function SimulationResultsScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{
    runId?: string;
    score?: string;
    yieldKg?: string;
    baselineYieldKg?: string;
    waterLiters?: string;
    baselineWaterLiters?: string;
    cost?: string;
    baselineCost?: string;
  }>();
  const score = Number(params.score || 0);
  const yieldKg = Number(params.yieldKg || 0);
  const baselineYieldKg = Number(params.baselineYieldKg || 1);
  const waterLiters = Number(params.waterLiters || 0);
  const baselineWaterLiters = Number(params.baselineWaterLiters || 1);
  const cost = Number(params.cost || 0);
  const baselineCost = Number(params.baselineCost || 1);

  return (
    <AppScreen title="Simulation results" subtitle="A learning estimate for your chosen inputs.">
      <ScoreBadge score={score} />
      <View style={styles.stats}>
        <StatCard label="Yield" value={`${yieldKg.toLocaleString()} kg`} helper={`Baseline ${baselineYieldKg.toLocaleString()} kg`} />
        <StatCard label="Water" value={`${waterLiters.toLocaleString()} L`} helper={`Baseline ${baselineWaterLiters.toLocaleString()} L`} />
        <StatCard label="Cost" value={`$${cost.toLocaleString()}`} helper={`Baseline $${baselineCost.toLocaleString()}`} />
      </View>

      <View style={[styles.chart, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        <ThemedText type="smallBold">Yield compared with baseline</ThemedText>
        <View style={styles.barGroup}>
          <ThemedText type="small">Your scenario</ThemedText>
          <View style={[styles.barTrack, { backgroundColor: theme.backgroundSelected }]}>
            <View style={[styles.bar, { width: `${Math.min(100, (yieldKg / baselineYieldKg) * 100)}%`, backgroundColor: theme.primary }]} />
          </View>
          <ThemedText type="small">{yieldKg.toLocaleString()} kg</ThemedText>
        </View>
        <View style={styles.barGroup}>
          <ThemedText type="small">Baseline</ThemedText>
          <View style={[styles.barTrack, { backgroundColor: theme.backgroundSelected }]}>
            <View style={[styles.bar, { width: '100%', backgroundColor: theme.accent }]} />
          </View>
          <ThemedText type="small">{baselineYieldKg.toLocaleString()} kg</ThemedText>
        </View>
      </View>
      <ThemedText type="small" themeColor="textSecondary">
        These simplified results are for education and are not agronomic advice.
      </ThemedText>
      <PrimaryButton onPress={() => router.replace('/(app)/simulate')}>Try another scenario</PrimaryButton>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  chart: { padding: Spacing.three, borderRadius: 18, borderWidth: 1, gap: Spacing.three },
  barGroup: { gap: Spacing.one },
  barTrack: { height: 14, borderRadius: 12, overflow: 'hidden' },
  bar: { height: '100%', borderRadius: 12 },
});
