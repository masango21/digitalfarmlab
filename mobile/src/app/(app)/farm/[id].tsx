import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { AppScreen } from '@/components/ui/app-screen';
import { FarmMap } from '@/components/ui/map-view';
import { PrimaryButton } from '@/components/ui/primary-button';
import { Colors, Spacing } from '@/constants/theme';
import { apiRequest } from '@/lib/api';
import { productionSystems, productionSystemLabel, type ProductionSystem } from '@/lib/farm';
import { measurementSourceLabel, type SoilMeasurement } from '@/lib/field-records';

interface FieldProfile {
  id: string;
  name: string;
  area_hectares: string | number;
  soil_type: string | null;
  latitude: string | number | null;
  longitude: string | number | null;
  crops: { name: string }[];
  sensor_readings: Pick<SoilMeasurement, 'sensor_type' | 'value' | 'unit' | 'source'>[];
}

interface FarmDetail {
  farm: {
    id: string;
    name: string;
    location: string | null;
    area_hectares: string | number;
    latitude: string | number | null;
    longitude: string | number | null;
    production_system: ProductionSystem;
  };
  fields: FieldProfile[];
  livestock: { id: string; species: string; quantity: number }[];
}

interface FieldDraft {
  name: string;
  area: string;
  soilType: string;
  latitude: string;
  longitude: string;
}

const emptyFieldDraft: FieldDraft = { name: '', area: '', soilType: '', latitude: '', longitude: '' };

function coordinateValue(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : value;
}

