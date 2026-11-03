import { router } from 'expo-router';
import { useEffect, useState } from 'react';

import { ThemedText } from '@/components/themed-text';
import { AppScreen } from '@/components/ui/app-screen';
import { FarmMap } from '../../components/ui/map-view';
import type { Farm } from '@/components/ui/farm-card';
import { apiRequest } from '@/lib/api';

type GeocodedFarm = Farm & { latitude: number | string; longitude: number | string };

export default function FarmMapScreen() {
  const [farms, setFarms] = useState<GeocodedFarm[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    apiRequest<{ farms: Farm[] }>('/farms')
      .then(({ farms: items }) => setFarms(items.filter(
        (farm): farm is GeocodedFarm => farm.latitude !== null && farm.latitude !== undefined
          && farm.longitude !== null && farm.longitude !== undefined,
      )))
      .catch((loadError: unknown) => setError(loadError instanceof Error ? loadError.message : 'Unable to load farm locations'));
  }, []);

  return (
    <AppScreen title="Farm map" subtitle="Pins appear for farms with coordinates.">
      {error ? <ThemedText>{error}</ThemedText> : null}
      {farms.length ? (
        <FarmMap farms={farms} />
      ) : (
        <>
          <ThemedText themeColor="textSecondary">No farm coordinates yet. Add latitude and longitude when creating a farm to place a pin.</ThemedText>
          <ThemedText accessibilityRole="button" onPress={() => router.push('/(app)/farm/create')} style={{ color: '#2E7D32', fontWeight: '700' }}>
            Add a farm
          </ThemedText>
        </>
      )}
    </AppScreen>
  );
}
