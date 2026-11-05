import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { AppScreen } from '@/components/ui/app-screen';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { apiRequest } from '@/lib/api';

interface Notification {
  id: string;
  title: string;
  body: string;
  read_at: string | null;
  created_at: string;
}

interface ChallengeStatus {
  id: string;
  title: string;
  rewardId: string;
  target: number;
  progress: number;
  streak: number;
  completed: boolean;
  rewarded: boolean;
  percentComplete: number;
  nextReward: string;
}

interface Preferences {
  pushNotifications: boolean;
  emailUpdates: boolean;
  quietHours: boolean;
  challengeReminders: boolean;
}

export default function NotificationsScreen() {
  const theme = useTheme();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [challenge, setChallenge] = useState<ChallengeStatus | null>(null);
  const [preferences, setPreferences] = useState<Preferences>({
    pushNotifications: true,
    emailUpdates: false,
    quietHours: true,
    challengeReminders: true,
  });
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      apiRequest<{ notifications: Notification[] }>('/notifications'),
      apiRequest<{ challenge: ChallengeStatus }>('/notifications/challenge'),
      apiRequest<{ preferences: Preferences }>('/notifications/preferences'),
    ])
      .then(([notificationsResponse, challengeResponse, preferencesResponse]) => {
        setNotifications(notificationsResponse.notifications);
        setChallenge(challengeResponse.challenge);
        setPreferences(preferencesResponse.preferences);
      })
      .catch((loadError: unknown) => {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load notifications');
      });
  }, []);

  async function markRead(id: string) {
    try {
      const response = await apiRequest<{ notification: Notification }>(`/notifications/${id}/read`, { method: 'PATCH' });
      setNotifications((current) => current.map((item) => item.id === id ? response.notification : item));
    } catch (readError) {
      setError(readError instanceof Error ? readError.message : 'Unable to update notification');
    }
  }

  async function togglePreference(key: keyof Preferences) {
    try {
      const response = await apiRequest<{ preferences: Preferences }>('/notifications/preferences', {
        method: 'PATCH',
        body: JSON.stringify({ ...preferences, [key]: !preferences[key] }),
      });
      setPreferences(response.preferences);
    } catch (toggleError) {
      setError(toggleError instanceof Error ? toggleError.message : 'Unable to update notification preferences');
    }
  }

  return (
    <AppScreen title="Notifications" subtitle="Updates, reminders, and daily progress for your farm lab.">
      {error ? <ThemedText style={{ color: theme.error }}>{error}</ThemedText> : null}

      {challenge ? (
        <View style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}> 
          <ThemedText type="smallBold">Daily challenge</ThemedText>
          <ThemedText>{challenge.title}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {challenge.progress}/{challenge.target} steps • streak {challenge.streak} • {challenge.percentComplete}% complete
          </ThemedText>
          <ThemedText type="smallBold" style={{ color: theme.primaryText }}>{challenge.nextReward}</ThemedText>
        </View>
      ) : null}

      <View style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}> 
        <ThemedText type="smallBold">Notification preferences</ThemedText>
        {Object.entries(preferences).map(([key, value]) => (
          <Pressable
            key={key}
            onPress={() => togglePreference(key as keyof Preferences)}
            style={styles.preferenceRow}>
            <ThemedText type="small" style={{ flex: 1, textTransform: 'capitalize' }}>
              {key.replace(/([A-Z])/g, ' $1').trim()}
            </ThemedText>
            <ThemedText type="smallBold" style={{ color: value ? theme.primaryText : theme.textSecondary }}>
              {value ? 'On' : 'Off'}
            </ThemedText>
          </Pressable>
        ))}
      </View>

      {!notifications.length && !error ? <ThemedText themeColor="textSecondary">You are all caught up.</ThemedText> : null}
      {notifications.map((item) => (
        <Pressable
          key={item.id}
          disabled={Boolean(item.read_at)}
          onPress={() => markRead(item.id)}
          style={[styles.notification, { backgroundColor: item.read_at ? theme.backgroundElement : theme.backgroundSelected, borderColor: theme.border }]}>
          <View style={styles.heading}>
            <ThemedText type="smallBold">{item.title}</ThemedText>
            {!item.read_at ? <ThemedText type="smallBold" style={{ color: theme.primaryText }}>NEW</ThemedText> : null}
          </View>
          <ThemedText>{item.body}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">{new Date(item.created_at).toLocaleString()}</ThemedText>
        </Pressable>
      ))}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  card: { padding: Spacing.three, gap: Spacing.two, borderRadius: 16, borderWidth: 1, marginBottom: Spacing.three },
  notification: { padding: Spacing.three, gap: Spacing.two, borderRadius: 16, borderWidth: 1 },
  heading: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.two },
  preferenceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Spacing.one },
});
