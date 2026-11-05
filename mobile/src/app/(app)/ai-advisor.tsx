import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { AppScreen } from '@/components/ui/app-screen';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { apiRequest } from '@/lib/api';
import type { Farm } from '@/components/ui/farm-card';

interface AdvisorInsight {
  title: string;
  detail: string;
  actionLabel: string;
  action: string;
}

export default function AIFarmAdvisorScreen() {
  const theme = useTheme();
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    apiRequest<{ farms: Farm[] }>('/farms')
      .then(({ farms: records }) => {
        if (!active) return;
        setFarms(records);
        setError('');
      })
      .catch((loadError: unknown) => {
        if (!active) return;
        setError(loadError instanceof Error ? loadError.message : 'Unable to load farm advisor data');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const insights = useMemo<AdvisorInsight[]>(() => {
    const farmCount = farms.length;
    if (!farmCount) {
      return [{
        title: 'Start with a farm profile',
        detail: 'Add your first farm and fields so the advisor can suggest the next best learning step.',
        actionLabel: 'Add a farm',
        action: '/(app)/farm/create',
      }];
    }

    const fieldCovered = farms.filter((farm) => Number(farm.field_count ?? 0) > 0).length;
    const mappedFarms = farms.filter((farm) => farm.latitude != null && farm.longitude != null).length;
    const cropPlanReady = farms.filter((farm) => (farm.main_crops ?? []).length > 0).length;

    if (fieldCovered < farmCount) {
      return [{
        title: 'Add field details',
        detail: 'Most farms still need field records to make crop and irrigation recommendations more useful.',
        actionLabel: 'Review farms',
        action: '/(app)/farm',
      }];
    }

    if (mappedFarms < farmCount) {
      return [{
        title: 'Complete the farm map',
        detail: 'A few farms are missing location data; the map becomes much more useful when each field has coordinates.',
        actionLabel: 'Open map',
        action: '/(app)/map',
      }];
    }

    if (cropPlanReady < farmCount) {
      return [{
        title: 'Define crop focus',
        detail: 'Main crop information helps the advisor tie recommendations to the right crop mix and production system.',
        actionLabel: 'Review profiles',
        action: '/(app)/farm',
      }];
    }

    return [{
      title: 'Next best move',
      detail: 'Your farm records are in good shape. Run a scenario to compare irrigation and fertilizer choices before making a field decision.',
      actionLabel: 'Run a scenario',
      action: '/(app)/simulate',
    }];
  }, [farms]);

  const primaryInsight = insights[0];

  return (
    <AppScreen title="AI Farm Advisor" subtitle="Rule-based guidance from your farm records and scenario history.">
      {error ? <ThemedText style={{ color: theme.error }}>{error}</ThemedText> : null}
      {loading ? <ThemedText themeColor="textSecondary">Loading advisor data…</ThemedText> : null}

      {!loading && primaryInsight ? (
        <>
          <View style={[styles.panel, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            <ThemedText type="smallBold">Priority insight</ThemedText>
            <ThemedText type="smallBold">{primaryInsight.title}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">{primaryInsight.detail}</ThemedText>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push(primaryInsight.action as never)}
              style={[styles.primaryButton, { backgroundColor: theme.primary }]}>
              <ThemedText style={{ color: '#fff', fontWeight: '700' }}>{primaryInsight.actionLabel}</ThemedText>
            </Pressable>
          </View>

          <View style={[styles.panel, { backgroundColor: theme.card }]}>
            <ThemedText type="smallBold">Scenario context</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {farms.length ? `You currently have ${farms.length} farm profile${farms.length === 1 ? '' : 's'} with ${farms.filter((farm) => Number(farm.field_count ?? 0) > 0).length} field set${farms.filter((farm) => Number(farm.field_count ?? 0) > 0).length === 1 ? '' : 's'} and ${farms.filter((farm) => farm.latitude != null && farm.longitude != null).length} map-ready location${farms.filter((farm) => farm.latitude != null && farm.longitude != null).length === 1 ? '' : 's'}.` : 'No farm context yet.'}
            </ThemedText>
          </View>

          <View style={[styles.panel, { backgroundColor: theme.card }]}>
            <ThemedText type="smallBold">Advisor rules</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              • Uses local farm, field, and scenario records only.
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              • No live weather, sensor, or external AI model is connected in this build.
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              • Educational guidance only; these suggestions are not agronomic prescriptions.
            </ThemedText>
          </View>
        </>
      ) : null}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  panel: { borderWidth: 1, borderRadius: 18, padding: Spacing.three, gap: Spacing.two, marginBottom: Spacing.two },
  primaryButton: { alignItems: 'center', justifyContent: 'center', borderRadius: 12, paddingVertical: Spacing.two },
});