export default function FarmDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [detail, setDetail] = useState<FarmDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [farmName, setFarmName] = useState('');
  const [location, setLocation] = useState('');
  const [farmArea, setFarmArea] = useState('');
  const [farmLatitude, setFarmLatitude] = useState('');
  const [farmLongitude, setFarmLongitude] = useState('');
  const [productionSystem, setProductionSystem] = useState<ProductionSystem>('mixed');
  const [fieldDraft, setFieldDraft] = useState<FieldDraft>(emptyFieldDraft);
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [savingFarm, setSavingFarm] = useState(false);
  const [savingField, setSavingField] = useState(false);

  const load = useCallback(async () => {
    try {
      const response = await apiRequest<FarmDetail>(`/farms/${id}`);
      setDetail(response);
      setFarmName(response.farm.name);
      setLocation(response.farm.location ?? '');
      setFarmArea(String(response.farm.area_hectares));
      setFarmLatitude(response.farm.latitude == null ? '' : String(response.farm.latitude));
      setFarmLongitude(response.farm.longitude == null ? '' : String(response.farm.longitude));
      setProductionSystem(response.farm.production_system ?? 'mixed');
      setError('');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load farm');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    let active = true;
    apiRequest<FarmDetail>(`/farms/${id}`)
      .then((response) => {
        if (!active) return;
        setDetail(response);
        setFarmName(response.farm.name);
        setLocation(response.farm.location ?? '');
        setFarmArea(String(response.farm.area_hectares));
        setFarmLatitude(response.farm.latitude == null ? '' : String(response.farm.latitude));
        setFarmLongitude(response.farm.longitude == null ? '' : String(response.farm.longitude));
        setProductionSystem(response.farm.production_system ?? 'mixed');
        setError('');
      })
      .catch((loadError: unknown) => {
        if (active) setError(loadError instanceof Error ? loadError.message : 'Unable to load farm');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  async function saveFarmProfile() {
    setSavingFarm(true);
    setError('');
    try {
      await apiRequest(`/farms/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: farmName.trim(),
          location: location.trim() || null,
          areaHectares: farmArea,
          latitude: coordinateValue(farmLatitude),
          longitude: coordinateValue(farmLongitude),
          productionSystem,
        }),
      });
      await load();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save farm profile');
    } finally {
      setSavingFarm(false);
    }
  }

  function startEditingField(field: FieldProfile) {
    setEditingFieldId(field.id);
    setFieldDraft({
      name: field.name,
      area: String(field.area_hectares),
      soilType: field.soil_type ?? '',
      latitude: field.latitude == null ? '' : String(field.latitude),
      longitude: field.longitude == null ? '' : String(field.longitude),
    });
  }

  async function saveField(fieldId: string) {
    setSavingField(true);
    setError('');
    try {
      await apiRequest(`/farms/${id}/fields/${fieldId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: fieldDraft.name.trim(),
          areaHectares: fieldDraft.area,
          soilType: fieldDraft.soilType.trim() || null,
          latitude: coordinateValue(fieldDraft.latitude),
          longitude: coordinateValue(fieldDraft.longitude),
        }),
      });
      setEditingFieldId(null);
      setFieldDraft(emptyFieldDraft);
      await load();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save field');
    } finally {
      setSavingField(false);
    }
  }

  async function addField() {
    setSavingField(true);
    setError('');
    try {
      await apiRequest(`/farms/${id}/fields`, {
        method: 'POST',
        body: JSON.stringify({
          name: fieldDraft.name.trim(),
          areaHectares: fieldDraft.area.trim() || '0',
          soilType: fieldDraft.soilType.trim() || null,
          latitude: coordinateValue(fieldDraft.latitude),
          longitude: coordinateValue(fieldDraft.longitude),
        }),
      });
      setFieldDraft(emptyFieldDraft);
      await load();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to add field');
    } finally {
      setSavingField(false);
    }
  }

  const mappedFields = detail?.fields.filter(
    (field) => field.latitude != null && field.longitude != null,
  ).map((field) => ({
    id: field.id,
    name: field.name,
    latitude: field.latitude!,
    longitude: field.longitude!,
  })) ?? [];
  const farmHasCoordinates = detail?.farm.latitude != null && detail.farm.longitude != null;

  return (
    <AppScreen title={detail?.farm.name ?? 'Farm details'} subtitle={detail?.farm.location ?? 'Farm profile'}>
      {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}
      {loading && !detail ? <ThemedText themeColor="textSecondary">Loading farm…</ThemedText> : null}
      {detail ? (
        <>
          <View style={styles.panel}>
            <ThemedText type="smallBold">Farm profile</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {detail.fields.length} fields · {Number(detail.farm.area_hectares).toLocaleString()} ha · {productionSystemLabel(detail.farm.production_system)}
            </ThemedText>
            <ThemedText type="smallBold">Farm name</ThemedText>
            <TextInput value={farmName} onChangeText={setFarmName} placeholder="Farm name" style={styles.input} />
            <ThemedText type="smallBold">Location</ThemedText>
            <TextInput value={location} onChangeText={setLocation} placeholder="Town or area (optional)" style={styles.input} />
            <ThemedText type="smallBold">Total farm area (hectares)</ThemedText>
            <TextInput value={farmArea} onChangeText={setFarmArea} keyboardType="decimal-pad" placeholder="0" style={styles.input} />
            <ThemedText type="smallBold">Water system</ThemedText>
            <View style={styles.options}>
              {productionSystems.map((system) => (
                <Pressable
                  key={system.value}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: productionSystem === system.value }}
                  onPress={() => setProductionSystem(system.value)}
                  style={[styles.option, productionSystem === system.value && styles.optionSelected]}>
                  <ThemedText type="smallBold">{system.label}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">{system.description}</ThemedText>
                </Pressable>
              ))}
            </View>
            <ThemedText type="smallBold">Farm coordinates (optional)</ThemedText>
            <View style={styles.coordinateRow}>
              <TextInput value={farmLatitude} onChangeText={setFarmLatitude} keyboardType="decimal-pad" placeholder="Latitude" style={[styles.input, styles.coordinateInput]} />
              <TextInput value={farmLongitude} onChangeText={setFarmLongitude} keyboardType="decimal-pad" placeholder="Longitude" style={[styles.input, styles.coordinateInput]} />
            </View>
            <PrimaryButton onPress={saveFarmProfile} disabled={savingFarm}>
              {savingFarm ? 'Saving…' : 'Save farm profile'}
            </PrimaryButton>
          </View>

          <ThemedText type="smallBold">Fields ({detail.fields.length})</ThemedText>
          {detail.fields.map((field) => (
            <View key={field.id} style={styles.panel}>
              <ThemedText type="smallBold">{field.name}</ThemedText>
              {editingFieldId === field.id ? (
                <>
                  <TextInput value={fieldDraft.name} onChangeText={(name) => setFieldDraft((current) => ({ ...current, name }))} placeholder="Field name" style={styles.input} />
                  <TextInput value={fieldDraft.area} onChangeText={(area) => setFieldDraft((current) => ({ ...current, area }))} placeholder="Area in hectares" keyboardType="decimal-pad" style={styles.input} />
                  <TextInput value={fieldDraft.soilType} onChangeText={(soilType) => setFieldDraft((current) => ({ ...current, soilType }))} placeholder="Soil type (optional)" style={styles.input} />
                  <View style={styles.coordinateRow}>
                    <TextInput value={fieldDraft.latitude} onChangeText={(latitude) => setFieldDraft((current) => ({ ...current, latitude }))} placeholder="Latitude" keyboardType="decimal-pad" style={[styles.input, styles.coordinateInput]} />
                    <TextInput value={fieldDraft.longitude} onChangeText={(longitude) => setFieldDraft((current) => ({ ...current, longitude }))} placeholder="Longitude" keyboardType="decimal-pad" style={[styles.input, styles.coordinateInput]} />
                  </View>
                  <PrimaryButton onPress={() => saveField(field.id)} disabled={savingField}>
                    {savingField ? 'Saving…' : 'Save field'}
                  </PrimaryButton>
                  <Pressable onPress={() => {
                    setEditingFieldId(null);
                    setFieldDraft(emptyFieldDraft);
                  }} style={styles.secondaryButton}>
                    <ThemedText type="smallBold">Cancel</ThemedText>
                  </Pressable>
                </>
              ) : (
                <>
                  <ThemedText type="small" themeColor="textSecondary">
                    {Number(field.area_hectares).toLocaleString()} ha · {field.soil_type || 'Soil not recorded'}
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {field.crops.length ? field.crops.map((crop) => crop.name).join(', ') : 'No crops recorded yet'}
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {field.sensor_readings.length
                      ? field.sensor_readings.map((reading) => `${reading.sensor_type}: ${reading.value} ${reading.unit} (${measurementSourceLabel(reading.source)})`).join(' · ')
                      : 'No sensor readings recorded'}
                  </ThemedText>
                  <Pressable onPress={() => startEditingField(field)} style={styles.secondaryButton}>
                    <ThemedText type="smallBold">Edit field details</ThemedText>
                  </Pressable>
                  <View style={styles.fieldActions}>
                    <Pressable
                      onPress={() => router.push({ pathname: '/(app)/field/[id]/crops', params: { id: field.id, fieldName: field.name } })}
                      style={styles.fieldAction}>
                      <ThemedText type="smallBold">Crop records</ThemedText>
                    </Pressable>
                    <Pressable
                      onPress={() => router.push({ pathname: '/(app)/field/[id]/soil', params: { id: field.id, fieldName: field.name } })}
                      style={styles.fieldAction}>
                      <ThemedText type="smallBold">Soil history</ThemedText>
                    </Pressable>
                    <Pressable
                      onPress={() => router.push({ pathname: '/(app)/field/[id]/inspections', params: { id: field.id, fieldName: field.name } })}
                      style={styles.fieldAction}>
                      <ThemedText type="smallBold">Inspections</ThemedText>
                    </Pressable>
                  </View>
                </>
              )}
            </View>
          ))}
          {mappedFields.length || farmHasCoordinates ? (
            <View style={styles.panel}>
              <ThemedText type="smallBold">Approximate farm and field locations</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">Pins show locations you entered; they do not represent surveyed boundaries.</ThemedText>
              <FarmMap
                farms={farmHasCoordinates ? [{
                  id: detail.farm.id,
                  name: detail.farm.name,
                  latitude: detail.farm.latitude!,
                  longitude: detail.farm.longitude!,
                  location: detail.farm.location,
                }] : []}
                fields={mappedFields}
              />
            </View>
          ) : null}
          {!editingFieldId ? (
            <View style={styles.panel}>
              <ThemedText type="smallBold">Add a field</ThemedText>
              <TextInput value={fieldDraft.name} onChangeText={(name) => setFieldDraft((current) => ({ ...current, name }))} placeholder="Field name" style={styles.input} />
              <TextInput value={fieldDraft.area} onChangeText={(area) => setFieldDraft((current) => ({ ...current, area }))} placeholder="Area in hectares" keyboardType="decimal-pad" style={styles.input} />
              <TextInput value={fieldDraft.soilType} onChangeText={(soilType) => setFieldDraft((current) => ({ ...current, soilType }))} placeholder="Soil type (optional)" style={styles.input} />
              <View style={styles.coordinateRow}>
                <TextInput value={fieldDraft.latitude} onChangeText={(latitude) => setFieldDraft((current) => ({ ...current, latitude }))} placeholder="Latitude (optional)" keyboardType="decimal-pad" style={[styles.input, styles.coordinateInput]} />
                <TextInput value={fieldDraft.longitude} onChangeText={(longitude) => setFieldDraft((current) => ({ ...current, longitude }))} placeholder="Longitude (optional)" keyboardType="decimal-pad" style={[styles.input, styles.coordinateInput]} />
              </View>
              <PrimaryButton onPress={addField} disabled={savingField}>
                {savingField ? 'Saving…' : 'Add field'}
              </PrimaryButton>
            </View>
          ) : null}
          <ThemedText type="smallBold">Livestock ({detail.livestock.length})</ThemedText>
          {detail.livestock.length ? detail.livestock.map((animal) => (
            <ThemedText key={animal.id} type="small">{animal.species} · {animal.quantity}</ThemedText>
          )) : <ThemedText type="small" themeColor="textSecondary">No livestock recorded yet.</ThemedText>}
        </>
      ) : null}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  panel: { gap: Spacing.two, padding: Spacing.three, borderRadius: 16, backgroundColor: '#FFFFFF' },
  input: { borderWidth: 1, borderColor: Colors.light.border, backgroundColor: '#FFFFFF', padding: Spacing.two, borderRadius: 12, color: Colors.light.text },
  coordinateRow: { flexDirection: 'row', gap: Spacing.two },
  coordinateInput: { flex: 1, minWidth: 0 },
  options: { gap: Spacing.two },
  option: { gap: Spacing.one, borderWidth: 1, borderColor: Colors.light.border, borderRadius: 14, padding: Spacing.three, backgroundColor: '#FFFFFF' },
  optionSelected: { borderColor: Colors.light.primary, backgroundColor: Colors.light.backgroundSelected },
  secondaryButton: { alignItems: 'center', padding: Spacing.two },
  fieldActions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  fieldAction: { paddingHorizontal: Spacing.two, paddingVertical: Spacing.two, borderRadius: 12, backgroundColor: Colors.light.backgroundSelected },
  error: { color: '#B3261E' },
});
