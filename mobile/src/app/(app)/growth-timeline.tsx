import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { AppScreen } from '@/components/ui/app-screen';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { apiRequest } from '@/lib/api';
import { cropGrowthStageLabel, cropGrowthStages, type CropRecord } from '@/lib/field-records';

interface TimelineStage {
  value: string;
  label: string;
  status: 'completed' | 'current' | 'projected';
  note: string;
}

export default function GrowthTimelineScreen() {
  const theme = useTheme();
  const { fieldId, fieldName } = useLocalSearchParams<{ fieldId?: string; fieldName?: string }>();
  const [crops, setCrops] = useState<CropRecord[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!fieldId) return;

    let active = true;
    apiRequest<{ crops: CropRecord[] }>(`/fields/${fieldId}/crops`)
      .then(({ crops: records }) => {
        if (!active) return;
        setCrops(records);
        setError('');
      })
      .catch((loadError: unknown) => {
        if (!active) return;
        setError(loadError instanceof Error ? loadError.message : 'Unable to load crop timeline');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [fieldId]);

  const timeline = useMemo(() => {
    if (!crops.length) return [] as TimelineStage[];

    const primaryCrop = crops[0];
    const currentIndex = cropGrowthStages.findIndex((stage) => stage.value === primaryCrop.growth_stage);
    const currentStageIndex = currentIndex >= 0 ? currentIndex : 0;

    return cropGrowthStages.map((stage, index) => {
      const completed = index < currentStageIndex;
      const current = index === currentStageIndex && primaryCrop.growth_stage;
      const note = completed
        ? 'Observed in field records.'
        : current
          ? 'Current recorded growth stage.'
          : 'Projected stage based on the current schedule.';

      return {
        value: stage.value,
        label: stage.label,
        status: completed ? 'completed' : current ? 'current' : 'projected',
        note,
      };
    });
  }, [crops]);

  const activeCrop = crops[0];
  const projectedStress = activeCrop?.water_requirement_notes?.toLowerCase().includes('stress') || activeCrop?.nutrient_requirement_notes?.toLowerCase().includes('stress')
    ? 'Watch for moisture or nutrient stress in the next stage.'
    : 'No acute stress indicator recorded; continue observing field conditions and crop notes.';

  return (
    <AppScreen
      title="Growth timeline"
      subtitle={fieldName ? `${fieldName} crop progression` : 'Crop progression and educational time-lapse view.'}>
      {error ? <ThemedText style={{ color: theme.error }}>{error}</ThemedText> : null}
      {loading ? <ThemedText themeColor="textSecondary">Loading crop timeline…</ThemedText> : null}

      {!loading && activeCrop ? (
        <>
          <View style={[styles.summary, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            <ThemedText type="smallBold">{activeCrop.name}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Current stage: {cropGrowthStageLabel(activeCrop.growth_stage)}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Planted: {activeCrop.planted_at ? new Date(`${activeCrop.planted_at.slice(0, 10)}T00:00:00`).toLocaleDateString() : 'Not recorded'}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Expected harvest: {activeCrop.expected_harvest_at ? new Date(`${activeCrop.expected_harvest_at.slice(0, 10)}T00:00:00`).toLocaleDateString() : 'Not recorded'}
            </ThemedText>
          </View>

          <View style={[styles.panel, { backgroundColor: theme.card }]}>
            <ThemedText type="smallBold">Field progression</ThemedText>
            {timeline.map((stage) => (
              <View key={stage.value} style={[styles.timelineRow, stage.status === 'current' && { borderColor: theme.primaryText }]}>
                <View style={[styles.dot, {
                  backgroundColor: stage.status === 'completed' ? theme.primaryText : stage.status === 'current' ? theme.backgroundSelected : theme.border,
                  borderColor: stage.status === 'current' ? theme.primaryText : theme.border,
                }]} />
                <View style={styles.timelineCopy}>
                  <ThemedText type="smallBold">{stage.label}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">{stage.note}</ThemedText>
                </View>
              </View>
            ))}
          </View>

          <View style={[styles.panel, { backgroundColor: theme.card }]}>
            <ThemedText type="smallBold">Stress and projection notes</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">{projectedStress}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              These stage transitions are educational estimates derived from the crop schedule and recorded field notes; they are not agronomic prescriptions.
            </ThemedText>
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={() => router.push({
              pathname: '/(app)/field/[id]/crops',
              params: { id: fieldId ?? '', fieldName: fieldName ?? '' },
            } as never)}
            style={[styles.actionButton, { backgroundColor: theme.backgroundSelected }]}>
            <ThemedText type="smallBold" style={{ color: theme.primaryText }}>Back to crop records</ThemedText>
          </Pressable>
        </>
      ) : null}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  summary: { borderWidth: 1, borderRadius: 18, padding: Spacing.three, gap: Spacing.one, marginBottom: Spacing.two },
  panel: { borderRadius: 18, padding: Spacing.three, gap: Spacing.two, marginBottom: Spacing.two },
  timelineRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.two, borderLeftWidth: 2, paddingLeft: Spacing.two, paddingVertical: Spacing.one },
  dot: { width: 12, height: 12, borderRadius: 999, borderWidth: 2, marginTop: 4 },
  timelineCopy: { flex: 1, gap: Spacing.one },
  actionButton: { borderRadius: 12, padding: Spacing.two, alignItems: 'center' },
});
