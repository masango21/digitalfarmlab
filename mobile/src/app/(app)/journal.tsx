import { useEffect, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { AppScreen } from '@/components/ui/app-screen';
import { PrimaryButton } from '@/components/ui/primary-button';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { apiRequest } from '@/lib/api';

interface JournalEntry {
  id: string;
  title: string;
  body: string;
  tags: string[];
  visibility: string;
  createdAt: string;
}

interface FeedbackItem {
  id: string;
  rating: 'positive' | 'neutral' | 'negative';
  action: string;
}

export default function JournalScreen() {
  const theme = useTheme();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      apiRequest<{ entries: JournalEntry[] }>('/journal/entries'),
      apiRequest<{ feedback: FeedbackItem[] }>('/journal/feedback'),
    ])
      .then(([entriesResponse, feedbackResponse]) => {
        setEntries(entriesResponse.entries);
        setFeedback(feedbackResponse.feedback);
      })
      .catch((loadError: unknown) => {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load journal data.');
      });
  }, []);

  async function submitEntry() {
    if (!title.trim() || !body.trim()) {
      setError('Add a title and a brief journal note before saving.');
      return;
    }

    try {
      const response = await apiRequest<{ entry: JournalEntry }>('/journal/entries', {
        method: 'POST',
        body: JSON.stringify({ title, body, tags: ['field-notes'], visibility: 'private' }),
      });
      setEntries((current) => [response.entry, ...current]);
      setTitle('');
      setBody('');
      setError('');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to save journal entry.');
    }
  }

  return (
    <AppScreen
      title="Journal & feedback"
      subtitle="Capture observations, track learning notes, and review trainer guidance in one place.">
      <View style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}> 
        <ThemedText type="smallBold">New learner entry</ThemedText>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Entry title"
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, { borderColor: theme.border, backgroundColor: theme.card, color: theme.text }]}
        />
        <TextInput
          value={body}
          onChangeText={setBody}
          placeholder="What did you observe today?"
          multiline
          placeholderTextColor={theme.textSecondary}
          style={[styles.textArea, { borderColor: theme.border, backgroundColor: theme.card, color: theme.text }]}
        />
        <PrimaryButton onPress={submitEntry}>Save entry</PrimaryButton>
      </View>

      {error ? <ThemedText style={{ color: theme.error }}>{error}</ThemedText> : null}

      <View style={styles.section}>
        <ThemedText type="smallBold">Recent journal entries</ThemedText>
        {entries.map((entry) => (
          <View key={entry.id} style={[styles.entry, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}> 
            <ThemedText type="smallBold">{entry.title}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">{entry.body}</ThemedText>
            {entry.tags.length ? (
              <ThemedText type="small" themeColor="textSecondary">Tags: {entry.tags.join(', ')}</ThemedText>
            ) : null}
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <ThemedText type="smallBold">Trainer feedback</ThemedText>
        {feedback.map((item) => (
          <View key={item.id} style={[styles.feedback, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}> 
            <ThemedText type="smallBold" style={{ color: item.rating === 'negative' ? theme.error : theme.primaryText }}>
              {item.rating.toUpperCase()}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">{item.action}</ThemedText>
          </View>
        ))}
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  card: { padding: Spacing.three, gap: Spacing.two, borderRadius: 18, borderWidth: 1 },
  input: { borderWidth: 1, borderRadius: 12, padding: Spacing.three },
  textArea: { borderWidth: 1, borderRadius: 12, padding: Spacing.three, minHeight: 120, textAlignVertical: 'top' },
  section: { marginTop: Spacing.three, gap: Spacing.two },
  entry: { borderWidth: 1, borderRadius: 16, padding: Spacing.three, gap: Spacing.one },
  feedback: { borderWidth: 1, borderRadius: 16, padding: Spacing.three, gap: Spacing.one },
});
