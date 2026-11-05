import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { AppScreen } from '@/components/ui/app-screen';
import { PrimaryButton } from '@/components/ui/primary-button';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { apiRequest } from '@/lib/api';

interface Scenario {
  id: string;
  name: string;
  description: string;
}

interface ScenarioProfile {
  category: string;
  objective: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  inputs: string[];
}

const scenarioProfiles: Record<string, ScenarioProfile> = {
  'crop-growth': {
    category: 'Crop growth',
    objective: 'Understand how seasonal inputs shape yield and cost.',
    difficulty: 'Beginner',
    inputs: ['Irrigation', 'Fertilizer', 'Planting date'],
  },
  'water-saving': {
    category: 'Water efficiency',
    objective: 'Find the balance between crop performance and reduced irrigation.',
    difficulty: 'Intermediate',
    inputs: ['Irrigation', 'Water stress', 'Yield trade-offs'],
  },
  'soil-health': {
    category: 'Soil health',
    objective: 'Compare input choices for resilience, water use, and farm economics.',
    difficulty: 'Intermediate',
    inputs: ['Fertilizer', 'Input ratio', 'Season planning'],
  },
};

export default function ScenarioLibraryScreen() {
  const theme = useTheme();
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    apiRequest<{ scenarios: Scenario[] }>('/scenarios')
      .then(({ scenarios: options }) => {
        if (!active) return;
        setScenarios(options);
        setError('');
      })
      .catch((loadError: unknown) => {
        if (!active) return;
        setError(loadError instanceof Error ? loadError.message : 'Unable to load scenario library');
      });

    return () => {
      active = false;
    };
  }, []);

  const cards = useMemo(
    () => scenarios.map((scenario) => ({
      ...scenario,
      profile: scenarioProfiles[scenario.id] ?? {
        category: 'General practice',
        objective: 'Explore input choices and compare outcomes in a guided learning scenario.',
        difficulty: 'Beginner' as const,
        inputs: ['Irrigation', 'Fertilizer'],
      },
    })),
    [scenarios],
  );

  return (
    <AppScreen title="Scenario library" subtitle="Browse the learning scenarios available in the current farm simulator.">
      {error ? <ThemedText style={{ color: theme.error }}>{error}</ThemedText> : null}

      <View style={styles.summaryBox}>
        <ThemedText type="smallBold">Learning focus</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Each scenario introduces a different decision lens: crop growth, water efficiency, and soil health.
        </ThemedText>
      </View>

      <View style={styles.list}>
        {cards.map((scenario) => (
          <View key={scenario.id} style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            <View style={styles.headerRow}>
              <ThemedText type="smallBold">{scenario.name}</ThemedText>
              <View style={[styles.badge, { backgroundColor: theme.backgroundSelected }]}>
                <ThemedText type="small" style={{ color: theme.primaryText }}>{scenario.profile.difficulty}</ThemedText>
              </View>
            </View>

            <ThemedText type="small" themeColor="textSecondary">{scenario.profile.category}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">{scenario.description}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">Objective: {scenario.profile.objective}</ThemedText>

            <View style={styles.tagRow}>
              {scenario.profile.inputs.map((input) => (
                <View key={`${scenario.id}-${input}`} style={[styles.tag, { backgroundColor: theme.backgroundSelected }]}>
                  <ThemedText type="small" style={{ color: theme.primaryText }}>{input}</ThemedText>
                </View>
              ))}
            </View>

            <PrimaryButton onPress={() => router.push('/(app)/simulate' as never)}>
              Open simulation
            </PrimaryButton>
          </View>
        ))}
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  summaryBox: { padding: Spacing.three, borderRadius: 16, borderWidth: 1, borderColor: 'transparent', marginBottom: Spacing.two },
  list: { gap: Spacing.two },
  card: { borderWidth: 1, borderRadius: 18, padding: Spacing.three, gap: Spacing.two },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: Spacing.two },
  badge: { paddingHorizontal: Spacing.two, paddingVertical: Spacing.one, borderRadius: 999 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.one },
  tag: { paddingHorizontal: Spacing.two, paddingVertical: Spacing.one, borderRadius: 999 },
});
