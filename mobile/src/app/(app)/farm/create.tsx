import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { FarmProfileAttributes } from '@/components/farm-profile-attributes';
import { AppScreen } from '@/components/ui/app-screen';
import { PrimaryButton } from '@/components/ui/primary-button';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { apiRequest } from '@/lib/api';
import { productionSystems, type FarmType, type ProductionSystem } from '@/lib/farm';

function coordinateValue(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : value;
}

export default function CreateFarmScreen() {
  const theme = useTheme();
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [area, setArea] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [productionSystem, setProductionSystem] = useState<ProductionSystem>('mixed');
  const [region, setRegion] = useState('');
  const [farmType, setFarmType] = useState<FarmType>('mixed');
  const [mainCrops, setMainCrops] = useState<string[]>([]);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [createdFarmId, setCreatedFarmId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function chooseImage() {
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
      if (!result.canceled) setImageUri(result.assets[0].uri);
    } catch (pickerError) {
      setError(pickerError instanceof Error ? pickerError.message : 'Unable to select an image');
    }
  }

  async function submit() {
    setError('');
    setSaving(true);
    try {
      let farmId = createdFarmId;
      if (!farmId) {
        const response = await apiRequest<{ farm: { id: string } }>('/farms', {
          method: 'POST',
          body: JSON.stringify({
            name: name.trim(),
            location: location.trim() || null,
            areaHectares: area.trim() || '0',
            latitude: coordinateValue(latitude),
            longitude: coordinateValue(longitude),
            productionSystem,
            region: region.trim() || null,
            farmType,
            mainCrops,
          }),
        });
        farmId = response.farm.id;
        setCreatedFarmId(farmId);
      }
      if (imageUri) {
        const imageBlob = await (await fetch(imageUri)).blob();
        const formData = new FormData();
        formData.append('image', imageBlob, 'farm-image.jpg');
        await apiRequest(`/farms/${farmId}/image`, { method: 'POST', body: formData });
      }
      router.replace({ pathname: '/(app)/farm/[id]', params: { id: farmId } });
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save farm');
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppScreen title="Add a farm" subtitle="You can add fields and crops after creating it.">
      <View style={styles.form}>
        <ThemedText type="smallBold">Farm name</ThemedText>
        <TextInput value={name} onChangeText={setName} editable={!createdFarmId} placeholder="e.g. Green Valley Farm" placeholderTextColor={theme.textSecondary} style={[styles.input, { borderColor: theme.border, backgroundColor: theme.card, color: theme.text }]} />
        <ThemedText type="smallBold">Location</ThemedText>
        <TextInput value={location} onChangeText={setLocation} placeholder="Town or region" placeholderTextColor={theme.textSecondary} style={[styles.input, { borderColor: theme.border, backgroundColor: theme.card, color: theme.text }]} />
        <ThemedText type="smallBold">Area (hectares)</ThemedText>
        <TextInput value={area} onChangeText={setArea} keyboardType="decimal-pad" placeholder="0" placeholderTextColor={theme.textSecondary} style={[styles.input, { borderColor: theme.border, backgroundColor: theme.card, color: theme.text }]} />
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
        <ThemedText type="smallBold">Latitude (optional, for map pins)</ThemedText>
        <TextInput value={latitude} onChangeText={setLatitude} keyboardType="decimal-pad" placeholder="e.g. -25.75" placeholderTextColor={theme.textSecondary} style={[styles.input, { borderColor: theme.border, backgroundColor: theme.card, color: theme.text }]} />
        <ThemedText type="smallBold">Longitude (optional, for map pins)</ThemedText>
        <TextInput value={longitude} onChangeText={setLongitude} keyboardType="decimal-pad" placeholder="e.g. 28.19" placeholderTextColor={theme.textSecondary} style={[styles.input, { borderColor: theme.border, backgroundColor: theme.card, color: theme.text }]} />
        <Pressable onPress={chooseImage} style={[styles.imageButton, { borderColor: theme.border }]}>
          <ThemedText type="smallBold">{imageUri ? 'Change farm image' : 'Choose farm image'}</ThemedText>
        </Pressable>
        {error ? <ThemedText style={{ color: theme.error }}>{error}</ThemedText> : null}
        <PrimaryButton onPress={submit} disabled={saving}>{saving ? 'Saving…' : createdFarmId ? 'Retry image upload' : 'Create farm'}</PrimaryButton>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  form: { gap: Spacing.two },
  input: { borderWidth: 1, padding: Spacing.three, borderRadius: 14 },
  imageButton: { borderWidth: 1, padding: Spacing.three, borderRadius: 14, alignItems: 'center' },
  options: { gap: Spacing.two },
  option: { gap: Spacing.one, borderWidth: 1, borderRadius: 14, padding: Spacing.three },
});
