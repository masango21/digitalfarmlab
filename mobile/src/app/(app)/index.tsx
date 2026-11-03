import { Link, router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { AppScreen } from '@/components/ui/app-screen';
import { FarmCard, type Farm } from '@/components/ui/farm-card';
import { PrimaryButton } from '@/components/ui/primary-button';
import { StatCard } from '@/components/ui/stat-card';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth';
import { apiRequest } from '@/lib/api';

interface RunsResponse {
  runs: { score: number | string; scenario_name: string; created_at: string }[];
}

interface DashboardProfile {
  profile: { pending_task_count: number | string };
}

export default function DashboardScreen() {
  const theme = useTheme();
  const { user } = useAuth();
  const [farms, setFarms] = useState<Farm[]>([]);
  const [runs, setRuns] = useState<RunsResponse['runs']>([]);
  const [pendingTasks, setPendingTasks] = useState(0);
  const [error, setError] = useState('');
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [farmDataAvailable, setFarmDataAvailable] = useState(false);
  const [taskDataAvailable, setTaskDataAvailable] = useState(false);
  const [runDataAvailable, setRunDataAvailable] = useState(false);

  useFocusEffect(useCallback(() => {
    let active = true;
    Promise.allSettled([
      apiRequest<{ farms: Farm[] }>('/farms'),
      apiRequest<RunsResponse>('/scenarios/runs'),
      apiRequest<DashboardProfile>('/profile'),
    ]).then(([farmResult, runResult, profileResult]) => {
      if (!active) return;
      const failures: string[] = [];
      if (farmResult.status === 'fulfilled') {
        setFarms(farmResult.value.farms);
        setFarmDataAvailable(true);
      } else {
        failures.push(farmResult.reason instanceof Error ? farmResult.reason.message : 'Unable to load farms');
      }
      if (runResult.status === 'fulfilled') {
        setRuns(runResult.value.runs);
        setRunDataAvailable(true);
      } else {
        failures.push(runResult.reason instanceof Error ? runResult.reason.message : 'Unable to load simulations');
      }
      if (profileResult.status === 'fulfilled') {
        setPendingTasks(Number(profileResult.value.profile.pending_task_count));
        setTaskDataAvailable(true);
      } else {
        failures.push(profileResult.reason instanceof Error ? profileResult.reason.message : 'Unable to load tasks');
      }
      setError(failures.join(' · '));
    }).finally(() => {
      if (active) setDashboardLoading(false);
    });
    return () => {
      active = false;
    };
  }, []));

  const latestScore = runs[0] ? Number(runs[0].score) : null;
  const fieldCount = farms.reduce((total, farm) => total + Number(farm.field_count ?? 0), 0);

  return (
    <AppScreen
      title={`Hello, ${user?.display_name.split(' ')[0] || 'farmer'}`}
      subtitle="Your farm, tasks, and learning at a glance.">
      {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}
      {dashboardLoading ? (
        <ThemedText themeColor="textSecondary">Loading farm records…</ThemedText>
      ) : (
        <View style={styles.stats}>
          <StatCard label="My farms" value={farmDataAvailable ? String(farms.length) : '—'} helper={farmDataAvailable ? 'Farm profiles' : 'Unavailable'} />
          <StatCard label="Managed fields" value={farmDataAvailable ? String(fieldCount) : '—'} helper={farmDataAvailable ? 'Fields recorded' : 'Unavailable'} />
          <StatCard label="Pending tasks" value={taskDataAvailable ? String(pendingTasks) : '—'} helper={taskDataAvailable ? 'To keep your farm on track' : 'Unavailable'} />
          <StatCard label="Last score" value={!runDataAvailable ? '—' : latestScore === null ? '—' : `${latestScore}`} helper={!runDataAvailable ? 'Unavailable' : latestScore === null ? 'Run a scenario' : 'out of 100'} />
        </View>
      )}

      <View style={styles.sectionHeading}>
        <ThemedText type="smallBold">Farm overview</ThemedText>
        <Link href="/(app)/farm" style={{ color: theme.primary }}>See all</Link>
      </View>
      {dashboardLoading ? null : !farmDataAvailable ? (
        <ThemedText type="small" themeColor="textSecondary">Farm overview is unavailable until your records finish loading.</ThemedText>
      ) : farms.length ? farms.slice(0, 3).map((farm) => (
        <FarmCard
          key={farm.id}
          farm={farm}
          onPress={() => router.push({ pathname: '/(app)/farm/[id]', params: { id: farm.id } })}
        />
      )) : (
        <View style={[styles.emptyFarm, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          <ThemedText type="smallBold">Start with your farm profile</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Add your farm and fields to keep operational records together. Weather and field conditions appear only when recorded or connected.
          </ThemedText>
          <PrimaryButton onPress={() => router.push('/(app)/farm/create')}>Create a farm</PrimaryButton>
        </View>
      )}

      <View style={[styles.hero, { backgroundColor: theme.primary }]}>
        <ThemedText type="smallBold" style={styles.heroEyebrow}>YOUR NEXT EXPERIMENT</ThemedText>
        <ThemedText type="subtitle" style={styles.heroTitle}>What if you used less water?</ThemedText>
        <ThemedText style={styles.heroCopy}>Run a simulation and compare the impact on yield, water, and cost.</ThemedText>
        <PrimaryButton onPress={() => router.push('/(app)/simulate')}>Start a simulation</PrimaryButton>
      </View>

      <View style={styles.sectionHeading}>
        <ThemedText type="smallBold">Recent activity</ThemedText>
        <Link href="/(app)/simulate/runs" style={{ color: theme.primary }}>See all</Link>
      </View>
      {runs.length ? (
        <View style={[styles.activity, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          <ThemedText type="smallBold">{runs[0].scenario_name}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Score {Number(runs[0].score)} · {new Date(runs[0].created_at).toLocaleDateString()}
          </ThemedText>
        </View>
      ) : (
        <ThemedText type="small" themeColor="textSecondary">Your first simulation will appear here.</ThemedText>
      )}

      <View style={styles.quickActions}>
        <Pressable onPress={() => router.push('/(app)/community')} style={[styles.quickAction, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          <ThemedText type="smallBold">Community</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">Share what you learn</ThemedText>
        </Pressable>
        <Pressable onPress={() => router.push('/(app)/map')} style={[styles.quickAction, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          <ThemedText type="smallBold">Farm map</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">Explore your locations</ThemedText>
        </Pressable>
        <Pressable onPress={() => router.push('/(app)/notifications')} style={[styles.quickAction, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          <ThemedText type="smallBold">Notifications</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">See your updates</ThemedText>
        </Pressable>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  emptyFarm: { padding: Spacing.three, borderRadius: 16, borderWidth: 1, gap: Spacing.two },
  hero: { padding: Spacing.three, borderRadius: 22, gap: Spacing.two },
  heroEyebrow: { color: '#D5F2D7', letterSpacing: 1 },
  heroTitle: { color: '#FFFFFF', fontSize: 24, lineHeight: 30 },
  heroCopy: { color: '#EAF5E9' },
  sectionHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  activity: { borderWidth: 1, borderRadius: 16, padding: Spacing.three, gap: Spacing.one },
  quickActions: { gap: Spacing.two },
  quickAction: { padding: Spacing.three, borderRadius: 16, borderWidth: 1, gap: Spacing.one },
  error: { color: '#B3261E' },
});
