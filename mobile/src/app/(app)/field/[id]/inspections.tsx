import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { AppScreen } from '@/components/ui/app-screen';
import { PrimaryButton } from '@/components/ui/primary-button';
import { Spacing } from '@/constants/theme';
import { apiRequest } from '@/lib/api';
import {
  cropHealthLabel,
  cropHealthOptions,
  type FieldInspection,
} from '@/lib/field-records';
import { useTheme } from '@/hooks/use-theme';

export default function FieldInspectionsScreen() {
  const theme = useTheme();
  const { id, fieldName } = useLocalSearchParams<{ id: string; fieldName?: string }>();
  const [inspections, setInspections] = useState<FieldInspection[]>([]);
  const [cropHealth, setCropHealth] = useState<FieldInspection['crop_health']>('unknown');
  const [observations, setObservations] = useState('');
  const [pestObservations, setPestObservations] = useState('');
  const [diseaseObservations, setDiseaseObservations] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [pendingPhotoInspectionId, setPendingPhotoInspectionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useFocusEffect(useCallback(() => {
    let active = true;
    apiRequest<{ inspections: FieldInspection[] }>(`/fields/${id}/inspections`)
      .then(({ inspections: records }) => {
        if (!active) return;
        setInspections(records);
        setError('');
      })
      .catch((loadError: unknown) => {
        if (active) setError(loadError instanceof Error ? loadError.message : 'Unable to load inspection history');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]));

  async function reloadInspections() {
    const response = await apiRequest<{ inspections: FieldInspection[] }>(`/fields/${id}/inspections`);
    setInspections(response.inspections);
  }

  async function chooseImage() {
    setError('');
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setError('Allow photo library access to attach an inspection photo.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });
      if (!result.canceled) setImageUri(result.assets[0].uri);
    } catch (pickerError) {
      setError(pickerError instanceof Error ? pickerError.message : 'Unable to select a photo');
    }
  }

  async function uploadPhoto(inspectionId: string, uri: string) {
    const imageBlob = await (await fetch(uri)).blob();
    const formData = new FormData();
    formData.append('image', imageBlob, 'field-inspection.jpg');
    return apiRequest<{ inspection: FieldInspection }>(`/inspections/${inspectionId}/image`, {
      method: 'POST',
      body: formData,
    });
  }

  async function saveInspection() {
    setSaving(true);
    setError('');
    setNotice('');
    let inspection: FieldInspection;
    try {
      const response = await apiRequest<{ inspection: FieldInspection }>(`/fields/${id}/inspections`, {
        method: 'POST',
        body: JSON.stringify({
          cropHealth,
          observations: observations.trim(),
          pestObservations: pestObservations.trim() || null,
          diseaseObservations: diseaseObservations.trim() || null,
        }),
      });
      inspection = response.inspection;
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save inspection');
      setSaving(false);
      return;
    }

    setObservations('');
    setPestObservations('');
    setDiseaseObservations('');
    setCropHealth('unknown');
    setImageUri(null);
    try {
      if (imageUri) {
        try {
          const response = await uploadPhoto(inspection.id, imageUri);
          setInspections((current) => [response.inspection, ...current.filter((item) => item.id !== inspection.id)]);
        } catch (photoError) {
          setPendingPhotoInspectionId(inspection.id);
          setImageUri(imageUri);
          setError(`Inspection saved, but its photo was not uploaded: ${photoError instanceof Error ? photoError.message : 'Photo upload failed'}`);
          try {
            await reloadInspections();
          } catch (historyError) {
            const historyMessage = historyError instanceof Error ? historyError.message : 'Inspection history could not be refreshed';
            setError((current) => `${current} · ${historyMessage}`);
          }
          setSaving(false);
          return;
        }
      } else {
        setInspections((current) => [inspection, ...current]);
      }
      setPendingPhotoInspectionId(null);
      setNotice('Inspection saved to this field’s history.');
    } finally {
      setSaving(false);
    }
  }

  async function retryPhotoUpload() {
    if (!pendingPhotoInspectionId || !imageUri) return;
    setSaving(true);
    setError('');
    try {
      const response = await uploadPhoto(pendingPhotoInspectionId, imageUri);
      setInspections((current) => [
        response.inspection,
        ...current.filter((item) => item.id !== response.inspection.id),
      ]);
      setPendingPhotoInspectionId(null);
      setImageUri(null);
      setNotice('Inspection photo uploaded.');
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Unable to upload inspection photo');
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppScreen
      title="Field inspections"
      subtitle={fieldName ? `Observation history for ${fieldName}` : 'Record what you observe in this field.'}>
      <View style={[styles.notice, { backgroundColor: theme.backgroundSelected }]}>
        <ThemedText type="smallBold">Observations, not diagnoses</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Record visible conditions and your own assessment. A photo or note does not confirm a pest or disease diagnosis.
        </ThemedText>
      </View>

      <View style={[styles.form, { backgroundColor: theme.card }]}>
        <ThemedText type="smallBold">Crop health observation</ThemedText>
        <View style={styles.options}>
          {cropHealthOptions.map((option) => {
            const selected = cropHealth === option.value;
            return (
              <Pressable
                key={option.value}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                onPress={() => setCropHealth(option.value)}
                style={[
                  styles.option,
                  { borderColor: selected ? theme.primary : theme.border, backgroundColor: theme.card },
                  selected && { backgroundColor: theme.backgroundSelected },
                ]}>
                <ThemedText type="smallBold">{option.label}</ThemedText>
              </Pressable>
            );
          })}
        </View>
        <ThemedText type="smallBold">What did you observe?</ThemedText>
        <TextInput
          value={observations}
          onChangeText={setObservations}
          placeholder="Describe visible crop or field conditions"
          placeholderTextColor={theme.textSecondary}
          multiline
          maxLength={2000}
          style={[styles.input, styles.multiline, { borderColor: theme.border, backgroundColor: theme.card, color: theme.text }]}
        />
        <ThemedText type="smallBold">Possible pest observations (optional)</ThemedText>
        <TextInput
          value={pestObservations}
          onChangeText={setPestObservations}
          placeholder="Describe what you noticed; not a diagnosis"
          placeholderTextColor={theme.textSecondary}
          multiline
          maxLength={1000}
          style={[styles.input, styles.multiline, { borderColor: theme.border, backgroundColor: theme.card, color: theme.text }]}
        />
        <ThemedText type="smallBold">Possible disease observations (optional)</ThemedText>
        <TextInput
          value={diseaseObservations}
          onChangeText={setDiseaseObservations}
          placeholder="Describe what you noticed; not a diagnosis"
          placeholderTextColor={theme.textSecondary}
          multiline
          maxLength={1000}
          style={[styles.input, styles.multiline, { borderColor: theme.border, backgroundColor: theme.card, color: theme.text }]}
        />
        <Pressable onPress={chooseImage} disabled={Boolean(pendingPhotoInspectionId)} style={[styles.photoButton, { borderColor: theme.border }]}>
          <ThemedText type="smallBold">{imageUri ? 'Choose a different photo' : 'Attach an inspection photo (optional)'}</ThemedText>
        </Pressable>
        {imageUri ? <Image source={{ uri: imageUri }} contentFit="cover" style={styles.preview} /> : null}
        {pendingPhotoInspectionId ? (
          <ThemedText type="small" themeColor="textSecondary">
            The inspection is saved. Retry photo upload when your connection and photo service are available.
          </ThemedText>
        ) : null}
        <PrimaryButton
          onPress={pendingPhotoInspectionId ? retryPhotoUpload : saveInspection}
          disabled={saving || (!pendingPhotoInspectionId && !observations.trim())}>
          {saving ? 'Saving…' : pendingPhotoInspectionId ? 'Retry photo upload' : 'Save inspection'}
        </PrimaryButton>
      </View>

      {error ? <ThemedText style={{ color: theme.error }}>{error}</ThemedText> : null}
      {notice ? <ThemedText style={{ color: theme.success }}>{notice}</ThemedText> : null}
      <ThemedText type="smallBold">Inspection history</ThemedText>
      {loading ? <ThemedText themeColor="textSecondary">Loading inspections…</ThemedText> : null}
      {!loading && !error && inspections.length === 0 ? (
        <ThemedText type="small" themeColor="textSecondary">No inspections recorded for this field.</ThemedText>
      ) : null}
      {inspections.map((inspection) => (
        <View key={inspection.id} style={[styles.record, { backgroundColor: theme.card }]}>
          <View style={styles.recordHeading}>
            <ThemedText type="smallBold">{cropHealthLabel(inspection.crop_health)}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {new Date(inspection.observed_at).toLocaleString()}
            </ThemedText>
          </View>
          <ThemedText>{inspection.observations}</ThemedText>
          {inspection.pest_observations ? (
            <ThemedText type="small" themeColor="textSecondary">Pest observations: {inspection.pest_observations}</ThemedText>
          ) : null}
          {inspection.disease_observations ? (
            <ThemedText type="small" themeColor="textSecondary">Disease observations: {inspection.disease_observations}</ThemedText>
          ) : null}
          {inspection.image_url ? (
            <Image source={{ uri: inspection.image_url }} contentFit="cover" style={styles.preview} />
          ) : null}
        </View>
      ))}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  notice: { padding: Spacing.three, borderRadius: 16, gap: Spacing.one },
  form: { padding: Spacing.three, borderRadius: 16, gap: Spacing.two },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  option: { borderWidth: 1, borderRadius: 14, paddingHorizontal: Spacing.two, paddingVertical: Spacing.two },
  input: { borderWidth: 1, padding: Spacing.two, borderRadius: 12 },
  multiline: { minHeight: 88, textAlignVertical: 'top' },
  photoButton: { alignItems: 'center', borderWidth: 1, padding: Spacing.three, borderRadius: 14 },
  preview: { width: '100%', height: 220, borderRadius: 14 },
  record: { padding: Spacing.three, borderRadius: 16, gap: Spacing.two },
  recordHeading: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: Spacing.two },
});
