import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

export interface MapLocation {
  id: string;
  name: string;
  latitude: number | string;
  longitude: number | string;
  location?: string | null;
}

export interface FarmMapProps {
  farms: MapLocation[];
  fields?: MapLocation[];
}

export function FarmMap({ farms, fields = [] }: FarmMapProps) {
  return (
    <View style={styles.map}>
      <ThemedText type="smallBold">Approximate locations</ThemedText>
      {farms.map((farm) => (
        <View key={farm.id} style={styles.row}>
          <ThemedText type="smallBold">{farm.name}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Farm · {farm.location ? `${farm.location} · ` : ''}{farm.latitude}, {farm.longitude}
          </ThemedText>
        </View>
      ))}
      {fields.map((field) => (
        <View key={field.id} style={styles.row}>
          <ThemedText type="smallBold">{field.name}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">Field · {field.latitude}, {field.longitude}</ThemedText>
        </View>
      ))}
      <ThemedText type="small" themeColor="textSecondary">Locations are approximate, not surveyed boundaries.</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  map: { minHeight: 220, padding: Spacing.three, borderRadius: 18, backgroundColor: '#FFFFFF', gap: Spacing.two },
  row: { gap: Spacing.one, paddingBottom: Spacing.two, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#D5E4D2' },
});
