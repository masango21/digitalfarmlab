import { Pressable, StyleSheet, View } from 'react-native';
import { useState } from 'react';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface ScenarioSliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  minimum?: number;
  maximum?: number;
  step?: number;
}

export function ScenarioSlider({
  label,
  value,
  onChange,
  minimum = 0,
  maximum = 200,
  step = 10,
}: ScenarioSliderProps) {
  const theme = useTheme();
  const [trackWidth, setTrackWidth] = useState(1);
  const percentage = ((value - minimum) / (maximum - minimum)) * 100;

  return (
    <View style={styles.container}>
      <View style={styles.labels}>
        <ThemedText type="smallBold">{label}</ThemedText>
        <ThemedText type="smallBold" style={{ color: theme.primary }}>{value}%</ThemedText>
      </View>
      <View onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}>
        <Pressable
          accessibilityRole="adjustable"
          accessibilityLabel={label}
          accessibilityValue={{ min: minimum, max: maximum, now: value }}
          onPress={(event) => {
            const next = minimum + (event.nativeEvent.locationX / trackWidth) * (maximum - minimum);
            onChange(Math.max(minimum, Math.min(maximum, Math.round(next / step) * step)));
          }}
          style={styles.trackPressable}>
          <View style={[styles.track, { backgroundColor: theme.backgroundSelected }]}>
            <View style={[styles.fill, { width: `${percentage}%`, backgroundColor: theme.accent }]} />
            <View style={[styles.thumb, { left: `${percentage}%`, backgroundColor: theme.primary, borderColor: theme.backgroundElement }]} />
          </View>
        </Pressable>
      </View>
      <View style={styles.bounds}>
        <ThemedText type="small" themeColor="textSecondary">{minimum}%</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">{maximum}%</ThemedText>
      </View>
      <View style={styles.adjusters}>
        <Pressable accessibilityLabel={`Decrease ${label}`} onPress={() => onChange(Math.max(minimum, value - step))} style={[styles.adjuster, { borderColor: theme.border }]}>
          <ThemedText type="smallBold">−</ThemedText>
        </Pressable>
        <Pressable accessibilityLabel={`Increase ${label}`} onPress={() => onChange(Math.min(maximum, value + step))} style={[styles.adjuster, { borderColor: theme.border }]}>
          <ThemedText type="smallBold">+</ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.two },
  labels: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  trackPressable: { paddingVertical: Spacing.two, justifyContent: 'center' },
  track: { height: 8, borderRadius: 8 },
  fill: { height: 8, borderRadius: 8 },
  thumb: { position: 'absolute', width: 22, height: 22, borderWidth: 3, borderRadius: 11, marginLeft: -11 },
  bounds: { flexDirection: 'row', justifyContent: 'space-between' },
  adjusters: { flexDirection: 'row', gap: Spacing.two, justifyContent: 'flex-end' },
  adjuster: { width: 40, height: 36, borderWidth: 1, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
