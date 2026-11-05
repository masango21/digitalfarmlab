import { Link, router, useFocusEffect, useLocalSearchParams } from 'expo-router';
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
import { cropCategories, cropCategoryLabel, type CropCategory, type CropLibraryEntry } from '@/lib/crop-library';

interface CropListResponse {
  crops: CropLibraryEntry[];
  pagination: { limit: number; offset: number; hasMore: boolean };
}

export default function CropLibraryScreen() {
  const theme = useTheme();
  const { user } = useAuth();
  const { fieldId } = useLocalSearchParams<{ fieldId?: string }>();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<CropCategory | ''>('');
  const [crops, setCrops] = useState<CropLibraryEntry[]>([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [newCropName, setNewCropName] = useState('');
  const [newCropCategory, setNewCropCategory] = useState<CropCategory>('cereals_grains');
  const [saving, setSaving] = useState(false);

  const loadCrops = useCallback((nextOffset = 0, append = false) => {
    let active = true;
    const timer = setTimeout(() => {
      const params = new URLSearchParams({ q: search.trim(), limit: '50', offset: String(nextOffset) });
      if (category) params.set('category', category);
      apiRequest<CropListResponse>(`/crop-library?${params.toString()}`)
        .then((response) => {
          if (!active) return;
          setCrops((current) => append ? [...current, ...response.crops] : response.crops);
          setOffset(nextOffset);
          setHasMore(response.pagination.hasMore);
          setError('');
        })
        .catch((loadError: unknown) => {
          if (active) setError(loadError instanceof Error ? loadError.message : 'Unable to load the crop library');
        })
        .finally(() => {
          if (active) {
            setLoading(false);
            setLoadingMore(false);
          }
        });
    }, 180);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [category, search]);

  useFocusEffect(useCallback(() => loadCrops(), [loadCrops]));

  async function createCrop() {
    setSaving(true);
    setError('');
    try {
      const response = await apiRequest<{ crop: CropLibraryEntry }>('/crop-library', {
        method: 'POST',
        body: JSON.stringify({ name: newCropName.trim(), category: newCropCategory }),
      });
      setNewCropName('');
      router.push({
        pathname: '/(app)/crop-library/[id]',
        params: { id: response.crop.id, ...(fieldId ? { fieldId } : {}) },
      });
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to add crop');
    } finally {
      setSaving(false);
    }
  }

  function showCrop(crop: CropLibraryEntry) {
    router.push({
      pathname: '/(app)/crop-library/[id]',
      params: { id: crop.id, ...(fieldId ? { fieldId } : {}) },
    });
  }

  return (
    <AppScreen
      title="Crop library"
      subtitle="Search crops by name or category. Profile values are marked when they are estimates or still unverified."
      action={fieldId ? <Link href={{ pathname: '/(app)/field/[id]/crops', params: { id: fieldId } }} style={{ color: theme.primaryText }}>Back to field</Link> : undefined}>
      <TextInput
        value={search}
        onChangeText={(value) => {
          setLoading(true);
          setSearch(value);
        }}
        placeholder="Search crops"
        placeholderTextColor={theme.textSecondary}
        accessibilityLabel="Search crop library"
        style={[styles.input, { borderColor: theme.border, backgroundColor: theme.card, color: theme.text }]}
      />
      <View style={styles.chips}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: !category }}
          onPress={() => { setLoading(true); setCategory(''); }}
          style={[styles.chip, { borderColor: category ? theme.border : theme.primary, backgroundColor: category ? theme.card : theme.backgroundSelected }]}>
          <ThemedText type="smallBold">All categories</ThemedText>
        </Pressable>
        {cropCategories.map((item) => (
          <Pressable
            key={item.value}
            accessibilityRole="button"
            accessibilityState={{ selected: category === item.value }}
            onPress={() => { setLoading(true); setCategory(item.value); }}
            style={[styles.chip, { borderColor: category === item.value ? theme.primary : theme.border, backgroundColor: category === item.value ? theme.backgroundSelected : theme.card }]}>
            <ThemedText type="smallBold">{item.label}</ThemedText>
          </Pressable>
        ))}
      </View>

      {fieldId ? (
        <View style={[styles.notice, { backgroundColor: theme.backgroundSelected }]}>
          <ThemedText type="smallBold">Add a library crop to this field</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">Open a crop profile to record it as a field crop. Field notes and dates stay editable.</ThemedText>
        </View>
      ) : null}
      {error ? <ContentState variant="error" title="Unable to load crops" message={error} /> : null}
      {loading ? <ContentState variant="loading" message="Loading crop library…" /> : null}
      {!loading && !error && !crops.length ? <ContentState variant="empty" title="No crops found" message="Try a different search or category." /> : null}
      {crops.map((crop) => (
        <Pressable
          key={crop.id}
          accessibilityRole="button"
          onPress={() => showCrop(crop)}
          style={[styles.cropCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.cardHeading}>
            <ThemedText type="smallBold">{crop.name}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">{cropCategoryLabel(crop.category)}</ThemedText>
          </View>
          {crop.scientific_name ? <ThemedText type="small" themeColor="textSecondary">{crop.scientific_name}</ThemedText> : null}
          <ThemedText type="small" themeColor="textSecondary">
            {crop.information_status === 'verified' ? 'Reviewed' : crop.information_status === 'estimated' ? 'Estimates included' : 'Profile details need review'}
          </ThemedText>
        </Pressable>
      ))}
      {!loading && hasMore ? (
        <PrimaryButton
          disabled={loadingMore}
          onPress={() => {
            setLoadingMore(true);
            const cleanup = loadCrops(offset + 50, true);
            void cleanup;
          }}>
          {loadingMore ? 'Loading…' : 'Load more crops'}
        </PrimaryButton>
      ) : null}

      {user?.role === 'admin' ? (
        <View style={[styles.adminPanel, { backgroundColor: theme.card }]}>
          <ThemedText type="smallBold">Add a crop to the library</ThemedText>
          <TextInput
            value={newCropName}
            onChangeText={setNewCropName}
            placeholder="Crop name"
            placeholderTextColor={theme.textSecondary}
            maxLength={100}
            style={[styles.input, { borderColor: theme.border, backgroundColor: theme.backgroundElement, color: theme.text }]}
          />
          <View style={styles.chips}>
            {cropCategories.map((item) => (
              <Pressable
                key={item.value}
                accessibilityRole="radio"
                accessibilityState={{ checked: newCropCategory === item.value }}
                onPress={() => setNewCropCategory(item.value)}
                style={[styles.chip, { borderColor: newCropCategory === item.value ? theme.primary : theme.border, backgroundColor: newCropCategory === item.value ? theme.backgroundSelected : theme.backgroundElement }]}>
                <ThemedText type="small">{item.label}</ThemedText>
              </Pressable>
            ))}
          </View>
          <PrimaryButton disabled={saving || !newCropName.trim()} onPress={createCrop}>
            {saving ? 'Saving…' : 'Add crop and complete profile'}
          </PrimaryButton>
        </View>
      ) : null}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  input: { borderWidth: 1, padding: Spacing.three, borderRadius: 14 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two },
  notice: { padding: Spacing.three, borderRadius: 16, gap: Spacing.one },
  cropCard: { borderWidth: 1, borderRadius: 16, padding: Spacing.three, gap: Spacing.one },
  cardHeading: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: Spacing.two },
  adminPanel: { padding: Spacing.three, borderRadius: 16, gap: Spacing.two },
});
