import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { AppScreen } from '@/components/ui/app-screen';
import { ContentState } from '@/components/ui/content-state';
import { PrimaryButton } from '@/components/ui/primary-button';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth';
import { apiRequest } from '@/lib/api';
import {
  cropCategoryLabel,
  cropInformationStatusLabel,
  cropProfileFields,
  type CropInformationStatus,
  type CropLibraryEntry,
  type CropProfile,
} from '@/lib/crop-library';

interface CropVariety {
  id: string;
  name: string;
  region: string | null;
  notes: string | null;
  information_status: CropInformationStatus;
}

interface CropDetail extends CropLibraryEntry {
  varieties: CropVariety[];
}

interface CropDetailResponse {
  crop: CropDetail;
}

const informationStatuses: CropInformationStatus[] = ['unknown', 'estimated', 'verified'];

export default function CropLibraryDetailScreen() {
  const theme = useTheme();
  const { user } = useAuth();
  const { id, fieldId } = useLocalSearchParams<{ id: string; fieldId?: string }>();
  const [crop, setCrop] = useState<CropDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [addingToField, setAddingToField] = useState(false);
  const [error, setError] = useState('');
  const [scientificName, setScientificName] = useState('');
  const [description, setDescription] = useState('');
  const [profile, setProfile] = useState<CropProfile>({});
  const [informationStatus, setInformationStatus] = useState<CropInformationStatus>('unknown');
  const [varietyName, setVarietyName] = useState('');
  const [varietyRegion, setVarietyRegion] = useState('');
  const [varietyNotes, setVarietyNotes] = useState('');
  const inputStyle = [styles.input, { borderColor: theme.border, backgroundColor: theme.card, color: theme.text }];

  const loadCrop = useCallback(async (isActive: () => boolean = () => true) => {
    try {
      const response = await apiRequest<CropDetailResponse>(`/crop-library/${id}`);
      if (!isActive()) return;
      setCrop(response.crop);
      setScientificName(response.crop.scientific_name ?? '');
      setDescription(response.crop.description ?? '');
      setProfile(response.crop.profile ?? {});
      setInformationStatus(response.crop.information_status);
      setError('');
    } catch (loadError) {
      if (isActive()) setError(loadError instanceof Error ? loadError.message : 'Unable to load crop profile');
    } finally {
      if (isActive()) setLoading(false);
    }
  }, [id]);

  useFocusEffect(useCallback(() => {
    let active = true;
    void loadCrop(() => active);
    return () => {
      active = false;
    };
  }, [loadCrop]));

  async function saveProfile() {
    setSaving(true);
    setError('');
    try {
      await apiRequest(`/crop-library/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ scientificName, description, profile, informationStatus }),
      });
      await loadCrop();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save crop profile');
    } finally {
      setSaving(false);
    }
  }

  async function addVariety() {
    setSaving(true);
    setError('');
    try {
      await apiRequest(`/crop-library/${id}/varieties`, {
        method: 'POST',
        body: JSON.stringify({
          name: varietyName.trim(),
          region: varietyRegion.trim() || null,
          notes: varietyNotes.trim() || null,
          informationStatus: 'unknown',
        }),
      });
      setVarietyName('');
      setVarietyRegion('');
      setVarietyNotes('');
      await loadCrop();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to add crop variety');
    } finally {
      setSaving(false);
    }
  }

  async function addCropToField() {
    if (!fieldId || !crop) return;
    setAddingToField(true);
    setError('');
    try {
      await apiRequest(`/fields/${fieldId}/crops`, {
        method: 'POST',
        body: JSON.stringify({ name: crop.name }),
      });
      router.replace({ pathname: '/(app)/field/[id]/crops', params: { id: fieldId } });
    } catch (addError) {
      setError(addError instanceof Error ? addError.message : 'Unable to add crop to this field');
    } finally {
      setAddingToField(false);
    }
  }

  function updateProfileField(key: keyof CropProfile, value: string) {
    const definition = cropProfileFields.find((field) => field.key === key);
    if (!definition) return;
    setProfile((current) => ({
      ...current,
      [key]: definition.list
        ? value.split('\n').map((item) => item.trim()).filter(Boolean)
        : value,
    }));
  }

  const isAdmin = user?.role === 'admin';
  return (
    <AppScreen
      title={crop?.name ?? 'Crop profile'}
      subtitle={crop ? cropCategoryLabel(crop.category) : 'Crop library'}
      action={<Pressable onPress={() => router.back()}><ThemedText type="smallBold" style={{ color: theme.primaryText }}>Back</ThemedText></Pressable>}>
      {error ? <ContentState variant="error" title="Unable to complete request" message={error} /> : null}
      {loading ? <ContentState variant="loading" message="Loading crop profile…" /> : null}
      {!loading && !crop ? <ContentState variant="empty" title="Crop not found" message="This crop profile may have been removed." /> : null}
      {crop ? (
        <>
          <View style={[styles.notice, { backgroundColor: theme.backgroundSelected }]}>
            <ThemedText type="smallBold">{cropInformationStatusLabel(crop.information_status)}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Agricultural guidance varies by region and conditions. Missing values are shown as unknown rather than estimated.
            </ThemedText>
          </View>
          {crop.scientific_name ? <ThemedText type="small" themeColor="textSecondary">{crop.scientific_name}</ThemedText> : null}
          {crop.description ? <ThemedText>{crop.description}</ThemedText> : (
            <ThemedText type="small" themeColor="textSecondary">No crop description has been reviewed yet.</ThemedText>
          )}

          <ThemedText type="subtitle">Crop information</ThemedText>
          {cropProfileFields.map((field) => {
            const value = crop.profile?.[field.key];
            const displayValue = Array.isArray(value) ? value.join(', ') : value;
            return (
              <View key={field.key} style={[styles.profileCard, { backgroundColor: theme.card }]}>
                <ThemedText type="smallBold">{field.label}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {displayValue || 'Unknown — no reviewed information recorded.'}
                </ThemedText>
              </View>
            );
          })}

          <ThemedText type="subtitle">Varieties</ThemedText>
          {crop.varieties.length ? crop.varieties.map((variety) => (
            <View key={variety.id} style={[styles.profileCard, { backgroundColor: theme.card }]}>
              <ThemedText type="smallBold">{variety.name}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">{variety.region || 'Region not specified'}</ThemedText>
              {variety.notes ? <ThemedText type="small">{variety.notes}</ThemedText> : null}
              <ThemedText type="small" themeColor="textSecondary">{cropInformationStatusLabel(variety.information_status)}</ThemedText>
            </View>
          )) : <ThemedText type="small" themeColor="textSecondary">No varieties have been recorded.</ThemedText>}

          {fieldId ? (
            <PrimaryButton disabled={addingToField} onPress={addCropToField}>
              {addingToField ? 'Adding…' : `Record ${crop.name} in this field`}
            </PrimaryButton>
          ) : null}

          {isAdmin ? (
            <>
              <View style={[styles.adminPanel, { backgroundColor: theme.card }]}>
                <ThemedText type="subtitle">Manage crop profile</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  Only mark information verified when supported by a cited, region-appropriate source.
                </ThemedText>
                <ThemedText type="smallBold">Scientific name</ThemedText>
                <TextInput value={scientificName} onChangeText={setScientificName} maxLength={150} style={inputStyle} />
                <ThemedText type="smallBold">Description</ThemedText>
                <TextInput value={description} onChangeText={setDescription} maxLength={2000} multiline style={[inputStyle, styles.multiline]} />
                <ThemedText type="smallBold">Information status</ThemedText>
                <View style={styles.chips}>
                  {informationStatuses.map((status) => (
                    <Pressable
                      key={status}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: informationStatus === status }}
                      onPress={() => setInformationStatus(status)}
                      style={[styles.chip, { borderColor: informationStatus === status ? theme.primary : theme.border, backgroundColor: informationStatus === status ? theme.backgroundSelected : theme.backgroundElement }]}>
                      <ThemedText type="small">{status}</ThemedText>
                    </Pressable>
                  ))}
                </View>
                {cropProfileFields.map((field) => {
                  const value = profile[field.key];
                  const textValue = Array.isArray(value) ? value.join('\n') : value ?? '';
                  return (
                    <View key={field.key} style={styles.profileEditorField}>
                      <ThemedText type="smallBold">{field.label}{field.list ? ' (one per line)' : ''}</ThemedText>
                      <TextInput
                        value={textValue}
                        onChangeText={(text) => updateProfileField(field.key, text)}
                        maxLength={field.list ? 15000 : 1000}
                        multiline
                        style={[inputStyle, styles.multiline]}
                      />
                    </View>
                  );
                })}
                <PrimaryButton disabled={saving} onPress={saveProfile}>{saving ? 'Saving…' : 'Save crop profile'}</PrimaryButton>
              </View>
              <View style={[styles.adminPanel, { backgroundColor: theme.card }]}>
                <ThemedText type="smallBold">Add a region-specific variety</ThemedText>
                <TextInput value={varietyName} onChangeText={setVarietyName} placeholder="Variety name" maxLength={120} style={inputStyle} />
                <TextInput value={varietyRegion} onChangeText={setVarietyRegion} placeholder="Region (optional)" maxLength={100} style={inputStyle} />
                <TextInput value={varietyNotes} onChangeText={setVarietyNotes} placeholder="Notes (optional)" maxLength={1000} multiline style={[inputStyle, styles.multiline]} />
                <PrimaryButton disabled={saving || !varietyName.trim()} onPress={addVariety}>
                  {saving ? 'Saving…' : 'Add variety'}
                </PrimaryButton>
              </View>
            </>
          ) : null}
        </>
      ) : null}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  notice: { padding: Spacing.three, borderRadius: 16, gap: Spacing.one },
  profileCard: { padding: Spacing.three, borderRadius: 14, gap: Spacing.one },
  adminPanel: { padding: Spacing.three, borderRadius: 16, gap: Spacing.two },
  profileEditorField: { gap: Spacing.one },
  input: { borderWidth: 1, padding: Spacing.three, borderRadius: 12 },
  multiline: { minHeight: 72, textAlignVertical: 'top' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two },
});
