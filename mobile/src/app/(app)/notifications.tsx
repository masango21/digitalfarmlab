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

export default function NotificationsScreen() {
  const theme = useTheme();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    apiRequest<{ notifications: Notification[] }>('/notifications')
      .then((response) => setNotifications(response.notifications))
      .catch((loadError: unknown) => setError(loadError instanceof Error ? loadError.message : 'Unable to load notifications'));
  }, []);

  async function markRead(id: string) {
    try {
      const response = await apiRequest<{ notification: Notification }>(`/notifications/${id}/read`, { method: 'PATCH' });
      setNotifications((current) => current.map((item) => item.id === id ? response.notification : item));
    } catch (readError) {
      setError(readError instanceof Error ? readError.message : 'Unable to update notification');
    }
  }

  return (
    <AppScreen title="Notifications" subtitle="Updates from your farm lab.">
      {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}
      {!notifications.length && !error ? <ThemedText themeColor="textSecondary">You are all caught up.</ThemedText> : null}
      {notifications.map((item) => (
        <Pressable
          key={item.id}
          disabled={Boolean(item.read_at)}
          onPress={() => markRead(item.id)}
          style={[styles.notification, { backgroundColor: item.read_at ? theme.backgroundElement : theme.backgroundSelected, borderColor: theme.border }]}>
          <View style={styles.heading}>
            <ThemedText type="smallBold">{item.title}</ThemedText>
            {!item.read_at ? <ThemedText type="smallBold" style={{ color: theme.primary }}>NEW</ThemedText> : null}
          </View>
          <ThemedText>{item.body}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">{new Date(item.created_at).toLocaleString()}</ThemedText>
        </Pressable>
      ))}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  notification: { padding: Spacing.three, gap: Spacing.two, borderRadius: 16, borderWidth: 1 },
  heading: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.two },
  error: { color: '#B3261E' },
});
