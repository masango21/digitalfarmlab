import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { AppScreen } from '@/components/ui/app-screen';
import { PrimaryButton } from '@/components/ui/primary-button';
import { StatCard } from '@/components/ui/stat-card';
import { Colors, Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import { apiRequest } from '@/lib/api';

interface Profile {
  id: string;
  display_name: string;
  email: string;
  role: 'learner' | 'trainer';
  avatar_url: string | null;
  farm_count: number;
  simulation_count: number;
  pending_task_count: number;
}

interface ProfileResponse {
  profile: Profile;
  scores: { value: number; scenario_name: string; created_at: string }[];
}

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [scores, setScores] = useState<ProfileResponse['scores']>([]);
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function loadProfile() {
    const response = await apiRequest<ProfileResponse>('/profile');
    setProfile(response.profile);
    setDisplayName(response.profile.display_name);
    setScores(response.scores);
  }

  useEffect(() => {
    apiRequest<ProfileResponse>('/profile')
      .then((response) => {
        setProfile(response.profile);
        setDisplayName(response.profile.display_name);
        setScores(response.scores);
      })
      .catch((loadError: unknown) => setError(loadError instanceof Error ? loadError.message : 'Unable to load profile'));
  }, []);

  async function saveName() {
    setSaving(true);
    setError('');
    try {
      const response = await apiRequest<{ profile: Profile }>('/profile', {
        method: 'PATCH',
        body: JSON.stringify({ displayName }),
      });
      setProfile((current) => current ? { ...current, ...response.profile } : response.profile);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to update profile');
    } finally {
      setSaving(false);
    }
  }

  async function changeAvatar() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError('Allow photo library access to choose an avatar.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8 });
    if (result.canceled) return;
    try {
      const imageBlob = await (await fetch(result.assets[0].uri)).blob();
      const formData = new FormData();
      formData.append('image', imageBlob, 'avatar.jpg');
      await apiRequest('/profile/avatar', { method: 'POST', body: formData });
      await loadProfile();
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Unable to upload avatar');
    }
  }

  async function signOut() {
    try {
      await logout();
    } catch (logoutError) {
      setError(logoutError instanceof Error ? logoutError.message : 'Signed out locally, but the server could not revoke the session');
    }
  }

  return (
    <AppScreen title="Profile" subtitle="Your account and learning progress.">
      <View style={styles.profileHeader}>
        {profile?.avatar_url ? (
          <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <ThemedText type="subtitle" style={styles.avatarText}>{(profile?.display_name || user?.display_name || 'F').slice(0, 1)}</ThemedText>
          </View>
        )}
        <Pressable onPress={changeAvatar}><ThemedText type="smallBold" style={styles.changePhoto}>Change photo</ThemedText></Pressable>
        <ThemedText type="smallBold">{profile?.email || user?.email}</ThemedText>
        <ThemedText type="small" style={styles.role}>{profile?.role || user?.role}</ThemedText>
      </View>

      <View style={styles.stats}>
        <StatCard label="Farms" value={String(profile?.farm_count ?? 0)} />
        <StatCard label="Simulations" value={String(profile?.simulation_count ?? 0)} />
      </View>

      <View style={styles.form}>
        <ThemedText type="smallBold">Display name</ThemedText>
        <TextInput value={displayName} onChangeText={setDisplayName} style={styles.input} />
        <PrimaryButton onPress={saveName} disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</PrimaryButton>
      </View>

      <ThemedText type="smallBold">Recent scores</ThemedText>
      {scores.length ? scores.map((score, index) => (
        <View key={`${score.created_at}-${index}`} style={styles.scoreRow}>
          <ThemedText type="small">{score.scenario_name}</ThemedText>
          <ThemedText type="smallBold">{score.value} / 100</ThemedText>
        </View>
      )) : <ThemedText type="small" themeColor="textSecondary">Run your first scenario to build your history.</ThemedText>}
      <Link href="/(app)/cohorts" style={styles.cohortLink}>
        {profile?.role === 'trainer' ? 'Manage trainer cohorts' : 'My learning cohorts'}
      </Link>
      {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}
      <PrimaryButton onPress={signOut} secondary>Sign out</PrimaryButton>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  profileHeader: { alignItems: 'center', gap: Spacing.two, padding: Spacing.three },
  avatar: { width: 92, height: 92, borderRadius: 46 },
  avatarPlaceholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#D8EED6' },
  avatarText: { color: '#2E7D32' },
  changePhoto: { color: '#2E7D32' },
  role: { textTransform: 'capitalize', color: '#2E7D32' },
  stats: { flexDirection: 'row', gap: Spacing.two },
  form: { gap: Spacing.two },
  input: { borderWidth: 1, borderColor: Colors.light.border, backgroundColor: '#FFFFFF', padding: Spacing.three, borderRadius: 14, color: Colors.light.text },
  scoreRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.two, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.light.border },
  cohortLink: { color: '#2E7D32', fontWeight: '700', paddingVertical: Spacing.two },
  error: { color: '#B3261E' },
});
