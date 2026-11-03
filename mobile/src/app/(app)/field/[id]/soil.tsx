import { useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { AppScreen } from '@/components/ui/app-screen';
import { PrimaryButton } from '@/components/ui/primary-button';
import { Colors, Spacing } from '@/constants/theme';
import { apiRequest } from '@/lib/api';
import {
  measurementSourceLabel,
  soilMeasurementLabel,
  soilMeasurementTypes,
  type SoilMeasurement,
} from '@/lib/field-records';
import { useTheme } from '@/hooks/use-theme';

export default function FieldSoilScreen() {
  const theme = useTheme();
  const { id, fieldName } = useLocalSearchParams<{ id: string; fieldName?: string }>();
  const [measurements, setMeasurements] = useState<SoilMeasurement[]>([]);
  const [measurementType, setMeasurementType] = useState<string>('soil_moisture');
  const [value, setValue] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const selectedType = soilMeasurementTypes.find((type) => type.value === measurementType)
    ?? soilMeasurementTypes[0];

  useFocusEffect(useCallback(() => {
    let active = true;
    apiRequest<{ measurements: SoilMeasurement[] }>(`/fields/${id}/soil-measurements`)
      .then(({ measurements: records }) => {
        if (!active) return;
        setMeasurements(records);
        setError('');
      })
      .catch((loadError: unknown) => {
        if (active) setError(loadError instanceof Error ? loadError.message : 'Unable to load soil records');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]));

  async function saveMeasurement() {
    setSaving(true);
    setError('');
    try {
      const { measurement } = await apiRequest<{ measurement: SoilMeasurement }>(`/fields/${id}/soil-measurements`, {
        method: 'POST',
        body: JSON.stringify({
          type: measurementType,
          value: value.trim(),
          unit: selectedType.unit,
          notes: notes.trim() || null,
        }),
      });
      setMeasurements((current) => [measurement, ...current]);
      setValue('');
      setNotes('');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save soil measurement');
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppScreen
      title="Soil records"
      subtitle={fieldName ? `Measurements for ${fieldName}` : 'Record field soil conditions over time.'}>
      <View style={[styles.notice, { backgroundColor: theme.backgroundSelected }]}>
        <ThemedText type="smallBold">Manual measurements only</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          This phone cannot measure soil. Add readings from your own observations or appropriate test equipment. New entries are labeled as manually entered.
        </ThemedText>
      </View>

      <View style={styles.form}>
        <ThemedText type="smallBold">Measurement</ThemedText>
        <View style={styles.options}>
          {soilMeasurementTypes.map((type) => {
            const selected = type.value === measurementType;
            return (
              <Pressable
                key={type.value}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                onPress={() => setMeasurementType(type.value)}
                style={[
                  styles.option,
                  { borderColor: selected ? theme.primary : theme.border },
                  selected && { backgroundColor: theme.backgroundSelected },
                ]}>
                <ThemedText type="smallBold">{type.label}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">{type.range}</ThemedText>
              </Pressable>
            );
          })}
        </View>
        <ThemedText type="smallBold">Value ({selectedType.unit})</ThemedText>
        <TextInput
          value={value}
          onChangeText={setValue}
          keyboardType="decimal-pad"
          placeholder={`Enter a value in ${selectedType.unit}`}
          style={styles.input}
        />
        <ThemedText type="smallBold">Notes (optional)</ThemedText>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder="Where and how was this measured?"
          multiline
          maxLength={1000}
          style={[styles.input, styles.multiline]}
        />
        <PrimaryButton onPress={saveMeasurement} disabled={saving || !value.trim()}>
          {saving ? 'Saving…' : 'Record measurement'}
        </PrimaryButton>
      </View>

      {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}
      <ThemedText type="smallBold">Measurement history</ThemedText>
      {loading ? <ThemedText themeColor="textSecondary">Loading measurements…</ThemedText> : null}
      {!loading && !error && measurements.length === 0 ? (
        <ThemedText type="small" themeColor="textSecondary">No measurements recorded for this field.</ThemedText>
      ) : null}
      {soilMeasurementTypes.map((type) => {
        const readings = measurements
          .filter((measurement) => measurement.sensor_type === type.value)
          .slice(0, 6)
          .reverse();
        if (!readings.length) return null;
        const minimum = type.value === 'soil_temperature' ? -30 : 0;
        const maximum = type.value === 'soil_temperature' ? 80
          : type.value === 'soil_ph' ? 14
            : type.value === 'nitrogen' || type.value === 'phosphorus' || type.value === 'potassium' ? 100000 : 100;
        return (
          <View key={type.value} style={styles.chart}>
            <View style={styles.recordHeading}>
              <ThemedText type="smallBold">{type.label} trend</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">{type.range}</ThemedText>
            </View>
            <ThemedText type="small" themeColor="textSecondary">Most recent {readings.length} recorded values; bars use the displayed measurement range.</ThemedText>
            <View style={styles.chartBars}>
              {readings.map((reading) => {
                const numericValue = Number(reading.value);
                const ratio = Math.min(1, Math.max(0, (numericValue - minimum) / (maximum - minimum)));
                const height = Math.max(3, ratio * 62);
                return (
                  <View key={reading.id} style={styles.chartColumn}>
                    <ThemedText type="small" style={styles.chartValue}>{numericValue}</ThemedText>
                    <View style={styles.barTrack}>
                      <View style={[styles.barFill, { height }]} />
                    </View>
                    <ThemedText type="small" themeColor="textSecondary" style={styles.chartDate}>
                      {new Date(reading.recorded_at).toLocaleDateString()}
                    </ThemedText>
                  </View>
                );
              })}
            </View>
          </View>
        );
      })}
      {measurements.map((measurement) => (
        <View key={measurement.id} style={styles.record}>
          <View style={styles.recordHeading}>
            <ThemedText type="smallBold">{soilMeasurementLabel(measurement.sensor_type)}</ThemedText>
            <ThemedText type="smallBold" style={{ color: theme.primary }}>
              {measurement.value} {measurement.unit}
            </ThemedText>
          </View>
          <ThemedText type="small" themeColor="textSecondary">
            {new Date(measurement.recorded_at).toLocaleString()} · {measurementSourceLabel(measurement.source)}
          </ThemedText>
          {measurement.notes ? <ThemedText type="small">{measurement.notes}</ThemedText> : null}
        </View>
      ))}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  notice: { padding: Spacing.three, borderRadius: 16, gap: Spacing.one },
  form: { padding: Spacing.three, borderRadius: 16, backgroundColor: '#FFFFFF', gap: Spacing.two },
  options: { gap: Spacing.two },
  option: { gap: Spacing.one, borderWidth: 1, borderRadius: 14, padding: Spacing.three, backgroundColor: '#FFFFFF' },
  input: { borderWidth: 1, borderColor: Colors.light.border, backgroundColor: '#FFFFFF', padding: Spacing.two, borderRadius: 12, color: Colors.light.text },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  record: { padding: Spacing.three, borderRadius: 16, backgroundColor: '#FFFFFF', gap: Spacing.one },
  recordHeading: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: Spacing.two },
  chart: { padding: Spacing.three, borderRadius: 16, backgroundColor: '#FFFFFF', gap: Spacing.two },
  chartBars: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.two, minHeight: 100 },
  chartColumn: { flex: 1, minWidth: 0, alignItems: 'center', gap: Spacing.one },
  chartValue: { fontSize: 10 },
  barTrack: { height: 64, width: '100%', justifyContent: 'flex-end', alignItems: 'center', backgroundColor: '#E3F2DE', borderRadius: 6, overflow: 'hidden' },
  barFill: { width: '72%', backgroundColor: '#2E7D32', borderTopLeftRadius: 6, borderTopRightRadius: 6 },
  chartDate: { fontSize: 10, textAlign: 'center' },
  error: { color: '#B3261E' },
});
