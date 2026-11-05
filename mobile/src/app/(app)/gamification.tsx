import { View, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { AppScreen } from '@/components/ui/app-screen';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const achievements = [
  {
    id: 'farm-profile',
    title: 'Farm profile',
    description: 'Create and save your first farm profile.',
    points: 40,
    earned: true,
  },
  {
    id: 'field-setup',
    title: 'Field setup',
    description: 'Add a field with baseline soil and crop details.',
    points: 60,
    earned: true,
  },
  {
    id: 'scenario-run',
    title: 'Scenario run',
    description: 'Complete a simulation run and review the score change.',
    points: 40,
    earned: false,
  },
] as const;

export default function GamificationScreen() {
  const theme = useTheme();
  const level = 2;
  const totalPoints = achievements.reduce((sum, item) => sum + (item.earned ? item.points : 0), 0);
  const nextLevelAt = 200;

  return (
    <AppScreen
      title="Farm progress & rewards"
      subtitle="Verified actions unlock levels and achievement history without duplicate rewards.">
      <View style={[styles.summary, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}> 
        <ThemedText type="subtitle">Level {level}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {totalPoints} / {nextLevelAt} points earned
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Next unlock: finish one verified scenario to reach level {level + 1}.
        </ThemedText>
      </View>

      <View style={styles.list}>
        {achievements.map((achievement) => (
          <View
            key={achievement.id}
            style={[
              styles.item,
              {
                backgroundColor: theme.backgroundElement,
                borderColor: achievement.earned ? theme.primary : theme.border,
              },
            ]}>
            <View
              style={[
                styles.dot,
                {
                  backgroundColor: achievement.earned ? theme.primary : theme.border,
                },
              ]}
            />
            <View style={styles.content}>
              <ThemedText type="smallBold">{achievement.title}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {achievement.description}
              </ThemedText>
            </View>
            <ThemedText type="smallBold" style={{ color: achievement.earned ? theme.primaryText : theme.textSecondary }}>
              {achievement.earned ? `${achievement.points} pts` : 'Locked'}
            </ThemedText>
          </View>
        ))}
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  summary: {
    borderWidth: 1,
    borderRadius: 18,
    padding: Spacing.three,
    gap: Spacing.one,
    marginBottom: Spacing.three,
  },
  list: {
    gap: Spacing.two,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: 1,
    borderRadius: 18,
    padding: Spacing.three,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 999,
  },
  content: {
    flex: 1,
    gap: Spacing.half,
  },
});
