import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface StatCardProps {
  label: string;
  value: string;
  helper?: string;
}

export function StatCard({ label, value, helper }: StatCardProps) {
  const theme = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <ThemedText type="small" themeColor="textSecondary">{label}</ThemedText>
      <ThemedText type="subtitle" style={[styles.value, { color: theme.primaryText }]}>{value}</ThemedText>
      {helper ? <ThemedText type="small" themeColor="textSecondary">{helper}</ThemedText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, minWidth: 140, padding: Spacing.three, borderRadius: 18, borderWidth: 1, gap: Spacing.one },
  value: { fontSize: 28, lineHeight: 34 },
});
