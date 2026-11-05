const assert = require('node:assert/strict');
const test = require('node:test');
const { validateFarmInput, validateFieldInput, MAX_MAIN_CROPS } = require('../lib/farm-validation');

test('farm input accepts manual location and supported production systems', () => {
  for (const productionSystem of ['rainfed', 'irrigated', 'mixed']) {
    assert.equal(validateFarmInput({
      name: 'North field',
      areaHectares: 12.5,
      location: 'Farm location',
      latitude: -28.5,
      longitude: 26.2,
      productionSystem,
    }), null);
  }
});

test('farm input rejects invalid area, production system, and incomplete coordinates', () => {
  const validFarm = { name: 'North field', areaHectares: 12 };
  assert.match(validateFarmInput({ ...validFarm, areaHectares: -1 }), /non-negative/);
  assert.match(validateFarmInput({ ...validFarm, areaHectares: null }), /non-negative/);
  assert.match(validateFarmInput({ ...validFarm, productionSystem: 'unknown' }), /Production system/);
  assert.match(validateFarmInput({ ...validFarm, latitude: -28 }), /both be provided/);
  assert.match(validateFarmInput({ ...validFarm, latitude: true, longitude: 26.2 }), /Latitude must be/);
});

test('farm profiles accept regions, farm types, and multiple main crops', () => {
  assert.equal(validateFarmInput({
    name: 'Research Farm',
    areaHectares: 12,
    region: 'Gauteng',
    farmType: 'research',
    mainCrops: ['Maize', 'Soybeans'],
  }), null);
  assert.equal(validateFarmInput({
    region: 'Queensland',
    farmType: 'commercial',
    mainCrops: [],
  }, true), null);
});

test('farm profiles reject invalid regions, farm types, and crop lists', () => {
  const validFarm = { name: 'Research Farm', areaHectares: 12 };
  assert.match(validateFarmInput({ ...validFarm, region: ' '.repeat(2) }), /Region/);
  assert.match(validateFarmInput({ ...validFarm, region: 'r'.repeat(101) }), /Region/);
  assert.match(validateFarmInput({ ...validFarm, farmType: 'industrial' }), /Farm type/);
  assert.match(validateFarmInput({ ...validFarm, mainCrops: 'Maize' }), /list/);
  assert.match(validateFarmInput({ ...validFarm, mainCrops: Array(MAX_MAIN_CROPS + 1).fill('Crop') }), /no more than/);
  assert.match(validateFarmInput({ ...validFarm, mainCrops: ['Maize', ' '] }), /Each main crop/);
  assert.match(validateFarmInput({ ...validFarm, mainCrops: ['Maize', ' maize '] }), /duplicates/);
  assert.equal(validateFarmInput({}, true), null);
});

test('field input validates soil and approximate coordinates', () => {
  assert.equal(validateFieldInput({
    name: 'Field 01',
    areaHectares: 5,
    soilType: 'Clay loam',
    latitude: -28.5,
    longitude: 26.2,
  }), null);
  assert.match(validateFieldInput({ name: 'Field 01', areaHectares: 5, soilType: 'x'.repeat(101) }), /Soil type/);
  assert.match(validateFieldInput({ name: 'Field 01', areaHectares: 5, longitude: 26.2 }), /both be provided/);
  assert.match(validateFieldInput({}, true), /At least one field value/);
});
