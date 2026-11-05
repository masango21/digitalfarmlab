import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { AppScreen } from '@/components/ui/app-screen';
import { PrimaryButton } from '@/components/ui/primary-button';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth';
import { apiRequest } from '@/lib/api';

interface Cohort {
  id: string;
  name: string;
  invite_code: string | null;
  member_count: number;
}

interface LearnerResult {
  user_id: string;
  display_name: string;
  simulation_count: number;
  average_score: number | string;
  latest_run_at: string | null;
}

export default function CohortsScreen() {
  const { user } = useAuth();
  const theme = useTheme();
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [selectedCohort, setSelectedCohort] = useState<Cohort | null>(null);
  const [learners, setLearners] = useState<LearnerResult[]>([]);
  const [name, setName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [message, setMessage] = useState('');
  const [working, setWorking] = useState(false);

  async function loadCohorts() {
    const response = await apiRequest<{ cohorts: Cohort[] }>('/cohorts');
    setCohorts(response.cohorts);
  }

  useEffect(() => {
    apiRequest<{ cohorts: Cohort[] }>('/cohorts')
      .then((response) => setCohorts(response.cohorts))
      .catch((error: unknown) => setMessage(error instanceof Error ? error.message : 'Unable to load cohorts'));
  }, []);

  async function createCohort() {
    setWorking(true);
    setMessage('');
    try {
      const response = await apiRequest<{ cohort: Cohort }>('/cohorts', {
        method: 'POST',
        body: JSON.stringify({ name }),
      });
      setCohorts((current) => [response.cohort, ...current]);
      setName('');
      setMessage(`Cohort created. Invite code: ${response.cohort.invite_code}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to create cohort');
    } finally {
      setWorking(false);
    }
  }

  async function joinCohort() {
    setWorking(true);
    setMessage('');
    try {
      const response = await apiRequest<{ cohort: { id: string; name: string }; alreadyJoined: boolean }>('/cohorts/join', {
        method: 'POST',
        body: JSON.stringify({ inviteCode }),
      });
      setInviteCode('');
      setMessage(response.alreadyJoined ? 'You are already in this cohort.' : `Joined ${response.cohort.name}.`);
      await loadCohorts();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to join cohort');
    } finally {
      setWorking(false);
    }
  }

  async function showResults(cohort: Cohort) {
    setSelectedCohort(cohort);
    setMessage('');
    try {
      const response = await apiRequest<{ learners: LearnerResult[] }>(`/cohorts/${cohort.id}/results`);
      setLearners(response.learners);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to load cohort results');
    }
  }

  return (
    <AppScreen
      title={user?.role === 'trainer' ? 'Trainer cohorts' : 'My cohorts'}
      subtitle={user?.role === 'trainer' ? 'Create a group and review learner progress.' : 'Join a trainer cohort to share your learning.'}>
      {user?.role === 'trainer' ? (
        <View style={[styles.panel, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          <ThemedText type="smallBold">Create a cohort</ThemedText>
          <TextInput value={name} onChangeText={setName} placeholder="Cohort name" placeholderTextColor={theme.textSecondary} style={[styles.input, { borderColor: theme.border, backgroundColor: theme.card, color: theme.text }]} />
          <PrimaryButton onPress={createCohort} disabled={working || name.trim().length < 2}>
            {working ? 'Working…' : 'Create cohort'}
          </PrimaryButton>
        </View>
      ) : (
        <View style={[styles.panel, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          <ThemedText type="smallBold">Join with an invite code</ThemedText>
          <TextInput value={inviteCode} onChangeText={setInviteCode} autoCapitalize="characters" maxLength={10} placeholder="10-character code" placeholderTextColor={theme.textSecondary} style={[styles.input, { borderColor: theme.border, backgroundColor: theme.card, color: theme.text }]} />
          <PrimaryButton onPress={joinCohort} disabled={working || inviteCode.trim().length !== 10}>
            {working ? 'Joining…' : 'Join cohort'}
          </PrimaryButton>
        </View>
      )}

      {message ? <ThemedText style={styles.message}>{message}</ThemedText> : null}
      <ThemedText type="smallBold">{user?.role === 'trainer' ? 'Your cohorts' : 'Joined cohorts'}</ThemedText>
      {!cohorts.length ? <ThemedText type="small" themeColor="textSecondary">No cohorts yet.</ThemedText> : null}
      {cohorts.map((cohort) => (
        <Pressable
          key={cohort.id}
          onPress={() => user?.role === 'trainer' && showResults(cohort)}
          style={[styles.cohort, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          <View style={styles.cohortTitle}>
            <ThemedText type="smallBold">{cohort.name}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">{cohort.member_count} learners</ThemedText>
          </View>
          {cohort.invite_code ? <ThemedText type="smallBold" style={{ color: theme.primaryText }}>Invite code: {cohort.invite_code}</ThemedText> : null}
          {user?.role === 'trainer' ? <ThemedText type="small" themeColor="textSecondary">Tap to review results</ThemedText> : null}
        </Pressable>
      ))}

      {selectedCohort ? (
        <View style={styles.results}>
          <ThemedText type="smallBold">{selectedCohort.name} results</ThemedText>
          {!learners.length ? <ThemedText type="small" themeColor="textSecondary">Learners have not joined this cohort yet.</ThemedText> : null}
          {learners.map((learner) => (
            <View key={learner.user_id} style={[styles.resultRow, { borderBottomColor: theme.border }]}>
              <View style={styles.learner}>
                <ThemedText type="smallBold">{learner.display_name}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">{learner.simulation_count} simulations</ThemedText>
              </View>
              <ThemedText type="smallBold">{Number(learner.average_score).toFixed(0)} avg</ThemedText>
            </View>
          ))}
        </View>
      ) : null}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  panel: { padding: Spacing.three, gap: Spacing.two, borderRadius: 18, borderWidth: 1 },
  input: { borderWidth: 1, padding: Spacing.three, borderRadius: 12 },
  message: { color: '#2E7D32' },
  cohort: { padding: Spacing.three, gap: Spacing.two, borderRadius: 16, borderWidth: 1 },
  cohortTitle: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.two },
  results: { gap: Spacing.two },
  resultRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.two, borderBottomWidth: StyleSheet.hairlineWidth },
  learner: { gap: Spacing.one },
});
