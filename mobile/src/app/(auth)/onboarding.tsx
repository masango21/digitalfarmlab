import { router } from 'expo-router';
import { SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const highlights = [
  { number: '01', title: 'Build your farm', detail: 'Keep your fields, crops, and farm activity in one place.' },
  { number: '02', title: 'Try a scenario', detail: 'Adjust water and fertilizer to explore the trade-offs.' },
  { number: '03', title: 'Learn from results', detail: 'Compare yield, water use, costs, and your score.' },
];

export default function OnboardingScreen() {
  const theme = useTheme();
  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.brandMark, { backgroundColor: theme.primary }]}><ThemedText style={[styles.markText, { color: theme.background }]}>DF</ThemedText></View>
        <ThemedText type="smallBold" style={[styles.eyebrow, { color: theme.primary }]}>DIGITAL FARMLAB</ThemedText>
        <ThemedText type="title" style={[styles.title, { color: theme.text }]}>Grow ideas.{'\n'}See what changes.</ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.intro}>
          A hands-on farm simulation for curious growers and future farmers.
        </ThemedText>

        <View style={styles.highlights}>
          {highlights.map((item) => (
            <View key={item.number} style={[styles.highlight, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
              <ThemedText type="smallBold" style={{ color: theme.primary }}>{item.number}</ThemedText>
              <View style={styles.highlightCopy}>
                <ThemedText type="smallBold">{item.title}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">{item.detail}</ThemedText>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.footer}>
          <ThemedText
            accessibilityRole="button"
            onPress={() => router.push('/(auth)/login')}
            style={[styles.primaryButton, { backgroundColor: theme.primary, color: theme.background }]}>
            Get started
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.signIn}>
            Already have an account?{' '}
            <ThemedText type="smallBold" style={{ color: theme.primary }} onPress={() => router.push('/(auth)/login')}>
              Sign in
            </ThemedText>
          </ThemedText>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: Spacing.four, paddingTop: Spacing.four, paddingBottom: Spacing.four },
  brandMark: { width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.three },
  markText: { fontSize: 18, fontWeight: '800' },
  eyebrow: { letterSpacing: 1.5, marginBottom: Spacing.two },
  title: { fontSize: 38, lineHeight: 44, marginBottom: Spacing.two },
  intro: { maxWidth: 340, marginBottom: Spacing.four },
  highlights: { gap: Spacing.three },
  highlight: { flexDirection: 'row', gap: Spacing.three, alignItems: 'flex-start', padding: Spacing.three, borderRadius: 18, borderWidth: 1 },
  highlightCopy: { flex: 1, gap: Spacing.one },
  footer: { marginTop: Spacing.four, gap: Spacing.three },
  primaryButton: { textAlign: 'center', overflow: 'hidden', borderRadius: 16, paddingVertical: Spacing.three, fontWeight: '700' },
  signIn: { textAlign: 'center' },
});
