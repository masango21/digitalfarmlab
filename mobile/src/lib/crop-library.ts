export const cropCategories = [
  { value: 'cereals_grains', label: 'Cereals and grains' },
  { value: 'legumes_pulses', label: 'Legumes and pulses' },
  { value: 'root_tubers', label: 'Root and tuber crops' },
  { value: 'vegetables', label: 'Vegetables' },
  { value: 'fruit_crops', label: 'Fruit crops' },
  { value: 'oilseed_industrial', label: 'Oilseed and industrial' },
  { value: 'fodder_pasture', label: 'Fodder and pasture' },
  { value: 'herbs_spices', label: 'Herbs and spices' },
  { value: 'nuts_tree', label: 'Nuts and tree crops' },
  { value: 'ornamental_nursery', label: 'Ornamental and nursery' },
] as const;

export type CropCategory = typeof cropCategories[number]['value'];
export type CropInformationStatus = 'unknown' | 'estimated' | 'verified';

export interface CropProfile {
  suitableClimate?: string;
  temperatureRequirements?: string;
  soilRequirements?: string;
  soilPhRange?: string;
  waterRequirements?: string;
  irrigationRequirements?: string;
  plantingSeason?: string;
  plantingMethod?: string;
  seedRequirements?: string;
  fertilizerRequirements?: string;
  growthDuration?: string;
  growthStages?: string[];
  harvestPeriod?: string;
  commonPests?: string[];
  commonDiseases?: string[];
  nutrientRequirements?: string;
  harvestingMethods?: string;
  storageRequirements?: string;
  marketUses?: string[];
  productionCosts?: string;
  expectedYield?: string;
  yieldUnit?: string;
  references?: string[];
}

export interface CropLibraryEntry {
  id: string;
  name: string;
  category: CropCategory;
  scientific_name: string | null;
  description: string | null;
  profile: CropProfile;
  information_status: CropInformationStatus;
}

export const cropProfileFields: { key: keyof CropProfile; label: string; list?: boolean }[] = [
  { key: 'suitableClimate', label: 'Suitable climate' },
  { key: 'temperatureRequirements', label: 'Temperature requirements' },
  { key: 'soilRequirements', label: 'Soil requirements' },
  { key: 'soilPhRange', label: 'Soil pH range' },
  { key: 'waterRequirements', label: 'Water requirements' },
  { key: 'irrigationRequirements', label: 'Irrigation requirements' },
  { key: 'plantingSeason', label: 'Planting season' },
  { key: 'plantingMethod', label: 'Planting method' },
  { key: 'seedRequirements', label: 'Seed requirements' },
  { key: 'fertilizerRequirements', label: 'Fertiliser requirements' },
  { key: 'growthDuration', label: 'Growth duration' },
  { key: 'growthStages', label: 'Growth stages', list: true },
  { key: 'harvestPeriod', label: 'Harvest period' },
  { key: 'commonPests', label: 'Common pests', list: true },
  { key: 'commonDiseases', label: 'Common diseases', list: true },
  { key: 'nutrientRequirements', label: 'Nutrient requirements' },
  { key: 'harvestingMethods', label: 'Harvesting methods' },
  { key: 'storageRequirements', label: 'Storage requirements' },
  { key: 'marketUses', label: 'Market uses', list: true },
  { key: 'productionCosts', label: 'Production costs' },
  { key: 'expectedYield', label: 'Expected yield' },
  { key: 'yieldUnit', label: 'Yield unit' },
  { key: 'references', label: 'Sources / references', list: true },
];

export function cropCategoryLabel(category: string) {
  return cropCategories.find((item) => item.value === category)?.label ?? 'Other';
}

export function cropInformationStatusLabel(status: CropInformationStatus) {
  switch (status) {
    case 'verified': return 'Reviewed information';
    case 'estimated': return 'Estimates';
    default: return 'Information not yet verified';
  }
}
