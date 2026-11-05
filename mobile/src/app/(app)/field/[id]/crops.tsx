import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { AppScreen } from '@/components/ui/app-screen';
import { PrimaryButton } from '@/components/ui/primary-button';
import { Spacing } from '@/constants/theme';
import { apiRequest } from '@/lib/api';
import {
  cropGrowthStageLabel,
  cropGrowthStages,
  cropNames,
  type CropRecord,
} from '@/lib/field-records';
import { useTheme } from '@/hooks/use-theme';

interface CropDraft {
  name: string;
  variety: string;
  growthStage: string;
  waterRequirementNotes: string;
  nutrientRequirementNotes: string;
  plantedAt: string;
  expectedHarvestAt: string;
}

const emptyDraft: CropDraft = {
  name: '',
  variety: '',
  growthStage: '',
  waterRequirementNotes: '',
  nutrientRequirementNotes: '',
  plantedAt: '',
  expectedHarvestAt: '',
};

function dateLabel(value: string | null) {
  return value ? new Date(`${value.slice(0, 10)}T00:00:00`).toLocaleDateString() : 'Not recorded';
}

export default function FieldCropsScreen() {
  const theme = useTheme();
  const { id, fieldName } = useLocalSearchParams<{ id: string; fieldName?: string }>();
  const [crops, setCrops] = useState<CropRecord[]>([]);
  const [draft, setDraft] = useState<CropDraft>(emptyDraft);
  const [editingCropId, setEditingCropId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useFocusEffect(useCallback(() => {
    let active = true;
    apiRequest<{ crops: CropRecord[] }>(`/fields/${id}/crops`)
      .then(({ crops: records }) => {
        if (!active) return;
        setCrops(records);
        setError('');
      })
      .catch((loadError: unknown) => {
        if (active) setError(loadError instanceof Error ? loadError.message : 'Unable to load crop records');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]));

  async function reload() {
    const response = await apiRequest<{ crops: CropRecord[] }>(`/fields/${id}/crops`);
    setCrops(response.crops);
  }

  function editCrop(crop: CropRecord) {
    setEditingCropId(crop.id);
    setDraft({
      name: crop.name,
      variety: crop.variety ?? '',
      growthStage: crop.growth_stage ?? '',
      waterRequirementNotes: crop.water_requirement_notes ?? '',
      nutrientRequirementNotes: crop.nutrient_requirement_notes ?? '',
      plantedAt: crop.planted_at?.slice(0, 10) ?? '',
      expectedHarvestAt: crop.expected_harvest_at?.slice(0, 10) ?? '',
    });
  }

  function resetDraft() {
    setEditingCropId(null);
    setDraft(emptyDraft);
  }

  async function saveCrop() {
    setSaving(true);
    setError('');
    try {
      const body = JSON.stringify({
        name: draft.name.trim(),
        variety: draft.variety.trim() || null,
        growthStage: draft.growthStage || null,
        waterRequirementNotes: draft.waterRequirementNotes.trim() || null,
        nutrientRequirementNotes: draft.nutrientRequirementNotes.trim() || null,
        plantedAt: draft.plantedAt.trim() || null,
        expectedHarvestAt: draft.expectedHarvestAt.trim() || null,
      });
      if (editingCropId) {
        await apiRequest(`/crops/${editingCropId}`, { method: 'PATCH', body });
      } else {
        await apiRequest(`/fields/${id}/crops`, { method: 'POST', body });
      }
      await reload();
      resetDraft();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save crop record');
    } finally {
      setSaving(false);
    }
  }

  async function deleteCrop(crop: CropRecord) {
    setSaving(true);
    setError('');
    try {
      await apiRequest(`/crops/${crop.id}`, { method: 'DELETE' });
      await reload();
      if (editingCropId === crop.id) resetDraft();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Unable to remove crop record');
    } finally {
      setSaving(false);
    }
  }

  function confirmDelete(crop: CropRecord) {
    if (Platform.OS === 'web') {
      if (globalThis.confirm(`Remove ${crop.name} from this field?`)) void deleteCrop(crop);
      return;
    }
    Alert.alert('Remove crop record?', `${crop.name} will be removed from this field.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => void deleteCrop(crop) },
    ]);
  }

  return (
    <AppScreen
      title="Crop records"
      subtitle={fieldName ? `Crops assigned to ${fieldName}` : 'Record the crop growing in this field.'}>
      <View style={[styles.notice, { backgroundColor: theme.backgroundSelected }]}>
        <ThemedText type="smallBold">Farmer-entered records</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Crop timing and growth stages depend on local conditions. Record your observations; these are not automatic agronomic recommendations.
        </ThemedText>
      </View>

      {error ? <ThemedText style={{ color: theme.error }}>{error}</ThemedText> : null}
      {loading ? <ThemedText themeColor="textSecondary">Loading crop records…</ThemedText> : null}
      {!loading && !error && crops.length === 0 ? (
        <View style={[styles.empty, { backgroundColor: theme.card }]}>
          <ThemedText type="smallBold">No crops recorded yet</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">Add the crop currently planted in this field.</ThemedText>
        </View>
      ) : null}
      {crops.map((crop) => (
        <View key={crop.id} style={[styles.card, { backgroundColor: theme.card }]}>
          <View style={styles.cardHeading}>
            <ThemedText type="smallBold">{crop.name}</ThemedText>
            <ThemedText type="smallBold"             style={{ color: theme.primaryText }}>
              {cropGrowthStageLabel(crop.growth_stage)}
            </ThemedText>
          </View>
          <ThemedText type="small" themeColor="textSecondary">
            Variety: {crop.variety || 'Not recorded'}
          </ThemedText>
          {crop.water_requirement_notes ? (
            <ThemedText type="small" themeColor="textSecondary">Water notes: {crop.water_requirement_notes}</ThemedText>
          ) : null}
          {crop.nutrient_requirement_notes ? (
            <ThemedText type="small" themeColor="textSecondary">Nutrient notes: {crop.nutrient_requirement_notes}</ThemedText>
          ) : null}
          <ThemedText type="small" themeColor="textSecondary">
            Planted: {dateLabel(crop.planted_at)} · Expected harvest: {dateLabel(crop.expected_harvest_at)}
          </ThemedText>
          <View style={styles.actions}>
            <Pressable onPress={() => editCrop(crop)} style={styles.actionButton}>
              <ThemedText type="smallBold" style={{ color: theme.primaryText }}>Edit</ThemedText>
            </Pressable>
            <Pressable onPress={() => router.push({ pathname: '/(app)/growth-timeline', params: { fieldId: id, fieldName: fieldName ?? '' } } as never)} style={styles.actionButton}>
              <ThemedText type="smallBold" style={{ color: theme.primaryText }}>Growth timeline</ThemedText>
            </Pressable>
            <Pressable onPress={() => confirmDelete(crop)} disabled={saving} style={styles.actionButton}>
              <ThemedText type="smallBold" style={{ color: theme.error }}>Remove</ThemedText>
            </Pressable>
          </View>
        </View>
      ))}

      <View style={[styles.form, { backgroundColor: theme.card }]}>
        <ThemedText type="smallBold">{editingCropId ? 'Edit crop record' : 'Add a crop'}</ThemedText>
        <ThemedText type="small">Choose a common crop or enter a different one.</ThemedText>
        {!editingCropId ? (
          <Pressable
            onPress={() => router.push({ pathname: '/(app)/crop-library/index', params: { fieldId: id } })}
            style={[styles.actionButton, { backgroundColor: theme.backgroundSelected, borderRadius: 12, padding: Spacing.two }]}>
            <ThemedText type="smallBold" style={{ color: theme.primaryText }}>Browse crop library</ThemedText>
          </Pressable>
        ) : null}
          <View style={styles.chips}>
            {cropNames.map((cropName) => {
              const selected = draft.name === cropName;
              return (
                <Pressable
                  key={cropName}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                  onPress={() => setDraft((current) => ({ ...current, name: cropName }))}
                  style={[
                    styles.chip,
                    { borderColor: selected ? theme.primaryText : theme.border },
                    selected && { backgroundColor: theme.backgroundSelected },
                  ]}>
                  <ThemedText type="small">{cropName}</ThemedText>
                </Pressable>
              );
            })}
          </View>
          <ThemedText type="smallBold">Crop name</ThemedText>
          <TextInput value={draft.name} onChangeText={(name) => setDraft((current) => ({ ...current, name }))} placeholder="e.g. Maize" placeholderTextColor={theme.textSecondary} maxLength={100} style={[styles.input, { borderColor: theme.border, backgroundColor: theme.card, color: theme.text }]} />
          <ThemedText type="smallBold">Variety (optional)</ThemedText>
          <TextInput value={draft.variety} onChangeText={(variety) => setDraft((current) => ({ ...current, variety }))} placeholder="Known variety" placeholderTextColor={theme.textSecondary} maxLength={120} style={[styles.input, { borderColor: theme.border, backgroundColor: theme.card, color: theme.text }]} />
          <ThemedText type="smallBold">Water requirement notes (optional)</ThemedText>
          <TextInput value={draft.waterRequirementNotes} onChangeText={(waterRequirementNotes) => setDraft((current) => ({ ...current, waterRequirementNotes }))} placeholder="Your field-specific notes; no recommendations are generated" placeholderTextColor={theme.textSecondary} maxLength={1000} multiline style={[styles.input, styles.multiline, { borderColor: theme.border, backgroundColor: theme.card, color: theme.text }]} />
          <ThemedText type="smallBold">Nutrient requirement notes (optional)</ThemedText>
          <TextInput value={draft.nutrientRequirementNotes} onChangeText={(nutrientRequirementNotes) => setDraft((current) => ({ ...current, nutrientRequirementNotes }))} placeholder="Your field-specific notes; no application rates are suggested" placeholderTextColor={theme.textSecondary} maxLength={1000} multiline style={[styles.input, styles.multiline, { borderColor: theme.border, backgroundColor: theme.card, color: theme.text }]} />
          <ThemedText type="smallBold">Growth stage</ThemedText>
          <View style={styles.chips}>
            {cropGrowthStages.map((stage) => {
              const selected = draft.growthStage === stage.value;
              return (
                <Pressable
                  key={stage.value}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                  onPress={() => setDraft((current) => ({ ...current, growthStage: selected ? '' : stage.value }))}
                  style={[
                    styles.chip,
                    { borderColor: selected ? theme.primaryText : theme.border },
                    selected && { backgroundColor: theme.backgroundSelected },
                  ]}>
                  <ThemedText type="small">{stage.label}</ThemedText>
                </Pressable>
              );
            })}
          </View>
          <ThemedText type="smallBold">Planting date (optional)</ThemedText>
          <TextInput value={draft.plantedAt} onChangeText={(plantedAt) => setDraft((current) => ({ ...current, plantedAt }))} placeholder="YYYY-MM-DD" placeholderTextColor={theme.textSecondary} maxLength={10} style={[styles.input, { borderColor: theme.border, backgroundColor: theme.card, color: theme.text }]} />
          <ThemedText type="smallBold">Expected harvest date (optional)</ThemedText>
          <TextInput value={draft.expectedHarvestAt} onChangeText={(expectedHarvestAt) => setDraft((current) => ({ ...current, expectedHarvestAt }))} placeholder="YYYY-MM-DD" placeholderTextColor={theme.textSecondary} maxLength={10} style={[styles.input, { borderColor: theme.border, backgroundColor: theme.card, color: theme.text }]} />
        <PrimaryButton onPress={saveCrop} disabled={saving || !draft.name.trim()}>
          {saving ? 'Saving…' : editingCropId ? 'Save crop changes' : 'Add crop to field'}
        </PrimaryButton>
        {editingCropId ? (
          <Pressable onPress={resetDraft} style={styles.cancel}>
            <ThemedText type="smallBold">Cancel editing</ThemedText>
          </Pressable>
        ) : null}
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  notice: { padding: Spacing.three, borderRadius: 16, gap: Spacing.one },
  empty: { padding: Spacing.three, borderRadius: 16, gap: Spacing.one },
  card: { padding: Spacing.three, borderRadius: 16, gap: Spacing.one },
  cardHeading: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: Spacing.two },
  actions: { flexDirection: 'row', gap: Spacing.three, paddingTop: Spacing.one },
  actionButton: { paddingVertical: Spacing.one },
  form: { padding: Spacing.three, borderRadius: 16, gap: Spacing.two },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  chip: { borderWidth: 1, borderRadius: 18, paddingHorizontal: Spacing.two, paddingVertical: Spacing.one },
  input: { borderWidth: 1, padding: Spacing.two, borderRadius: 12 },
  multiline: { minHeight: 72, textAlignVertical: 'top' },
  cancel: { alignItems: 'center', padding: Spacing.two },
});
