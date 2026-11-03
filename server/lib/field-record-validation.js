const CROP_GROWTH_STAGES = new Set([
  'sowing',
  'emergence',
  'seedling',
  'vegetative',
  'flowering',
  'fruiting',
  'grain_filling',
  'maturity',
  'harvested',
]);

const SOIL_MEASUREMENT_TYPES = {
  soil_moisture: { unit: '%', min: 0, max: 100 },
  soil_temperature: { unit: '°C', min: -30, max: 80 },
  soil_ph: { unit: 'pH', min: 0, max: 14 },
  organic_matter: { unit: '%', min: 0, max: 100 },
  nitrogen: { unit: 'mg/kg', min: 0, max: 100000 },
  phosphorus: { unit: 'mg/kg', min: 0, max: 100000 },
  potassium: { unit: 'mg/kg', min: 0, max: 100000 },
};

const INSPECTION_HEALTH = new Set(['good', 'fair', 'poor', 'unknown']);

function validateCropInput(input, partial = false) {
  if ((!partial || input.name !== undefined)
      && (typeof input.name !== 'string' || !input.name.trim() || input.name.trim().length > 100)) {
    return 'Crop name is required and must be 100 characters or fewer';
  }
  for (const [field, label, maxLength] of [
    ['variety', 'Crop variety', 120],
    ['growthStage', 'Growth stage', 40],
    ['waterRequirementNotes', 'Water requirement notes', 1000],
    ['nutrientRequirementNotes', 'Nutrient requirement notes', 1000],
  ]) {
    const value = input[field];
    if (value !== undefined && value !== null
        && (typeof value !== 'string' || value.trim().length > maxLength || !value.trim())) {
      return `${label} must be 1–${maxLength} characters when provided`;
    }
  }
  if (input.growthStage && !CROP_GROWTH_STAGES.has(input.growthStage)) {
    return 'Growth stage is not supported';
  }
  const plantedAt = input.plantedAt;
  const expectedHarvestAt = input.expectedHarvestAt;
  for (const [value, label] of [[plantedAt, 'Planting date'], [expectedHarvestAt, 'Expected harvest date']]) {
    if (value !== undefined && value !== null && value !== '' && !isValidDate(value)) {
      return `${label} must be a valid YYYY-MM-DD date`;
    }
  }
  const currentPlantingDate = plantedAt === undefined ? input.currentPlantedAt : plantedAt;
  const currentHarvestDate = expectedHarvestAt === undefined ? input.currentExpectedHarvestAt : expectedHarvestAt;
  if (currentPlantingDate && currentHarvestDate && currentHarvestDate < currentPlantingDate) {
    return 'Expected harvest date must not be before planting date';
  }
  if (partial && ![
    'name', 'variety', 'growthStage', 'waterRequirementNotes', 'nutrientRequirementNotes',
    'plantedAt', 'expectedHarvestAt',
  ].some((key) => input[key] !== undefined)) {
    return 'At least one crop value is required';
  }
  return null;
}

function validateSoilMeasurement(input) {
  if (!Object.hasOwn(SOIL_MEASUREMENT_TYPES, input.type)) return 'Soil measurement type is not supported';
  const definition = SOIL_MEASUREMENT_TYPES[input.type];
  const value = parseNumber(input.value);
  if (!Number.isFinite(value) || value < definition.min || value > definition.max) {
    return `Value must be between ${definition.min} and ${definition.max} ${definition.unit}`;
  }
  if (input.unit !== definition.unit) return `Unit must be ${definition.unit}`;
  if (input.notes !== undefined && input.notes !== null
      && (typeof input.notes !== 'string' || input.notes.length > 1000)) {
    return 'Measurement notes must be 1000 characters or fewer';
  }
  if (input.recordedAt !== undefined && !isValidTimestamp(input.recordedAt)) {
    return 'Measurement time must be a valid ISO date-time';
  }
  return null;
}

function validateInspectionInput(input) {
  if (!INSPECTION_HEALTH.has(input.cropHealth)) return 'Crop health must be good, fair, poor, or unknown';
  if (typeof input.observations !== 'string' || !input.observations.trim() || input.observations.trim().length > 2000) {
    return 'Inspection observations are required and must be 2000 characters or fewer';
  }
  for (const [field, label] of [
    ['pestObservations', 'Pest observations'],
    ['diseaseObservations', 'Disease observations'],
  ]) {
    const value = input[field];
    if (value !== undefined && value !== null
        && (typeof value !== 'string' || value.length > 1000)) {
      return `${label} must be 1000 characters or fewer`;
    }
  }
  if (input.observedAt !== undefined && !isValidTimestamp(input.observedAt)) {
    return 'Inspection time must be a valid ISO date-time';
  }
  return null;
}

function parseNumber(value) {
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && value.trim()) return Number(value);
  return Number.NaN;
}

function isValidDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function isValidTimestamp(value) {
  if (typeof value !== 'string' || value.length > 50) return false;
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/.test(value)) {
    return false;
  }
  return isValidDate(value.slice(0, 10)) && Number.isFinite(Date.parse(value));
}

module.exports = {
  CROP_GROWTH_STAGES,
  SOIL_MEASUREMENT_TYPES,
  validateCropInput,
  validateInspectionInput,
  validateSoilMeasurement,
};
