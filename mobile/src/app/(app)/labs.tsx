import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { AppScreen } from '@/components/ui/app-screen';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const labs = [
  {
    id: 'crop-lab',
    icon: '🌾',
    title: 'Crop Lab',
    description: 'Review crop profiles, varieties, growth stage notes, and agronomic references.',
    path: '/(app)/crop-library/index',
  },
  {
    id: 'soil-lab',
    icon: '🧪',
    title: 'Soil Lab',
    description: 'Check field soil records, measurements, and quality trends over time.',
    path: '/(app)/farm',
  },
  {
    id: 'water-lab',
    icon: '💧',
    title: 'Water Lab',
    description: 'Compare irrigation plans and understand water-efficiency trade-offs in simulations.',
    path: '/(app)/simulate',
  },
  {
    id: 'scenario-library',
    icon: '📚',
    title: 'Scenario library',
    description: 'Browse the available learning scenarios and choose the right experiment before running it.',
    path: '/(app)/scenario-library',
  },
  {
    id: 'farm-simulator',
    icon: '🚜',
    title: 'Farm Simulator',
    description: 'Run scenario-based experiments with inputs, yields, costs, and score comparisons.',
    path: '/(app)/simulate',
  },
  {
    id: 'ai-advisor',
    icon: '🤖',
    title: 'AI Farm Advisor',
    description: 'Get rule-based guidance from your farm, field, and scenario context with clear source and uncertainty disclosure.',
    path: '/(app)/ai-advisor',
  },
  {
    id: 'gamification',
    icon: '🏆',
    title: 'Gamification',
    description: 'Track verified milestones, unlock rewards, and keep a clean achievement history for your farm learning journey.',
    path: '/(app)/gamification',
  },
  {
    id: 'leaderboard',
    icon: '📊',
    title: 'Leaderboard',
    description: 'Review cohort rankings with consent-aware visibility and trainer-only institutional scope.',
    path: '/(app)/leaderboard',
  },
  {
    id: 'journal',
    icon: '📝',
    title: 'Journal & feedback',
    description: 'Capture observations and review trainer guidance on learner progress and field notes.',
    path: '/(app)/journal',
  },
  {
    id: 'analytics',
    icon: '📈',
    title: 'Analytics',
    description: 'Track participation, trend momentum, and the main activity types behind learner progress.',
    path: '/(app)/analytics',
  },
  {
    id: 'reports',
    icon: '📄',
    title: 'Certificates & reports',
    description: 'Share verified reports from completed farm runs and generate learner certificates with traceable tokens.',
    path: '/(app)/reports',
  },
  {
    id: 'offline-support',
    icon: '📶',
    title: 'Offline sync',
    description: 'Queue farm edits locally, retry safely when the network is intermittent, and detect conflicting updates before sync.',
    path: '/(app)/offline',
  },
  {
    id: 'agribusiness-lab',
    icon: '📦',
    title: 'Agribusiness Lab',
    description: 'Browse supply needs, pricing, and the market flows tied to farm productivity.',
    path: '/(app)/market',
  },
  {
    id: 'smart-agriculture',
    icon: '📡',
    title: 'Smart Agriculture',
    description: 'Use the farm map, field records, and operational notes to coordinate location-based decisions.',
    path: '/(app)/map',
  },
] as const;

export default function LaboratoriesScreen() {
  const theme = useTheme();

  return (
    <AppScreen
      title="Agri laboratories"
      subtitle="Seven practical learning spaces for crop, soil, water, field, market, and decision support.">
      <View style={styles.intro}>
        <ThemedText type="small" themeColor="textSecondary">
          Each laboratory opens a domain-specific workflow using your existing farm and scenario data.
        </ThemedText>
      </View>

      <View style={styles.grid}>
        {labs.map((lab) => (
          <Pressable
            key={lab.id}
            accessibilityRole="button"
            onPress={() => router.push(lab.path as never)}
            style={({ pressed }) => [
              styles.card,
              {
                backgroundColor: theme.backgroundElement,
                borderColor: theme.border,
                opacity: pressed ? 0.9 : 1,
              },
            ]}>
            <ThemedText style={styles.icon}>{lab.icon}</ThemedText>
            <ThemedText type="smallBold">{lab.title}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">{lab.description}</ThemedText>
            <ThemedText type="smallBold" style={{ color: theme.primaryText }}>Open lab</ThemedText>
          </Pressable>
        ))}
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  intro: { marginBottom: Spacing.two },
  grid: { gap: Spacing.two },
  card: {
    borderWidth: 1,
    borderRadius: 18,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  icon: { fontSize: 28 },
});
