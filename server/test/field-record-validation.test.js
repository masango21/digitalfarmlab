const assert = require('node:assert/strict');
const test = require('node:test');
const {
  validateCropInput,
  validateInspectionInput,
  validateSoilMeasurement,
} = require('../lib/field-record-validation');

test('crop records accept supported South African crop names and optional details', () => {
  for (const name of ['Maize', 'Wheat', 'Soybeans', 'Sunflower', 'Sorghum', 'Dry beans', 'Sugarcane', 'Potatoes', 'Tomatoes', 'Citrus', 'Grapes', 'Apples', 'Avocados']) {
    assert.equal(validateCropInput({
      name,
      variety: 'Local variety',
      growthStage: 'vegetative',
      waterRequirementNotes: 'Irrigated by drip; review weekly against field conditions.',
      nutrientRequirementNotes: 'Soil test advised before the next application.',
      plantedAt: '2026-01-15',
      expectedHarvestAt: '2026-07-15',
    }), null);
  }
});

test('crop validation rejects invalid stages, impossible dates, and reversed harvest dates', () => {
  assert.match(validateCropInput({ name: 'Maize', growthStage: 'unknown-stage' }), /Growth stage/);
  assert.match(validateCropInput({ name: 'Maize', plantedAt: '2026-02-30' }), /valid YYYY-MM-DD/);
  assert.match(validateCropInput({
    name: 'Maize',
    plantedAt: '2026-06-01',
    expectedHarvestAt: '2026-05-01',
  }), /before planting/);
  assert.match(validateCropInput({}, true), /At least one crop/);
  assert.match(validateCropInput({ name: 'Maize', waterRequirementNotes: 'x'.repeat(1001) }), /Water requirement notes/);
});

test('soil readings require a supported unit and a physically bounded value', () => {
  assert.equal(validateSoilMeasurement({ type: 'soil_moisture', value: '38.5', unit: '%' }), null);
  assert.equal(validateSoilMeasurement({ type: 'soil_ph', value: '6.2', unit: 'pH' }), null);
  assert.equal(validateSoilMeasurement({
    type: 'soil_moisture',
    value: 38.5,
    unit: '%',
    recordedAt: '2026-11-02T11:15:00Z',
  }), null);
  assert.match(validateSoilMeasurement({ type: 'soil_ph', value: 15, unit: 'pH' }), /between 0 and 14/);
  assert.match(validateSoilMeasurement({ type: 'nitrogen', value: 12, unit: '%' }), /Unit must be mg\/kg/);
  assert.match(validateSoilMeasurement({ type: 'phone_weather', value: 25, unit: '°C' }), /not supported/);
  assert.match(validateSoilMeasurement({
    type: 'soil_moisture',
    value: 38,
    unit: '%',
    recordedAt: 'November 2, 2026',
  }), /ISO date-time/);
  assert.match(validateSoilMeasurement({ type: '__proto__', value: 1 }), /not supported/);
});

test('inspection validation requires an observation and records diagnostic uncertainty without interpreting it', () => {
  assert.equal(validateInspectionInput({
    cropHealth: 'unknown',
    observations: 'Leaf spots visible on the lower canopy.',
    diseaseObservations: 'Possible leaf issue; not confirmed.',
  }), null);
  assert.match(validateInspectionInput({ cropHealth: 'good', observations: '  ' }), /observations are required/);
  assert.match(validateInspectionInput({ cropHealth: 'diagnosed', observations: 'Observed' }), /Crop health/);
});
