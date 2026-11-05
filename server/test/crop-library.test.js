const assert = require('node:assert/strict');
const test = require('node:test');
const {
  CROP_CATEGORIES,
  PROFILE_FIELDS,
  validateCropLibraryEntry,
  validateCropVariety,
  isUuid,
} = require('../lib/crop-library');

test('crop-library entries accept supported categories and profile values', () => {
  assert.equal(validateCropLibraryEntry({
    name: 'Maize',
    category: 'cereals_grains',
    scientificName: 'Example scientific name',
    description: 'Educational description.',
    profile: {
      soilPhRange: 'Unknown pending regional source',
      growthStages: ['sowing', 'emergence'],
      references: ['https://example.org/agronomy'],
    },
    informationStatus: 'estimated',
  }), null);
  assert.equal(CROP_CATEGORIES.length, 10);
  assert.ok(PROFILE_FIELDS.includes('expectedYield'));
});

test('crop-library validation rejects invalid fields and oversized values', () => {
  const validEntry = { name: 'Maize', category: 'cereals_grains' };
  assert.match(validateCropLibraryEntry({ ...validEntry, category: 'unknown' }), /category/);
  assert.match(validateCropLibraryEntry({ ...validEntry, name: '  ' }), /Crop name/);
  assert.match(validateCropLibraryEntry({ ...validEntry, profile: ['invalid'] }), /object/);
  assert.match(validateCropLibraryEntry({ ...validEntry, profile: { invented: 'value' } }), /not supported/);
  assert.match(validateCropLibraryEntry({ ...validEntry, profile: { growthStages: 'emergence' } }), /list/);
  assert.match(validateCropLibraryEntry({ ...validEntry, informationStatus: 'confirmed' }), /Information status/);
  assert.match(validateCropLibraryEntry({ ...validEntry, profile: {}, informationStatus: 'verified' }), /source reference/);
  assert.match(validateCropLibraryEntry({}, true), /At least one crop-library value/);
});

test('regional crop varieties require safe names and supported information status', () => {
  assert.equal(validateCropVariety({
    name: 'Demo-1',
    region: 'Gauteng',
    notes: 'Locally recorded name.',
    informationStatus: 'estimated',
  }), null);
  assert.match(validateCropVariety({ name: '' }), /Variety name/);
  assert.match(validateCropVariety({ name: 'Demo-1', region: 'x'.repeat(101) }), /region/);
  assert.match(validateCropVariety({ name: 'Demo-1', informationStatus: 'confirmed' }), /Information status/);
  assert.match(validateCropVariety({ name: 'Demo-1', informationStatus: 'verified' }), /source notes/);
});

test('crop-library identifiers must be UUIDs', () => {
  assert.equal(isUuid('b7318943-c792-4f69-9a9f-c6549e628146'), true);
  assert.equal(isUuid('not-a-uuid'), false);
});
