import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { productionSystemLabel, type ProductionSystem } from '@/lib/farm';

export interface Farm {
  id: string;
  name: string;
  location: string | null;
  area_hectares: number | string;
  production_system?: ProductionSystem;
  latitude?: number | string | null;
  longitude?: number | string | null;
  image_url: string | null;
  field_count?: number;
}

interface FarmCardProps {
  farm: Farm;
  onPress: () => void;
}

export function FarmCard({ farm, onPress }: FarmCardProps) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }, pressed && styles.pressed]}>
      {farm.image_url ? (
        <Image source={{ uri: farm.image_url }} contentFit="cover" style={styles.image} />
      ) : (
        <View style={[styles.placeholder, { backgroundColor: theme.backgroundSelected }]}>
          <ThemedText style={styles.leaf}>🌱</ThemedText>
        </View>
      )}
      <View style={styles.copy}>
        <ThemedText type="smallBold">{farm.name}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">{farm.location || 'Location not set'}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {Number(farm.area_hectares).toLocaleString()} ha · {farm.field_count ?? 0} fields
        </ThemedText>
        {farm.production_system ? (
          <ThemedText type="small" themeColor="textSecondary">
            {productionSystemLabel(farm.production_system)}
          </ThemedText>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', overflow: 'hidden', borderWidth: 1, borderRadius: 18, minHeight: 112 },
  image: { width: 110, minHeight: 112 },
  placeholder: { width: 110, alignItems: 'center', justifyContent: 'center' },
  leaf: { fontSize: 30 },
  copy: { flex: 1, justifyContent: 'center', padding: Spacing.three, gap: Spacing.one },
  pressed: { opacity: 0.8 },
});
