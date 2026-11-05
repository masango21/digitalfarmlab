import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import type { FarmMapProps } from '@/components/ui/map-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function FarmMap({ farms, fields = [] }: FarmMapProps) {
  const theme = useTheme();
  return (
    <View style={[styles.map, { backgroundColor: theme.card }]}>
      <ThemedText type="smallBold">Approximate locations</ThemedText>
      {farms.map((farm) => (
        <View key={farm.id} style={[styles.row, { borderBottomColor: theme.border }]}>
          <ThemedText type="smallBold">{farm.name}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Farm · {farm.location ? `${farm.location} · ` : ''}{farm.latitude}, {farm.longitude}
          </ThemedText>
        </View>
      ))}
      {fields.map((field) => (
        <View key={field.id} style={[styles.row, { borderBottomColor: theme.border }]}>
          <ThemedText type="smallBold">{field.name}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">Field · {field.latitude}, {field.longitude}</ThemedText>
        </View>
      ))}
      <ThemedText type="small" themeColor="textSecondary">Locations are approximate, not surveyed boundaries.</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  map: { minHeight: 220, padding: Spacing.three, borderRadius: 18, gap: Spacing.two },
  row: { gap: Spacing.one, paddingBottom: Spacing.two, borderBottomWidth: StyleSheet.hairlineWidth },
});
