import { Link } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/constants/theme';
import { useAuth, type User } from '@/lib/auth';

export default function RegisterScreen() {
  const { register } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<User['role']>('learner');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setError('');
    setSubmitting(true);
    try {
      await register(displayName.trim(), email.trim(), password, role);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to create your account');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ThemedText type="title" style={styles.title}>Create account</ThemedText>
        <ThemedText themeColor="textSecondary">Start learning with your own farm lab.</ThemedText>
        <View style={styles.form}>
          <ThemedText type="smallBold">Your name</ThemedText>
          <TextInput autoComplete="name" value={displayName} onChangeText={setDisplayName} placeholder="Name" style={styles.input} />
          <ThemedText type="smallBold">Email</ThemedText>
          <TextInput autoCapitalize="none" autoComplete="email" keyboardType="email-address" value={email} onChangeText={setEmail} placeholder="you@example.com" style={styles.input} />
          <ThemedText type="smallBold">Password</ThemedText>
          <TextInput autoComplete="new-password" secureTextEntry value={password} onChangeText={setPassword} placeholder="At least 8 characters" style={styles.input} />
          <ThemedText type="smallBold">I am a</ThemedText>
          <View style={styles.roles}>
            {(['learner', 'trainer'] as const).map((value) => (
              <Pressable key={value} onPress={() => setRole(value)} style={[styles.role, role === value && styles.selectedRole]}>
                <ThemedText type="smallBold" style={role === value ? styles.selectedRoleText : undefined}>
                  {value === 'learner' ? 'Learner' : 'Trainer'}
                </ThemedText>
              </Pressable>
            ))}
          </View>
          {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}
          <Pressable disabled={submitting} onPress={submit} style={({ pressed }) => [styles.button, pressed && styles.pressed, submitting && styles.disabled]}>
            <ThemedText type="smallBold" style={styles.buttonText}>{submitting ? 'Creating account…' : 'Create account'}</ThemedText>
          </Pressable>
        </View>
        <ThemedText type="small" themeColor="textSecondary" style={styles.footer}>
          Already have an account? <Link href="/(auth)/login" style={styles.link}>Sign in</Link>
        </ThemedText>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.light.background },
  container: { flex: 1, justifyContent: 'center', padding: Spacing.four, gap: Spacing.two },
  title: { fontSize: 34, color: Colors.light.text },
  form: { gap: Spacing.two, marginTop: Spacing.three },
  input: { borderWidth: 1, borderColor: Colors.light.border, backgroundColor: '#FFFFFF', paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, borderRadius: 14, color: Colors.light.text, marginBottom: Spacing.one },
  roles: { flexDirection: 'row', gap: Spacing.two },
  role: { flex: 1, alignItems: 'center', padding: Spacing.two, borderRadius: 12, borderWidth: 1, borderColor: Colors.light.border },
  selectedRole: { backgroundColor: Colors.light.primary, borderColor: Colors.light.primary },
  selectedRoleText: { color: '#FFFFFF' },
  button: { backgroundColor: Colors.light.primary, borderRadius: 14, alignItems: 'center', padding: Spacing.three, marginTop: Spacing.two },
  buttonText: { color: '#FFFFFF' },
  pressed: { opacity: 0.8 },
  disabled: { opacity: 0.55 },
  error: { color: '#B3261E' },
  footer: { textAlign: 'center', marginTop: Spacing.three },
  link: { color: Colors.light.primary, fontWeight: '700' },
});
