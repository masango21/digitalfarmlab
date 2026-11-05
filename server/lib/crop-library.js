const CROP_CATEGORIES = [
  { value: 'cereals_grains', label: 'Cereals and grains' },
  { value: 'legumes_pulses', label: 'Legumes and pulses' },
  { value: 'root_tubers', label: 'Root and tuber crops' },
  { value: 'vegetables', label: 'Vegetables' },
  { value: 'fruit_crops', label: 'Fruit crops' },
  { value: 'oilseed_industrial', label: 'Oilseed and industrial crops' },
  { value: 'fodder_pasture', label: 'Fodder and pasture crops' },
  { value: 'herbs_spices', label: 'Herbs and spices' },
  { value: 'nuts_tree', label: 'Nuts and tree crops' },
  { value: 'ornamental_nursery', label: 'Ornamental and nursery crops' },
];

const PROFILE_FIELDS = [
  'suitableClimate',
  'temperatureRequirements',
  'soilRequirements',
  'soilPhRange',
  'waterRequirements',
  'irrigationRequirements',
  'plantingSeason',
  'plantingMethod',
  'seedRequirements',
  'fertilizerRequirements',
  'growthDuration',
  'growthStages',
  'harvestPeriod',
  'commonPests',
  'commonDiseases',
  'nutrientRequirements',
  'harvestingMethods',
  'storageRequirements',
  'marketUses',
  'productionCosts',
  'expectedYield',
  'yieldUnit',
  'references',
];

const ARRAY_PROFILE_FIELDS = new Set([
  'growthStages',
  'commonPests',
  'commonDiseases',
  'marketUses',
  'references',
]);
const CATEGORY_VALUES = new Set(CROP_CATEGORIES.map((category) => category.value));
const INFORMATION_STATUSES = new Set(['unknown', 'estimated', 'verified']);

function validateCropLibraryEntry(input, partial = false) {
  if ((!partial || input.name !== undefined)
      && (typeof input.name !== 'string' || !input.name.trim() || input.name.trim().length > 100)) {
    return 'Crop name is required and must be 100 characters or fewer';
  }
  if ((!partial || input.category !== undefined) && !CATEGORY_VALUES.has(input.category)) {
    return 'Crop category is not supported';
  }
  for (const [field, label, maxLength] of [
    ['scientificName', 'Scientific name', 150],
    ['description', 'Description', 2000],
  ]) {
    const value = input[field];
    if (value !== undefined && value !== null
        && (typeof value !== 'string' || value.trim().length > maxLength)) {
      return `${label} must be ${maxLength} characters or fewer`;
    }
  }
  if (input.profile !== undefined) {
    if (!input.profile || typeof input.profile !== 'object' || Array.isArray(input.profile)) {
      return 'Crop profile must be an object';
    }
    for (const [field, value] of Object.entries(input.profile)) {
      if (!PROFILE_FIELDS.includes(field)) return `Crop profile field "${field}" is not supported`;
      if (ARRAY_PROFILE_FIELDS.has(field)) {
        if (!Array.isArray(value) || value.length > 50
            || value.some((entry) => typeof entry !== 'string' || entry.trim().length > 300)) {
          return `${field} must be a list of up to 50 text values`;
        }
      } else if (typeof value !== 'string' || value.length > 1000) {
        return `${field} must be text of 1000 characters or fewer`;
      }
    }
  }
  if (input.informationStatus !== undefined && !INFORMATION_STATUSES.has(input.informationStatus)) {
    return 'Information status must be unknown, estimated, or verified';
  }
  if (input.informationStatus === 'verified'
      && (!Array.isArray(input.profile?.references) || input.profile.references.length === 0)) {
    return 'Verified crop information must include at least one source reference';
  }
  if (partial && ![
    'name', 'category', 'scientificName', 'description', 'profile', 'informationStatus',
  ].some((field) => input[field] !== undefined)) {
    return 'At least one crop-library value is required';
  }
  return null;
}

function validateCropVariety(input) {
  if (typeof input.name !== 'string' || !input.name.trim() || input.name.trim().length > 120) {
    return 'Variety name is required and must be 120 characters or fewer';
  }
  if (input.region !== undefined && input.region !== null
      && (typeof input.region !== 'string' || input.region.trim().length > 100)) {
    return 'Variety region must be 100 characters or fewer';
  }
  if (input.notes !== undefined && input.notes !== null
      && (typeof input.notes !== 'string' || input.notes.length > 1000)) {
    return 'Variety notes must be 1000 characters or fewer';
  }
  if (input.informationStatus !== undefined && !INFORMATION_STATUSES.has(input.informationStatus)) {
    return 'Information status must be unknown, estimated, or verified';
  }
  if (input.informationStatus === 'verified' && !input.notes?.trim()) {
    return 'Verified variety information must include source notes';
  }
  return null;
}

function isUuid(value) {
  return typeof value === 'string'
    && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

module.exports = {
  CROP_CATEGORIES,
  PROFILE_FIELDS,
  validateCropLibraryEntry,
  validateCropVariety,
  isUuid,
};
