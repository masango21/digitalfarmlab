import type { ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface ContentStateProps {
  variant: 'loading' | 'error' | 'empty';
  message: string;
  title?: string;
  action?: ReactNode;
}

export function ContentState({ variant, title, message, action }: ContentStateProps) {
  const theme = useTheme();

  return (
    <View
      accessibilityLiveRegion={variant === 'error' ? 'polite' : undefined}
      style={[styles.container, { borderColor: theme.border, backgroundColor: theme.backgroundSecondary }]}>
      {variant === 'loading' ? <ActivityIndicator color={theme.accent} /> : null}
      {title ? (
        <ThemedText type="smallBold" style={variant === 'error' ? { color: theme.error } : undefined}>
          {title}
        </ThemedText>
      ) : null}
      <ThemedText type="small" themeColor={variant === 'error' ? 'error' : 'textSecondary'}>
        {message}
      </ThemedText>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
    borderWidth: 1,
    borderRadius: 16,
    padding: Spacing.three,
  },
});
