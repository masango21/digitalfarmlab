import { Link } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth';

export default function LoginScreen() {
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
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ThemedText type="title" style={styles.title}>Welcome back</ThemedText>
        <ThemedText themeColor="textSecondary">Sign in to pick up where you left off.</ThemedText>
        <View style={styles.form}>
          <ThemedText type="smallBold">Email</ThemedText>
          <TextInput autoCapitalize="none" autoComplete="email" keyboardType="email-address" value={email} onChangeText={setEmail} placeholder="you@example.com" style={styles.input} />
          <ThemedText type="smallBold">Password</ThemedText>
          <TextInput autoComplete="password" secureTextEntry value={password} onChangeText={setPassword} placeholder="Your password" style={styles.input} />
          {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}
          <Pressable disabled={submitting} onPress={submit} style={({ pressed }) => [styles.button, pressed && styles.pressed, submitting && styles.disabled]}>
            <ThemedText type="smallBold" style={styles.buttonText}>{submitting ? 'Signing in…' : 'Sign in'}</ThemedText>
          </Pressable>
        </View>
        <ThemedText type="small" themeColor="textSecondary" style={styles.footer}>
          New to DigitalFarmLab?{' '}
          <Link href="/(auth)/register" style={styles.link}>Create an account</Link>
        </ThemedText>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.light.background },
  container: { flex: 1, justifyContent: 'center', padding: Spacing.four, gap: Spacing.two },
  title: { fontSize: 34, color: Colors.light.text },
  form: { gap: Spacing.two, marginTop: Spacing.four },
  input: { borderWidth: 1, borderColor: Colors.light.border, backgroundColor: '#FFFFFF', paddingHorizontal: Spacing.three, paddingVertical: Spacing.three, borderRadius: 14, color: Colors.light.text, marginBottom: Spacing.two },
  button: { backgroundColor: Colors.light.primary, borderRadius: 14, alignItems: 'center', padding: Spacing.three, marginTop: Spacing.two },
  buttonText: { color: '#FFFFFF' },
  pressed: { opacity: 0.8 },
  disabled: { opacity: 0.55 },
  error: { color: '#B3261E' },
  footer: { textAlign: 'center', marginTop: Spacing.four },
  link: { color: Colors.light.primary, fontWeight: '700' },
});
