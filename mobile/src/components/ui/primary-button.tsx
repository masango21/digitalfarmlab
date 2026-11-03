import type { PropsWithChildren } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface PrimaryButtonProps extends PropsWithChildren {
  onPress: () => void;
  disabled?: boolean;
  secondary?: boolean;
}

export function PrimaryButton({ children, onPress, disabled = false, secondary = false }: PrimaryButtonProps) {
  const theme = useTheme();
  const backgroundColor = secondary ? theme.backgroundSelected : theme.primary;
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor },
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}>
      <View>
        <ThemedText type="smallBold" style={!secondary ? styles.primaryText : { color: theme.text }}>
          {children}
        </ThemedText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { minHeight: 48, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing.three, borderRadius: 14 },
  primaryText: { color: '#FFFFFF' },
  pressed: { opacity: 0.8 },
  disabled: { opacity: 0.55 },
});
