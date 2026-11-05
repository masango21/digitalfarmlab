import { Link } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth';

export default function LoginScreen() {
  const theme = useTheme();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setError('');
    setSubmitting(true);
    try {
      await login(email.trim(), password);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to sign in');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ThemedText type="title">Welcome back</ThemedText>
        <ThemedText themeColor="textSecondary">Sign in to pick up where you left off.</ThemedText>
        <View style={styles.form}>
          <ThemedText type="smallBold">Email</ThemedText>
          <TextInput autoCapitalize="none" autoComplete="email" keyboardType="email-address" value={email} onChangeText={setEmail} placeholder="you@example.com" placeholderTextColor={theme.textSecondary} style={[styles.input, { borderColor: theme.border, backgroundColor: theme.card, color: theme.text }]} />
          <ThemedText type="smallBold">Password</ThemedText>
          <TextInput autoComplete="password" secureTextEntry value={password} onChangeText={setPassword} placeholder="Your password" placeholderTextColor={theme.textSecondary} style={[styles.input, { borderColor: theme.border, backgroundColor: theme.card, color: theme.text }]} />
          {error ? <ThemedText style={{ color: theme.error }}>{error}</ThemedText> : null}
          <Pressable accessibilityRole="button" accessibilityState={{ disabled: submitting }} disabled={submitting} onPress={submit} style={({ pressed }) => [styles.button, { backgroundColor: theme.primary }, pressed && styles.pressed, submitting && styles.disabled]}>
            <ThemedText type="smallBold" style={styles.buttonText}>{submitting ? 'Signing in…' : 'Sign in'}</ThemedText>
          </Pressable>
        </View>
        <ThemedText type="small" themeColor="textSecondary" style={styles.footer}>
          New to DigitalFarmLab?{' '}
          <Link href="/(auth)/register" style={[styles.link, { color: theme.primaryText }]}>Create an account</Link>
        </ThemedText>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1, justifyContent: 'center', padding: Spacing.four, gap: Spacing.two },
  form: { gap: Spacing.two, marginTop: Spacing.four },
  input: { borderWidth: 1, paddingHorizontal: Spacing.three, paddingVertical: Spacing.three, borderRadius: 14, marginBottom: Spacing.two },
  button: { borderRadius: 14, alignItems: 'center', padding: Spacing.three, marginTop: Spacing.two },
  buttonText: { color: '#FFFFFF' },
  pressed: { opacity: 0.8 },
  disabled: { opacity: 0.55 },
  footer: { textAlign: 'center', marginTop: Spacing.four },
  link: { fontWeight: '700' },
});
