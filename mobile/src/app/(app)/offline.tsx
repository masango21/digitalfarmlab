import { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { AppScreen } from '@/components/ui/app-screen';
import { PrimaryButton } from '@/components/ui/primary-button';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { loadPendingWrites, queueLocalWrite, syncPendingWrites, type OfflineWrite } from '@/lib/offline-sync';

export default function OfflineSupportScreen() {
  const theme = useTheme();
  const [queuedWrites, setQueuedWrites] = useState<OfflineWrite[]>([]);
  const [status, setStatus] = useState('No pending changes');

  const refreshQueue = async () => {
    const writes = await loadPendingWrites();
    setQueuedWrites(writes);
  };

  useEffect(() => {
    void (async () => {
      const writes = await loadPendingWrites();
      setQueuedWrites(writes);
    })();
  }, []);

  async function queueSampleWrite() {
    const nextQueue = await queueLocalWrite('farm', 'learner-1', { name: 'Green Valley', status: 'draft' });
    setQueuedWrites(nextQueue);
    setStatus('Queued a farm draft locally');
  }

  async function syncQueue() {
    const result = await syncPendingWrites(async (entry) => {
      if (entry.entity === 'farm' && entry.owner === 'learner-1') {
        return true;
      }
      return false;
    });

    setStatus(`Synced ${result.synced} item(s); ${result.failed} failed; ${result.conflicts} conflict(s)`);
    refreshQueue();
  }

  return (
    <AppScreen
      title="Offline support"
      subtitle="Cache ownership, queued writes, retry behavior, and conflict detection keep updates safe when the network is intermittent.">
      <View style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}> 
        <ThemedText type="smallBold">Sync overview</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">{status}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">Pending writes: {queuedWrites.length}</ThemedText>
      </View>

      <PrimaryButton onPress={queueSampleWrite}>Queue a local update</PrimaryButton>
      <View style={styles.spacer} />
      <PrimaryButton onPress={syncQueue} secondary>Sync queued changes</PrimaryButton>

      {queuedWrites.length > 0 ? (
        <View style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}> 
          <ThemedText type="smallBold">Queued items</ThemedText>
          {queuedWrites.map((write) => (
            <View key={write.id} style={styles.item}>
              <ThemedText type="smallBold">{write.entity}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">Owner: {write.owner}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">Status: {write.status}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">Attempts: {write.attempts}</ThemedText>
            </View>
          ))}
        </View>
      ) : null}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 18,
    padding: Spacing.three,
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  item: {
    borderWidth: 1,
    borderRadius: 12,
    borderColor: 'rgba(255,255,255,0.15)',
    padding: Spacing.two,
    gap: Spacing.one,
    marginTop: Spacing.two,
  },
  spacer: { height: Spacing.two },
});
