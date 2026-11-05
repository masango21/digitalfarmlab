import { Link, router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { AppScreen } from '@/components/ui/app-screen';
import { FarmCard, type Farm } from '@/components/ui/farm-card';
import { ContentState } from '@/components/ui/content-state';
import { PrimaryButton } from '@/components/ui/primary-button';
import { StatCard } from '@/components/ui/stat-card';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth';
import { apiRequest } from '@/lib/api';

interface DashboardRun {
  id: string;
  scenario_name: string;
  score: number | string;
  created_at: string;
}

interface DashboardResponse {
  farms: Farm[];
  summary: {
    farmCount: number;
    fieldCount: number;
    pendingTaskCount: number;
    lastScore: number | null;
    lastUpdated: string;
  };
  recentRuns: DashboardRun[];
  dataStatus: {
    weather: { available: boolean; label: string; source: string };
    sensors: { available: boolean; label: string; source: string };
  };
}

export default function DashboardScreen() {
  const theme = useTheme();
  const { user } = useAuth();
  const [farms, setFarms] = useState<Farm[]>([]);
  const [runs, setRuns] = useState<DashboardRun[]>([]);
  const [pendingTasks, setPendingTasks] = useState(0);
  const [error, setError] = useState('');
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [farmDataAvailable, setFarmDataAvailable] = useState(false);
  const [taskDataAvailable, setTaskDataAvailable] = useState(false);
  const [runDataAvailable, setRunDataAvailable] = useState(false);

  useFocusEffect(useCallback(() => {
    let active = true;
    apiRequest<DashboardResponse>('/dashboard')
      .then((response) => {
        if (!active) return;
        setFarms(response.farms);
        setRuns(response.recentRuns);
        setPendingTasks(response.summary.pendingTaskCount);
        setFarmDataAvailable(true);
        setTaskDataAvailable(true);
        setRunDataAvailable(response.recentRuns.length > 0);
        setError('');
      })
      .catch((loadError: unknown) => {
        if (!active) return;
        setError(loadError instanceof Error ? loadError.message : 'Unable to load dashboard');
      })
      .finally(() => {
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
      {error ? <ThemedText style={{ color: theme.error }}>{error}</ThemedText> : null}
      {dashboardLoading ? (
        <ContentState variant="loading" message="Loading farm records…" />
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
        <Link href="/(app)/farm" style={{ color: theme.primaryText }}>See all</Link>
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
        <Link href="/(app)/simulate/runs" style={{ color: theme.primaryText }}>See all</Link>
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
        <Pressable onPress={() => router.push('/(app)/crop-library/index')} style={[styles.quickAction, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          <ThemedText type="smallBold">Crop library</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">Search crops, profiles, and varieties</ThemedText>
        </Pressable>
        <Pressable onPress={() => router.push('/(app)/market')} style={[styles.quickAction, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          <ThemedText type="smallBold">Marketplace</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">Browse farm supplies</ThemedText>
        </Pressable>
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
        <Pressable onPress={() => router.push('/(app)/labs' as never)} style={[styles.quickAction, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          <ThemedText type="smallBold">Agri labs</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">Open the six learning laboratories</ThemedText>
        </Pressable>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  emptyFarm: { padding: Spacing.three, borderRadius: 16, borderWidth: 1, gap: Spacing.two },
  hero: { padding: Spacing.three, borderRadius: 22, gap: Spacing.two },
  heroEyebrow: { color: '#D6AE55', letterSpacing: 1 },
  heroTitle: { color: '#FFFFFF', fontSize: 24, lineHeight: 30 },
  heroCopy: { color: '#F5F3EE' },
  sectionHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  activity: { borderWidth: 1, borderRadius: 16, padding: Spacing.three, gap: Spacing.one },
  quickActions: { gap: Spacing.two },
  quickAction: { padding: Spacing.three, borderRadius: 16, borderWidth: 1, gap: Spacing.one },
});
