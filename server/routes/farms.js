const express = require('express');
const { query } = require('../db');
const { requireAuth } = require('../middleware/auth');
const { upload, uploadImage } = require('../middleware/upload');
const { validateFarmInput, validateFieldInput } = require('../lib/farm-validation');

const router = express.Router();
router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    const result = await query(
      `SELECT f.*, COUNT(fields.id)::int AS field_count
       FROM farms f LEFT JOIN fields ON fields.farm_id = f.id
       WHERE f.user_id = $1 GROUP BY f.id ORDER BY f.created_at DESC`,
      [req.user.id],
    );
    res.json({ farms: result.rows });
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  const {
    name,
    location = null,
    areaHectares = 0,
    latitude = null,
    longitude = null,
    productionSystem = 'mixed',
    region = null,
    farmType = 'mixed',
    mainCrops = [],
    imageUrl = null,
  } = req.body || {};
  const validationError = validateFarmInput({
    name,
    location,
    areaHectares,
    latitude,
    longitude,
    productionSystem,
    region,
    farmType,
    mainCrops,
  });
  if (validationError) {
    res.status(400).json({ error: validationError });
    return;
  }

  try {
    const area = Number(areaHectares);
    const result = await query(
      `INSERT INTO farms (
         user_id, name, location, area_hectares, latitude, longitude,
         production_system, region, farm_type, main_crops, image_url
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [
        req.user.id, name.trim(), location?.trim() || null, area, latitude, longitude,
        productionSystem, region?.trim() || null, farmType, mainCrops.map((crop) => crop.trim()), imageUrl,
      ],
    );
    res.status(201).json({ farm: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const result = await query(
      'SELECT * FROM farms WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id],
    );
    if (!result.rows[0]) {
      res.status(404).json({ error: 'Farm not found' });
      return;
    }
    const fields = await query(
      `SELECT fields.*,
        COALESCE(json_agg(DISTINCT crops) FILTER (WHERE crops.id IS NOT NULL), '[]') AS crops,
        COALESCE(json_agg(DISTINCT sensor_readings) FILTER (WHERE sensor_readings.id IS NOT NULL), '[]') AS sensor_readings
       FROM fields
       LEFT JOIN crops ON crops.field_id = fields.id
       LEFT JOIN sensor_readings ON sensor_readings.field_id = fields.id
       WHERE fields.farm_id = $1
       GROUP BY fields.id ORDER BY fields.created_at DESC`,
      [req.params.id],
    );
    const livestock = await query(
      'SELECT * FROM livestock WHERE farm_id = $1 ORDER BY created_at DESC',
      [req.params.id],
    );
    res.json({ farm: result.rows[0], fields: fields.rows, livestock: livestock.rows });
  } catch (error) {
    next(error);
  }
});

router.patch('/:id', async (req, res, next) => {
  const {
    name, location, areaHectares, latitude, longitude, productionSystem,
    region, farmType, mainCrops, imageUrl,
  } = req.body || {};
  const validationError = validateFarmInput({
    name,
    location,
    areaHectares,
    latitude,
    longitude,
    productionSystem,
    region,
    farmType,
    mainCrops,
  }, true);
  if (validationError) {
    res.status(400).json({ error: validationError });
    return;
  }
  if (imageUrl !== undefined && imageUrl !== null && typeof imageUrl !== 'string') {
    res.status(400).json({ error: 'Image URL must be a string' });
    return;
  }
  try {
    const area = areaHectares === undefined ? undefined : Number(areaHectares);
    const result = await query(
      `UPDATE farms SET
         name = COALESCE($3, name),
         location = CASE WHEN $4::boolean THEN $5 ELSE location END,
         area_hectares = COALESCE($6, area_hectares),
         latitude = CASE WHEN $7::boolean THEN $8 ELSE latitude END,
         longitude = CASE WHEN $9::boolean THEN $10 ELSE longitude END,
         image_url = CASE WHEN $11::boolean THEN $12 ELSE image_url END,
         production_system = CASE WHEN $13::boolean THEN $14 ELSE production_system END,
         region = CASE WHEN $15::boolean THEN $16 ELSE region END,
         farm_type = COALESCE($17, farm_type),
         main_crops = COALESCE($18::text[], main_crops),
         updated_at = now()
       WHERE id = $1 AND user_id = $2 RETURNING *`,
      [
        req.params.id, req.user.id, name === undefined ? null : name.trim(),
        location !== undefined, location, area ?? null,
        latitude !== undefined, latitude, longitude !== undefined, longitude,
        imageUrl !== undefined, imageUrl, productionSystem !== undefined, productionSystem,
        region !== undefined, region?.trim() || null, farmType ?? null,
        mainCrops === undefined ? null : mainCrops.map((crop) => crop.trim()),
      ],
    );
    if (!result.rows[0]) {
      res.status(404).json({ error: 'Farm not found' });
      return;
    }
    res.json({ farm: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const result = await query(
      'DELETE FROM farms WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user.id],
    );
    if (!result.rows[0]) {
      res.status(404).json({ error: 'Farm not found' });
      return;
    }
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

router.post('/:id/image', async (req, res, next) => {
  try {
    const farm = await query('SELECT id FROM farms WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    if (!farm.rows[0]) {
      res.status(404).json({ error: 'Farm not found' });
      return;
    }
    next();
  } catch (error) {
    next(error);
  }
}, upload.single('image'), uploadImage('digitalfarmlab/farms'), async (req, res, next) => {
  try {
    const result = await query(
      'UPDATE farms SET image_url = $3, updated_at = now() WHERE id = $1 AND user_id = $2 RETURNING *',
      [req.params.id, req.user.id, req.uploadedImageUrl],
    );
    if (!result.rows[0]) {
      res.status(404).json({ error: 'Farm not found' });
      return;
    }
    res.json({ farm: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/fields', async (req, res, next) => {
  const { name, areaHectares = 0, soilType = null, latitude = null, longitude = null } = req.body || {};
  const validationError = validateFieldInput({ name, areaHectares, soilType, latitude, longitude });
  if (validationError) {
    res.status(400).json({ error: validationError });
    return;
  }
  try {
    const area = Number(areaHectares);
    const farm = await query('SELECT id FROM farms WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    if (!farm.rows[0]) {
      res.status(404).json({ error: 'Farm not found' });
      return;
    }
    const result = await query(
      `INSERT INTO fields (farm_id, name, area_hectares, soil_type, latitude, longitude)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.params.id, name.trim(), area, soilType?.trim() || null, latitude, longitude],
    );
    res.status(201).json({ field: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/fields/:fieldId', async (req, res, next) => {
  const { name, areaHectares, soilType, latitude, longitude } = req.body || {};
  const validationError = validateFieldInput({
    name,
    areaHectares,
    soilType,
    latitude,
    longitude,
  }, true);
  if (validationError) {
    res.status(400).json({ error: validationError });
    return;
  }

  try {
    const area = areaHectares === undefined ? undefined : Number(areaHectares);
    const result = await query(
      `UPDATE fields SET
         name = COALESCE($4, name),
         area_hectares = COALESCE($5, area_hectares),
         soil_type = CASE WHEN $6::boolean THEN $7 ELSE soil_type END,
         latitude = CASE WHEN $8::boolean THEN $9 ELSE latitude END,
         longitude = CASE WHEN $10::boolean THEN $11 ELSE longitude END
       WHERE id = $1 AND farm_id = $2
         AND EXISTS (SELECT 1 FROM farms WHERE id = $2 AND user_id = $3)
       RETURNING *`,
      [
        req.params.fieldId, req.params.id, req.user.id,
        name === undefined ? null : name.trim(),
        area ?? null,
        soilType !== undefined, soilType?.trim() || null,
        latitude !== undefined, latitude,
        longitude !== undefined, longitude,
      ],
    );
    if (!result.rows[0]) {
      res.status(404).json({ error: 'Field not found' });
      return;
    }
    res.json({ field: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
