import { router } from 'expo-router';
import { useEffect, useState } from 'react';

import { ThemedText } from '@/components/themed-text';
import { AppScreen } from '@/components/ui/app-screen';
import { FarmMap } from '../../components/ui/map-view';
import type { Farm } from '@/components/ui/farm-card';
import { useTheme } from '@/hooks/use-theme';
import { apiRequest } from '@/lib/api';

type GeocodedFarm = Farm & { latitude: number | string; longitude: number | string };
type GeocodedField = {
  id: string;
  name: string;
  latitude: number | string;
  longitude: number | string;
  location?: string | null;
};

export default function FarmMapScreen() {
  const theme = useTheme();
  const [farms, setFarms] = useState<GeocodedFarm[]>([]);
  const [fields, setFields] = useState<GeocodedField[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadLocations() {
      try {
        const { farms: items } = await apiRequest<{ farms: Farm[] }>('/farms');
        const geocodedFarms = items.filter(
          (farm): farm is GeocodedFarm => farm.latitude !== null && farm.latitude !== undefined
            && farm.longitude !== null && farm.longitude !== undefined,
        );

        const fieldLocations = await Promise.all(items.map(async (farm) => {
          if (farm.latitude == null || farm.longitude == null) {
            return [] as GeocodedField[];
          }

          try {
            const response = await apiRequest<{ fields: { id: string; name: string; latitude: number | string | null; longitude: number | string | null }[] }>(`/farms/${farm.id}`);
            return (response.fields ?? [])
              .filter((field) => field.latitude != null && field.longitude != null)
              .map((field) => ({
                id: field.id,
                name: field.name,
                latitude: field.latitude as number | string,
                longitude: field.longitude as number | string,
                location: farm.location,
              }));
          } catch {
            return [] as GeocodedField[];
          }
        }));

        if (!active) return;
        setFarms(geocodedFarms);
        setFields(fieldLocations.flat());
        setError('');
      } catch (loadError: unknown) {
        if (!active) return;
        setError(loadError instanceof Error ? loadError.message : 'Unable to load farm locations');
      }
    }

    void loadLocations();
    return () => {
      active = false;
    };
  }, []);

  const hasLocations = farms.length > 0 || fields.length > 0;

  return (
    <AppScreen title="Farm map" subtitle="Pins appear for farms and field plots with coordinates.">
      {error ? <ThemedText style={{ color: theme.error }}>{error}</ThemedText> : null}
      {hasLocations ? (
        <FarmMap farms={farms} fields={fields} />
      ) : (
        <>
          <ThemedText themeColor="textSecondary">No farm or field coordinates yet. Add latitude and longitude when creating a farm or field to place a pin.</ThemedText>
          <ThemedText accessibilityRole="button" onPress={() => router.push('/(app)/farm/create')} style={{ color: theme.primaryText, fontWeight: '700' }}>
            Add a farm
          </ThemedText>
        </>
      )}
    </AppScreen>
  );
}
