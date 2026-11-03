const express = require('express');
const { query } = require('../db');
const { requireAuth } = require('../middleware/auth');
const { upload, uploadImage } = require('../middleware/upload');
const {
  SOIL_MEASUREMENT_TYPES,
  validateCropInput,
  validateInspectionInput,
  validateSoilMeasurement,
} = require('../lib/field-record-validation');

const router = express.Router();
router.use(requireAuth);

async function findOwnedField(fieldId, userId) {
  const result = await query(
    `SELECT fields.id FROM fields
     JOIN farms ON farms.id = fields.farm_id
     WHERE fields.id = $1 AND farms.user_id = $2`,
    [fieldId, userId],
  );
  return result.rows[0];
}

function dateOnly(value) {
  if (!value) return null;
  return typeof value === 'string' ? value.slice(0, 10) : value.toISOString().slice(0, 10);
}

router.get('/fields/:fieldId/crops', async (req, res, next) => {
  try {
    if (!await findOwnedField(req.params.fieldId, req.user.id)) {
      res.status(404).json({ error: 'Field not found' });
      return;
    }
    const result = await query(
      `SELECT id, field_id, name, variety, growth_stage, water_requirement_notes,
              nutrient_requirement_notes, planted_at, expected_harvest_at, created_at
       FROM crops WHERE field_id = $1
       ORDER BY planted_at DESC NULLS LAST, created_at DESC`,
      [req.params.fieldId],
    );
    res.json({ crops: result.rows });
  } catch (error) {
    next(error);
  }
});

