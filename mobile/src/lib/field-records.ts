export const cropNames = [
  'Maize',
  'Wheat',
  'Soybeans',
  'Sunflower',
  'Sorghum',
  'Dry beans',
  'Sugarcane',
  'Potatoes',
  'Tomatoes',
  'Citrus',
  'Grapes',
  'Apples',
  'Avocados',
] as const;

export const cropGrowthStages = [
  { value: 'sowing', label: 'Sowing' },
  { value: 'emergence', label: 'Emergence' },
  { value: 'seedling', label: 'Seedling' },
  { value: 'vegetative', label: 'Vegetative' },
  { value: 'flowering', label: 'Flowering' },
  { value: 'fruiting', label: 'Fruiting' },
  { value: 'grain_filling', label: 'Grain filling' },
  { value: 'maturity', label: 'Maturity' },
  { value: 'harvested', label: 'Harvested' },
] as const;

export const soilMeasurementTypes = [
  { value: 'soil_moisture', label: 'Soil moisture', unit: '%', range: '0–100%' },
  { value: 'soil_temperature', label: 'Soil temperature', unit: '°C', range: '−30–80 °C' },
  { value: 'soil_ph', label: 'Soil pH', unit: 'pH', range: '0–14' },
  { value: 'organic_matter', label: 'Organic matter', unit: '%', range: '0–100%' },
  { value: 'nitrogen', label: 'Nitrogen', unit: 'mg/kg', range: '0–100,000 mg/kg' },
  { value: 'phosphorus', label: 'Phosphorus', unit: 'mg/kg', range: '0–100,000 mg/kg' },
  { value: 'potassium', label: 'Potassium', unit: 'mg/kg', range: '0–100,000 mg/kg' },
] as const;

export const cropHealthOptions = [
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Needs attention' },
  { value: 'unknown', label: 'Not assessed' },
] as const;

export interface CropRecord {
  id: string;
  field_id: string;
  name: string;
  variety: string | null;
  growth_stage: string | null;
  water_requirement_notes: string | null;
  nutrient_requirement_notes: string | null;
  planted_at: string | null;
  expected_harvest_at: string | null;
  created_at: string;
}

export interface SoilMeasurement {
  id: string;
  field_id: string;
  sensor_type: string;
  value: string | number;
  unit: string;
  source: 'manual' | 'sensor' | 'simulated' | 'unknown';
  notes: string | null;
  recorded_at: string;
}

export interface FieldInspection {
  id: string;
  field_id: string;
  inspector_user_id: string;
  observed_at: string;
  crop_health: 'good' | 'fair' | 'poor' | 'unknown';
  observations: string;
  pest_observations: string | null;
  disease_observations: string | null;
  image_url: string | null;
  created_at: string;
}

export function cropGrowthStageLabel(value: string | null | undefined) {
  return cropGrowthStages.find((stage) => stage.value === value)?.label ?? 'Not recorded';
}

export function soilMeasurementLabel(value: string) {
  return soilMeasurementTypes.find((type) => type.value === value)?.label ?? value.replaceAll('_', ' ');
}

export function measurementSourceLabel(value: SoilMeasurement['source']) {
  switch (value) {
    case 'manual': return 'Manually entered';
    case 'sensor': return 'Sensor reading';
    case 'simulated': return 'Simulated';
    case 'unknown': return 'Source not recorded';
  }
}

export function cropHealthLabel(value: FieldInspection['crop_health']) {
  return cropHealthOptions.find((option) => option.value === value)?.label ?? 'Not assessed';
}
