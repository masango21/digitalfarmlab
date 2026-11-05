import { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { AppScreen } from '@/components/ui/app-screen';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { apiRequest } from '@/lib/api';

interface LeaderboardRow {
  rank: number;
  display_name: string;
  score: number;
  consent: boolean;
}

interface LeaderboardResponse {
  leaderboard: {
    scope: string;
    rows: LeaderboardRow[];
    total: number;
  };
}

export default function LeaderboardScreen() {
  const theme = useTheme();
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [scope, setScope] = useState('cohort');
  const [error, setError] = useState('');

  useEffect(() => {
    apiRequest<LeaderboardResponse>('/leaderboard?scope=cohort')
      .then((response) => {
        setRows(response.leaderboard.rows);
        setScope(response.leaderboard.scope);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Unable to load leaderboard.');
      });
  }, []);

  return (
    <AppScreen
      title="Leaderboard"
      subtitle="Ranks are limited to consented learners and cohort-approved scope.">
      <View style={[styles.banner, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}> 
        <ThemedText type="smallBold">Scope: {scope}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Only learners who have consented to sharing are shown in the ranking.
        </ThemedText>
      </View>

      {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}

      {rows.length === 0 ? (
        <ThemedText type="small" themeColor="textSecondary">No leaderboards are available yet.</ThemedText>
      ) : (
        <View style={styles.list}>
          {rows.map((row) => (
            <View
              key={`${row.display_name}-${row.rank}`}
              style={[
                styles.row,
                { backgroundColor: theme.backgroundElement, borderColor: theme.border },
              ]}>
              <ThemedText type="smallBold">#{row.rank}</ThemedText>
              <View style={styles.meta}>
                <ThemedText type="smallBold">{row.display_name}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {row.consent ? 'Shared score' : 'Hidden score'}
                </ThemedText>
              </View>
              <ThemedText type="smallBold" style={{ color: theme.primaryText }}>{row.score.toFixed(1)}</ThemedText>
            </View>
          ))}
        </View>
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderWidth: 1,
    borderRadius: 18,
    padding: Spacing.three,
    gap: Spacing.one,
    marginBottom: Spacing.three,
  },
  list: {
    gap: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: 1,
    borderRadius: 18,
    padding: Spacing.three,
  },
  meta: {
    flex: 1,
    gap: Spacing.half,
  },
  error: {
    color: '#B45048',
    marginBottom: Spacing.two,
  },
});