router.post('/fields/:fieldId/crops', async (req, res, next) => {
  const {
    name,
    variety = null,
    growthStage = null,
    waterRequirementNotes = null,
    nutrientRequirementNotes = null,
    plantedAt = null,
    expectedHarvestAt = null,
  } = req.body || {};
  const validationError = validateCropInput({
    name, variety, growthStage, waterRequirementNotes, nutrientRequirementNotes, plantedAt, expectedHarvestAt,
  });
  if (validationError) {
    res.status(400).json({ error: validationError });
    return;
  }

  try {
    if (!await findOwnedField(req.params.fieldId, req.user.id)) {
      res.status(404).json({ error: 'Field not found' });
      return;
    }
    const result = await query(
      `INSERT INTO crops
         (field_id, name, variety, growth_stage, water_requirement_notes,
          nutrient_requirement_notes, planted_at, expected_harvest_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        req.params.fieldId, name.trim(), variety?.trim() || null, growthStage,
        waterRequirementNotes?.trim() || null, nutrientRequirementNotes?.trim() || null,
        plantedAt || null, expectedHarvestAt || null,
      ],
    );
    res.status(201).json({ crop: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

router.patch('/crops/:id', async (req, res, next) => {
  const {
    name, variety, growthStage, waterRequirementNotes, nutrientRequirementNotes, plantedAt, expectedHarvestAt,
  } = req.body || {};
  try {
    const existing = await query(
      `SELECT crops.* FROM crops
       JOIN fields ON fields.id = crops.field_id
       JOIN farms ON farms.id = fields.farm_id
       WHERE crops.id = $1 AND farms.user_id = $2`,
      [req.params.id, req.user.id],
    );
    if (!existing.rows[0]) {
      res.status(404).json({ error: 'Crop record not found' });
      return;
    }
    const current = existing.rows[0];
    const validationError = validateCropInput({
      name,
      variety,
      growthStage,
      waterRequirementNotes,
      nutrientRequirementNotes,
      plantedAt,
      expectedHarvestAt,
      currentPlantedAt: dateOnly(current.planted_at),
      currentExpectedHarvestAt: dateOnly(current.expected_harvest_at),
    }, true);
    if (validationError) {
      res.status(400).json({ error: validationError });
      return;
    }
    const result = await query(
      `UPDATE crops SET
         name = COALESCE($3, name),
         variety = CASE WHEN $4::boolean THEN $5 ELSE variety END,
         growth_stage = CASE WHEN $6::boolean THEN $7 ELSE growth_stage END,
         water_requirement_notes = CASE WHEN $8::boolean THEN $9 ELSE water_requirement_notes END,
         nutrient_requirement_notes = CASE WHEN $10::boolean THEN $11 ELSE nutrient_requirement_notes END,
         planted_at = CASE WHEN $12::boolean THEN $13::date ELSE planted_at END,
         expected_harvest_at = CASE WHEN $14::boolean THEN $15::date ELSE expected_harvest_at END
       WHERE id = $1 AND field_id = $2 RETURNING *`,
      [
        req.params.id, current.field_id,
        name === undefined ? null : name.trim(),
        variety !== undefined, variety?.trim() || null,
        growthStage !== undefined, growthStage || null,
        waterRequirementNotes !== undefined, waterRequirementNotes?.trim() || null,
        nutrientRequirementNotes !== undefined, nutrientRequirementNotes?.trim() || null,
        plantedAt !== undefined, plantedAt || null,
        expectedHarvestAt !== undefined, expectedHarvestAt || null,
      ],
    );
    if (!result.rows[0]) {
      res.status(404).json({ error: 'Crop record not found' });
      return;
    }
    res.json({ crop: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

router.delete('/crops/:id', async (req, res, next) => {
  try {
    const result = await query(
      `DELETE FROM crops
       WHERE id = $1
         AND EXISTS (
           SELECT 1 FROM fields
           JOIN farms ON farms.id = fields.farm_id
           WHERE fields.id = crops.field_id AND farms.user_id = $2
         )
       RETURNING id`,
      [req.params.id, req.user.id],
    );
    if (!result.rows[0]) {
      res.status(404).json({ error: 'Crop record not found' });
      return;
    }
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

router.get('/fields/:fieldId/soil-measurements', async (req, res, next) => {
  try {
    if (!await findOwnedField(req.params.fieldId, req.user.id)) {
      res.status(404).json({ error: 'Field not found' });
      return;
    }
    const result = await query(
      `SELECT id, field_id, sensor_type, value, unit, source, notes, recorded_at
       FROM sensor_readings WHERE field_id = $1
       ORDER BY recorded_at DESC, id DESC`,
      [req.params.fieldId],
    );
    res.json({ measurements: result.rows });
  } catch (error) {
    next(error);
  }
});

router.post('/fields/:fieldId/soil-measurements', async (req, res, next) => {
  const { type, value, unit, notes = null, recordedAt } = req.body || {};
  const validationError = validateSoilMeasurement({ type, value, unit, notes, recordedAt });
  if (validationError) {
    res.status(400).json({ error: validationError });
    return;
  }
  try {
    if (!await findOwnedField(req.params.fieldId, req.user.id)) {
      res.status(404).json({ error: 'Field not found' });
      return;
    }
    const result = await query(
      `INSERT INTO sensor_readings (field_id, sensor_type, value, unit, source, notes, recorded_at)
       VALUES ($1, $2, $3, $4, 'manual', $5, COALESCE($6::timestamptz, now()))
       RETURNING id, field_id, sensor_type, value, unit, source, notes, recorded_at`,
      [
        req.params.fieldId,
        type,
        Number(value),
        SOIL_MEASUREMENT_TYPES[type].unit,
        notes?.trim() || null,
        recordedAt ?? null,
      ],
    );
    res.status(201).json({ measurement: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

router.get('/fields/:fieldId/inspections', async (req, res, next) => {
  try {
    if (!await findOwnedField(req.params.fieldId, req.user.id)) {
      res.status(404).json({ error: 'Field not found' });
      return;
    }
    const result = await query(
      `SELECT id, field_id, inspector_user_id, observed_at, crop_health, observations,
              pest_observations, disease_observations, image_url, created_at
       FROM field_inspections WHERE field_id = $1
       ORDER BY observed_at DESC, created_at DESC`,
      [req.params.fieldId],
    );
    res.json({ inspections: result.rows });
  } catch (error) {
    next(error);
  }
});

router.post('/fields/:fieldId/inspections', async (req, res, next) => {
  const { cropHealth, observations, pestObservations = null, diseaseObservations = null, observedAt } = req.body || {};
  const validationError = validateInspectionInput({
    cropHealth,
    observations,
    pestObservations,
    diseaseObservations,
    observedAt,
  });
  if (validationError) {
    res.status(400).json({ error: validationError });
    return;
  }
  try {
    if (!await findOwnedField(req.params.fieldId, req.user.id)) {
      res.status(404).json({ error: 'Field not found' });
      return;
    }
    const result = await query(
      `INSERT INTO field_inspections
         (field_id, inspector_user_id, observed_at, crop_health, observations, pest_observations, disease_observations)
       VALUES ($1, $2, COALESCE($3::timestamptz, now()), $4, $5, $6, $7)
       RETURNING id, field_id, inspector_user_id, observed_at, crop_health, observations,
                 pest_observations, disease_observations, image_url, created_at`,
      [
        req.params.fieldId, req.user.id, observedAt ?? null, cropHealth,
        observations.trim(), pestObservations?.trim() || null, diseaseObservations?.trim() || null,
      ],
    );
    res.status(201).json({ inspection: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

router.post('/inspections/:id/image', async (req, res, next) => {
  try {
    const result = await query(
      `SELECT field_inspections.id FROM field_inspections
       JOIN fields ON fields.id = field_inspections.field_id
       JOIN farms ON farms.id = fields.farm_id
       WHERE field_inspections.id = $1 AND farms.user_id = $2`,
      [req.params.id, req.user.id],
    );
    if (!result.rows[0]) {
      res.status(404).json({ error: 'Inspection not found' });
      return;
    }
    next();
  } catch (error) {
    next(error);
  }
}, upload.single('image'), uploadImage('digitalfarmlab/inspections'), async (req, res, next) => {
  try {
    const result = await query(
      `UPDATE field_inspections SET image_url = $3
       WHERE id = $1
         AND EXISTS (
           SELECT 1 FROM fields
           JOIN farms ON farms.id = fields.farm_id
           WHERE fields.id = field_inspections.field_id AND farms.user_id = $2
         )
       RETURNING id, field_id, inspector_user_id, observed_at, crop_health, observations,
                 pest_observations, disease_observations, image_url, created_at`,
      [req.params.id, req.user.id, req.uploadedImageUrl],
    );
    if (!result.rows[0]) {
      res.status(404).json({ error: 'Inspection not found' });
      return;
    }
    res.json({ inspection: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
