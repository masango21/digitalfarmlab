import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { FarmProfileAttributes } from '@/components/farm-profile-attributes';
import { AppScreen } from '@/components/ui/app-screen';
import { FarmMap } from '@/components/ui/map-view';
import { PrimaryButton } from '@/components/ui/primary-button';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { apiRequest } from '@/lib/api';
import { farmTypeLabel, productionSystems, productionSystemLabel, type FarmType, type ProductionSystem } from '@/lib/farm';
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
    region: string | null;
    farm_type: FarmType;
    main_crops: string[];
    image_url: string | null;
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
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [detail, setDetail] = useState<FarmDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [farmName, setFarmName] = useState('');
  const [location, setLocation] = useState('');
  const [farmArea, setFarmArea] = useState('');
  const [farmLatitude, setFarmLatitude] = useState('');
  const [farmLongitude, setFarmLongitude] = useState('');
  const [productionSystem, setProductionSystem] = useState<ProductionSystem>('mixed');
  const [region, setRegion] = useState('');
  const [farmType, setFarmType] = useState<FarmType>('mixed');
  const [mainCrops, setMainCrops] = useState<string[]>([]);
  const [farmImageUri, setFarmImageUri] = useState<string | null>(null);
  const [fieldDraft, setFieldDraft] = useState<FieldDraft>(emptyFieldDraft);
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [savingFarm, setSavingFarm] = useState(false);
  const [savingField, setSavingField] = useState(false);
  const inputTheme = { borderColor: theme.border, backgroundColor: theme.card, color: theme.text };

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
      setRegion(response.farm.region ?? '');
      setFarmType(response.farm.farm_type ?? 'mixed');
      setMainCrops(response.farm.main_crops ?? []);
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
        setRegion(response.farm.region ?? '');
        setFarmType(response.farm.farm_type ?? 'mixed');
        setMainCrops(response.farm.main_crops ?? []);
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

  async function chooseFarmImage() {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setError('Allow photo library access to choose a farm image.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });
      if (!result.canceled) setFarmImageUri(result.assets[0].uri);
    } catch (pickerError) {
      setError(pickerError instanceof Error ? pickerError.message : 'Unable to select an image');
    }
  }

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
          region: region.trim() || null,
          farmType,
          mainCrops,
        }),
      });
      if (farmImageUri) {
        const imageBlob = await (await fetch(farmImageUri)).blob();
        const formData = new FormData();
        formData.append('image', imageBlob, 'farm-image.jpg');
        await apiRequest(`/farms/${id}/image`, { method: 'POST', body: formData });
        setFarmImageUri(null);
      }
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
      {error ? <ThemedText style={{ color: theme.error }}>{error}</ThemedText> : null}
      {loading && !detail ? <ThemedText themeColor="textSecondary">Loading farm…</ThemedText> : null}
      {detail ? (
        <>
          <View style={[styles.panel, { backgroundColor: theme.card }]}>
            <ThemedText type="smallBold">Farm profile</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {detail.fields.length} fields · {Number(detail.farm.area_hectares).toLocaleString()} ha · {farmTypeLabel(detail.farm.farm_type)} · {productionSystemLabel(detail.farm.production_system)}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {detail.farm.main_crops?.length ? `Main crops: ${detail.farm.main_crops.join(', ')}` : 'Main crops not selected'}
            </ThemedText>
            <ThemedText type="smallBold">Farm name</ThemedText>
            <TextInput value={farmName} onChangeText={setFarmName} placeholder="Farm name" placeholderTextColor={theme.textSecondary} style={[styles.input, inputTheme]} />
            <ThemedText type="smallBold">Location</ThemedText>
            <TextInput value={location} onChangeText={setLocation} placeholder="Town or area (optional)" placeholderTextColor={theme.textSecondary} style={[styles.input, inputTheme]} />
            <ThemedText type="smallBold">Total farm area (hectares)</ThemedText>
            <TextInput value={farmArea} onChangeText={setFarmArea} keyboardType="decimal-pad" placeholder="0" placeholderTextColor={theme.textSecondary} style={[styles.input, inputTheme]} />
            <ThemedText type="smallBold">Water system</ThemedText>
            <View style={styles.options}>
              {productionSystems.map((system) => (
                <Pressable
                  key={system.value}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: productionSystem === system.value }}
                  onPress={() => setProductionSystem(system.value)}
                  style={[
                    styles.option,
                    { borderColor: theme.border, backgroundColor: theme.card },
                    productionSystem === system.value && { borderColor: theme.primary, backgroundColor: theme.backgroundSelected },
                  ]}>
                  <ThemedText type="smallBold">{system.label}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">{system.description}</ThemedText>
                </Pressable>
              ))}
            </View>
            <FarmProfileAttributes
              region={region}
              farmType={farmType}
              mainCrops={mainCrops}
              onRegionChange={setRegion}
              onFarmTypeChange={setFarmType}
              onMainCropsChange={setMainCrops}
            />
            <ThemedText type="smallBold">Farm coordinates (optional)</ThemedText>
            <View style={styles.coordinateRow}>
              <TextInput value={farmLatitude} onChangeText={setFarmLatitude} keyboardType="decimal-pad" placeholder="Latitude" placeholderTextColor={theme.textSecondary} style={[styles.input, styles.coordinateInput, inputTheme]} />
              <TextInput value={farmLongitude} onChangeText={setFarmLongitude} keyboardType="decimal-pad" placeholder="Longitude" placeholderTextColor={theme.textSecondary} style={[styles.input, styles.coordinateInput, inputTheme]} />
            </View>
            <ThemedText type="smallBold">Farm avatar</ThemedText>
            {farmImageUri || detail.farm.image_url ? (
              <Image
                source={{ uri: farmImageUri ?? detail.farm.image_url! }}
                contentFit="cover"
                style={styles.farmImage}
              />
            ) : null}
            <Pressable onPress={chooseFarmImage} style={[styles.secondaryButton, { backgroundColor: theme.backgroundSelected }]}>
              <ThemedText type="smallBold">{farmImageUri || detail.farm.image_url ? 'Change farm image' : 'Choose farm image'}</ThemedText>
            </Pressable>
            <PrimaryButton onPress={saveFarmProfile} disabled={savingFarm}>
              {savingFarm ? 'Saving…' : 'Save farm profile'}
            </PrimaryButton>
          </View>

          <ThemedText type="smallBold">Fields ({detail.fields.length})</ThemedText>
          {detail.fields.map((field) => (
            <View key={field.id} style={[styles.panel, { backgroundColor: theme.card }]}>
              <ThemedText type="smallBold">{field.name}</ThemedText>
              {editingFieldId === field.id ? (
                <>
                  <TextInput value={fieldDraft.name} onChangeText={(name) => setFieldDraft((current) => ({ ...current, name }))} placeholder="Field name" placeholderTextColor={theme.textSecondary} style={[styles.input, inputTheme]} />
                  <TextInput value={fieldDraft.area} onChangeText={(area) => setFieldDraft((current) => ({ ...current, area }))} placeholder="Area in hectares" placeholderTextColor={theme.textSecondary} keyboardType="decimal-pad" style={[styles.input, inputTheme]} />
                  <TextInput value={fieldDraft.soilType} onChangeText={(soilType) => setFieldDraft((current) => ({ ...current, soilType }))} placeholder="Soil type (optional)" placeholderTextColor={theme.textSecondary} style={[styles.input, inputTheme]} />
                  <View style={styles.coordinateRow}>
                    <TextInput value={fieldDraft.latitude} onChangeText={(latitude) => setFieldDraft((current) => ({ ...current, latitude }))} placeholder="Latitude" placeholderTextColor={theme.textSecondary} keyboardType="decimal-pad" style={[styles.input, styles.coordinateInput, inputTheme]} />
                    <TextInput value={fieldDraft.longitude} onChangeText={(longitude) => setFieldDraft((current) => ({ ...current, longitude }))} placeholder="Longitude" placeholderTextColor={theme.textSecondary} keyboardType="decimal-pad" style={[styles.input, styles.coordinateInput, inputTheme]} />
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
                      style={[styles.fieldAction, { backgroundColor: theme.backgroundSelected }]}>
                      <ThemedText type="smallBold">Crop records</ThemedText>
                    </Pressable>
                    <Pressable
                      onPress={() => router.push({ pathname: '/(app)/field/[id]/soil', params: { id: field.id, fieldName: field.name } })}
                      style={[styles.fieldAction, { backgroundColor: theme.backgroundSelected }]}>
                      <ThemedText type="smallBold">Soil history</ThemedText>
                    </Pressable>
                    <Pressable
                      onPress={() => router.push({ pathname: '/(app)/field/[id]/inspections', params: { id: field.id, fieldName: field.name } })}
                      style={[styles.fieldAction, { backgroundColor: theme.backgroundSelected }]}>
                      <ThemedText type="smallBold">Inspections</ThemedText>
                    </Pressable>
                  </View>
                </>
              )}
            </View>
          ))}
          {mappedFields.length || farmHasCoordinates ? (
            <View style={[styles.panel, { backgroundColor: theme.card }]}>
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
            <View style={[styles.panel, { backgroundColor: theme.card }]}>
              <ThemedText type="smallBold">Add a field</ThemedText>
              <TextInput value={fieldDraft.name} onChangeText={(name) => setFieldDraft((current) => ({ ...current, name }))} placeholder="Field name" placeholderTextColor={theme.textSecondary} style={[styles.input, inputTheme]} />
              <TextInput value={fieldDraft.area} onChangeText={(area) => setFieldDraft((current) => ({ ...current, area }))} placeholder="Area in hectares" placeholderTextColor={theme.textSecondary} keyboardType="decimal-pad" style={[styles.input, inputTheme]} />
              <TextInput value={fieldDraft.soilType} onChangeText={(soilType) => setFieldDraft((current) => ({ ...current, soilType }))} placeholder="Soil type (optional)" placeholderTextColor={theme.textSecondary} style={[styles.input, inputTheme]} />
              <View style={styles.coordinateRow}>
                <TextInput value={fieldDraft.latitude} onChangeText={(latitude) => setFieldDraft((current) => ({ ...current, latitude }))} placeholder="Latitude (optional)" placeholderTextColor={theme.textSecondary} keyboardType="decimal-pad" style={[styles.input, styles.coordinateInput, inputTheme]} />
                <TextInput value={fieldDraft.longitude} onChangeText={(longitude) => setFieldDraft((current) => ({ ...current, longitude }))} placeholder="Longitude (optional)" placeholderTextColor={theme.textSecondary} keyboardType="decimal-pad" style={[styles.input, styles.coordinateInput, inputTheme]} />
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
  panel: { gap: Spacing.two, padding: Spacing.three, borderRadius: 16 },
  input: { borderWidth: 1, padding: Spacing.two, borderRadius: 12 },
  coordinateRow: { flexDirection: 'row', gap: Spacing.two },
  coordinateInput: { flex: 1, minWidth: 0 },
  options: { gap: Spacing.two },
  option: { gap: Spacing.one, borderWidth: 1, borderRadius: 14, padding: Spacing.three },
  secondaryButton: { alignItems: 'center', padding: Spacing.two },
  fieldActions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  fieldAction: { paddingHorizontal: Spacing.two, paddingVertical: Spacing.two, borderRadius: 12 },
  farmImage: { width: '100%', height: 180, borderRadius: 14 },
});
