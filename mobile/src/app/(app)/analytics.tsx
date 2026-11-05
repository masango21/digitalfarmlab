import { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { AppScreen } from '@/components/ui/app-screen';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { apiRequest } from '@/lib/api';

interface ActivitySummary {
  total: number;
  byType: Record<string, number>;
  count: number;
}

interface TrendPoint {
  index: number;
  value: number;
}

interface TrendSnapshot {
  points: TrendPoint[];
  average: number;
  trend: 'up' | 'down' | 'flat';
}

export default function AnalyticsScreen() {
  const theme = useTheme();
  const [summary, setSummary] = useState<ActivitySummary | null>(null);
  const [trend, setTrend] = useState<TrendSnapshot | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    apiRequest<{ summary: ActivitySummary; trend: TrendSnapshot }>('/analytics')
      .then((response) => {
        setSummary(response.summary);
        setTrend(response.trend);
      })
      .catch((loadError: unknown) => {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load analytics.');
      });
  }, []);

  return (
    <AppScreen
      title="Analytics"
      subtitle="Review learner activity totals, trends, and participation patterns from saved farm work.">
      {error ? <ThemedText style={{ color: theme.error }}>{error}</ThemedText> : null}

      {summary ? (
        <View style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}> 
          <ThemedText type="smallBold">Activity summary</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">Total activity score: {summary.total}</ThemedText>
          <View style={styles.typeGrid}>
            {Object.entries(summary.byType).map(([type, value]) => (
              <View key={type} style={[styles.metric, { backgroundColor: theme.backgroundSelected, borderColor: theme.border }]}> 
                <ThemedText type="smallBold">{type}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">{value}</ThemedText>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {trend ? (
        <View style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}> 
          <ThemedText type="smallBold">Trend snapshot</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">Average: {trend.average}</ThemedText>
          <ThemedText type="smallBold" style={{ color: theme.primaryText }}>
            Momentum: {trend.trend}
          </ThemedText>
          <View style={styles.barChart}>
            {trend.points.map((point) => (
              <View key={point.index} style={styles.barColumn}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: Math.max(10, point.value * 1.2),
                      backgroundColor: theme.primary,
                    },
                  ]}
                />
                <ThemedText type="small" themeColor="textSecondary">{point.value}</ThemedText>
              </View>
            ))}
          </View>
        </View>
      ) : null}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 18, padding: Spacing.three, gap: Spacing.two, marginBottom: Spacing.three },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  metric: { minWidth: 96, borderWidth: 1, borderRadius: 12, padding: Spacing.two },
  barChart: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.two, minHeight: 120 },
  barColumn: { flex: 1, alignItems: 'center', gap: Spacing.one },
  bar: { width: '100%', borderRadius: 8, minHeight: 10 },
});
