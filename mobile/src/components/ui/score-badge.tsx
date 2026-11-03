import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function ScoreBadge({ score }: { score: number }) {
  const theme = useTheme();
  return (
    <View style={[styles.badge, { backgroundColor: theme.backgroundSelected }]}>
      <ThemedText type="smallBold" style={{ color: theme.primary }}>SIMULATION SCORE</ThemedText>
      <ThemedText style={[styles.score, { color: theme.primary }]}>{score}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">out of 100</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignItems: 'center', padding: Spacing.four, borderRadius: 24, gap: Spacing.one },
  score: { fontSize: 64, lineHeight: 72, fontWeight: '800' },
});
