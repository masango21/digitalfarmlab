import MapView, { Marker } from 'react-native-maps';
import { StyleSheet } from 'react-native';

import type { FarmMapProps, MapLocation } from '@/components/ui/map-view';

export function FarmMap({ farms, fields = [] }: FarmMapProps) {
  const points: (MapLocation & { kind: 'farm' | 'field' })[] = [
    ...farms.map((farm) => ({ ...farm, kind: 'farm' as const })),
    ...fields.map((field) => ({ ...field, kind: 'field' as const })),
  ];

  const validPoints = points.filter((point) =>
    Number.isFinite(Number(point.latitude)) && Number.isFinite(Number(point.longitude)),
  );

  if (!validPoints.length) {
    return (
      <MapView style={styles.map} initialRegion={{ latitude: 0, longitude: 0, latitudeDelta: 0.3, longitudeDelta: 0.3 }} />
    );
  }

  const latitude = validPoints.reduce((sum, point) => sum + Number(point.latitude), 0) / validPoints.length;
  const longitude = validPoints.reduce((sum, point) => sum + Number(point.longitude), 0) / validPoints.length;

  return (
    <MapView
      style={styles.map}
      initialRegion={{ latitude, longitude, latitudeDelta: 0.3, longitudeDelta: 0.3 }}>
      {validPoints.map((point) => (
        <Marker
          key={`${point.kind}-${point.id}`}
          coordinate={{ latitude: Number(point.latitude), longitude: Number(point.longitude) }}
          title={point.kind === 'field' ? `Field · ${point.name}` : point.name}
          description={point.location ?? undefined}
          pinColor={point.kind === 'farm' ? '#2E7D32' : '#C58B23'}
        />
      ))}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: { height: 430, width: '100%', borderRadius: 18 },
});
