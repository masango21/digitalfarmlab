import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { farmTypes, mainCropOptions, southAfricanRegions, type FarmType } from '@/lib/farm';

interface FarmProfileAttributesProps {
  region: string;
  farmType: FarmType;
  mainCrops: string[];
  onRegionChange: (region: string) => void;
  onFarmTypeChange: (farmType: FarmType) => void;
  onMainCropsChange: (mainCrops: string[]) => void;
}

export function FarmProfileAttributes({
  region,
  farmType,
  mainCrops,
  onRegionChange,
  onFarmTypeChange,
  onMainCropsChange,
}: FarmProfileAttributesProps) {
  const theme = useTheme();
  const [customCrop, setCustomCrop] = useState('');
  const isKnownRegion = southAfricanRegions.some((option) => option === region);
  const regionIsCustom = Boolean(region) && !isKnownRegion;
  const inputStyle = [styles.input, { borderColor: theme.border, backgroundColor: theme.card, color: theme.text }];

  function toggleCrop(crop: string) {
    const isSelected = mainCrops.some((selected) => selected.toLowerCase() === crop.toLowerCase());
    onMainCropsChange(
      isSelected
        ? mainCrops.filter((selected) => selected.toLowerCase() !== crop.toLowerCase())
        : [...mainCrops, crop],
    );
  }

  function addCustomCrop() {
    const crop = customCrop.trim();
    if (!crop || mainCrops.some((selected) => selected.toLowerCase() === crop.toLowerCase())) return;
    if (mainCrops.length >= 20) return;
    onMainCropsChange([...mainCrops, crop]);
    setCustomCrop('');
  }

  return (
    <>
      <ThemedText type="smallBold">Region</ThemedText>
      <View style={styles.options}>
        {southAfricanRegions.map((option) => (
          <Pressable
            key={option}
            accessibilityRole="radio"
            accessibilityState={{ checked: region === option }}
            onPress={() => onRegionChange(option)}
            style={[
              styles.option,
              { borderColor: theme.border, backgroundColor: theme.card },
              region === option && { borderColor: theme.primary, backgroundColor: theme.backgroundSelected },
            ]}>
            <ThemedText type="smallBold">{option}</ThemedText>
          </Pressable>
        ))}
        <Pressable
          accessibilityRole="radio"
          accessibilityState={{ checked: !isKnownRegion }}
          onPress={() => {
            if (!regionIsCustom) onRegionChange('');
          }}
          style={[
            styles.option,
            { borderColor: theme.border, backgroundColor: theme.card },
            !isKnownRegion && { borderColor: theme.primary, backgroundColor: theme.backgroundSelected },
          ]}>
          <ThemedText type="smallBold">Other region</ThemedText>
        </Pressable>
      </View>
      {!isKnownRegion ? (
        <TextInput
          value={region}
          onChangeText={onRegionChange}
          maxLength={100}
          placeholder="Enter a region or province"
          placeholderTextColor={theme.textSecondary}
          style={inputStyle}
        />
      ) : null}

      <ThemedText type="smallBold">Farm type</ThemedText>
      <View style={styles.options}>
        {farmTypes.map((option) => (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ checked: farmType === option.value }}
            onPress={() => onFarmTypeChange(option.value)}
            style={[
              styles.option,
              { borderColor: theme.border, backgroundColor: theme.card },
              farmType === option.value && { borderColor: theme.primary, backgroundColor: theme.backgroundSelected },
            ]}>
            <ThemedText type="smallBold">{option.label}</ThemedText>
          </Pressable>
        ))}
      </View>

      <ThemedText type="smallBold">Main crops</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {mainCrops.length}/20 selected. Add another if it is not listed.
      </ThemedText>
      <View style={styles.options}>
        {mainCropOptions.map((crop) => {
          const selected = mainCrops.some((value) => value.toLowerCase() === crop.toLowerCase());
          return (
            <Pressable
              key={crop}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: selected }}
              disabled={!selected && mainCrops.length >= 20}
              onPress={() => toggleCrop(crop)}
              style={[
                styles.option,
                { borderColor: theme.border, backgroundColor: theme.card },
                selected && { borderColor: theme.primary, backgroundColor: theme.backgroundSelected },
              ]}>
              <ThemedText type="smallBold">{crop}</ThemedText>
            </Pressable>
          );
        })}
        {mainCrops.filter((crop) => !mainCropOptions.some((option) => option.toLowerCase() === crop.toLowerCase())).map((crop) => (
          <Pressable
            key={crop}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: true }}
            onPress={() => toggleCrop(crop)}
            style={[styles.option, { borderColor: theme.primary, backgroundColor: theme.backgroundSelected }]}>
            <ThemedText type="smallBold">{crop} ×</ThemedText>
          </Pressable>
        ))}
      </View>
      <View style={styles.cropInputRow}>
        <TextInput
          value={customCrop}
          onChangeText={setCustomCrop}
          maxLength={80}
          placeholder="Add another crop"
          placeholderTextColor={theme.textSecondary}
          style={[inputStyle, styles.cropInput]}
          onSubmitEditing={addCustomCrop}
          returnKeyType="done"
        />
        <Pressable
          accessibilityRole="button"
          disabled={!customCrop.trim() || mainCrops.length >= 20}
          onPress={addCustomCrop}
          style={[styles.addCropButton, { backgroundColor: theme.backgroundSelected }]}>
          <ThemedText type="smallBold">Add</ThemedText>
        </Pressable>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  option: { borderWidth: 1, borderRadius: 999, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two },
  input: { borderWidth: 1, padding: Spacing.three, borderRadius: 14 },
  cropInputRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  cropInput: { flex: 1, minWidth: 0 },
  addCropButton: { paddingHorizontal: Spacing.three, paddingVertical: Spacing.three, borderRadius: 12 },
});
