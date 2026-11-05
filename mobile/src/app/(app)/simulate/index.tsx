import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { AppScreen } from '@/components/ui/app-screen';
import { PrimaryButton } from '@/components/ui/primary-button';
import { ScenarioSlider } from '@/components/ui/scenario-slider';
import { Spacing } from '@/constants/theme';
import { apiRequest } from '@/lib/api';
import { useTheme } from '@/hooks/use-theme';

interface Scenario {
  id: string;
  name: string;
  description: string;
}

interface SimulationResponse {
  runId: string;
  yieldKg: number;
  baselineYieldKg: number;
  waterLiters: number;
  baselineWaterLiters: number;
  cost: number;
  baselineCost: number;
  score: number;
}

export default function SimulationScreen() {
  const theme = useTheme();
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [scenarioId, setScenarioId] = useState('crop-growth');
  const [irrigationPercent, setIrrigationPercent] = useState(80);
  const [fertilizerPercent, setFertilizerPercent] = useState(100);
  const [plantingDate, setPlantingDate] = useState('');
  const [error, setError] = useState('');
  const [running, setRunning] = useState(false);

  useEffect(() => {
    apiRequest<{ scenarios: Scenario[] }>('/scenarios')
      .then(({ scenarios: options }) => {
        setScenarios(options);
        if (options.length) {
          setScenarioId((current) => options.some((scenario) => scenario.id === current) ? current : options[0].id);
        }
      })
      .catch((loadError: unknown) => setError(loadError instanceof Error ? loadError.message : 'Unable to load scenarios'));
  }, []);

  async function runSimulation() {
    setRunning(true);
    setError('');
    try {
      const result = await apiRequest<SimulationResponse>('/scenarios/run', {
        method: 'POST',
        body: JSON.stringify({ scenarioId, irrigationPercent, fertilizerPercent, plantingDate: plantingDate || null }),
      });
      router.push({
        pathname: '/(app)/simulate/results',
        params: {
          runId: result.runId,
          yieldKg: String(result.yieldKg),
          baselineYieldKg: String(result.baselineYieldKg),
          waterLiters: String(result.waterLiters),
          baselineWaterLiters: String(result.baselineWaterLiters),
          cost: String(result.cost),
          baselineCost: String(result.baselineCost),
          score: String(result.score),
        },
      });
    } catch (runError) {
      setError(runError instanceof Error ? runError.message : 'Unable to run this simulation');
    } finally {
      setRunning(false);
    }
  }

  return (
    <AppScreen title="Simulate" subtitle="Change an input and explore the outcome.">
      <View style={styles.scenarioList}>
        {scenarios.map((scenario) => {
          const selected = scenario.id === scenarioId;
          return (
            <Pressable
              key={scenario.id}
              onPress={() => setScenarioId(scenario.id)}
              style={[styles.scenario, { backgroundColor: selected ? theme.backgroundSelected : theme.backgroundElement, borderColor: selected ? theme.primaryText : theme.border }]}>
              <ThemedText type="smallBold">{scenario.name}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">{scenario.description}</ThemedText>
            </Pressable>
          );
        })}
      </View>

      <View style={[styles.panel, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        <ThemedText type="smallBold">Adjust your inputs</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">Set each input as a percentage of the baseline.</ThemedText>
        <ScenarioSlider label="Irrigation" value={irrigationPercent} onChange={setIrrigationPercent} />
        <ScenarioSlider label="Fertilizer" value={fertilizerPercent} onChange={setFertilizerPercent} />
        <View style={styles.dateField}>
          <ThemedText type="smallBold">Planting date (optional)</ThemedText>
          <TextInput value={plantingDate} onChangeText={setPlantingDate} placeholder="YYYY-MM-DD" placeholderTextColor={theme.textSecondary} style={[styles.dateInput, { borderColor: theme.border, backgroundColor: theme.card, color: theme.text }]} />
        </View>
      </View>
      {error ? <ThemedText style={{ color: theme.error }}>{error}</ThemedText> : null}
      <PrimaryButton onPress={runSimulation} disabled={running || !scenarios.length}>
        {running ? 'Running…' : 'Run simulation'}
      </PrimaryButton>
      <Pressable onPress={() => router.push('/(app)/scenario-library' as never)} style={styles.history}>
        <ThemedText type="smallBold" style={{ color: theme.primaryText }}>Browse scenario library</ThemedText>
      </Pressable>
      <Pressable onPress={() => router.push('/(app)/simulate/runs')} style={styles.history}>
        <ThemedText type="smallBold" style={{ color: theme.primaryText }}>View past results</ThemedText>
      </Pressable>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  scenarioList: { gap: Spacing.two },
  scenario: { borderWidth: 1, borderRadius: 16, padding: Spacing.three, gap: Spacing.one },
  panel: { padding: Spacing.three, borderRadius: 18, borderWidth: 1, gap: Spacing.three },
  history: { alignItems: 'center', padding: Spacing.two },
  dateField: { gap: Spacing.one },
  dateInput: { borderWidth: 1, padding: Spacing.two, borderRadius: 12 },
});
