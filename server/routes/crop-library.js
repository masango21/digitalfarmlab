const express = require('express');
const { query } = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');
const {
  CROP_CATEGORIES,
  isUuid,
  validateCropLibraryEntry,
  validateCropVariety,
} = require('../lib/crop-library');

const router = express.Router();
router.use(requireAuth);
const requireAdmin = requireRole('admin');
const cropFields = `id, name, category, scientific_name, description, profile,
                    information_status, created_at, updated_at`;

function nullableText(value) {
  return value == null ? null : value.trim() || null;
}

function queryError(error, res, next, duplicateMessage) {
  if (error.code === '23505') {
    res.status(409).json({ error: duplicateMessage });
    return;
  }
  next(error);
}

router.get('/categories', async (_req, res, next) => {
  try {
    const result = await query(
      'SELECT category, COUNT(*)::int AS crop_count FROM crop_library GROUP BY category',
    );
    const counts = new Map(result.rows.map((row) => [row.category, row.crop_count]));
    res.json({
      categories: CROP_CATEGORIES.map((category) => ({
        ...category,
        cropCount: counts.get(category.value) || 0,
      })),
    });
  } catch (error) {
    next(error);
  }
});

router.get('/', async (req, res, next) => {
  const search = req.query.q ?? '';
  const category = req.query.category ?? '';
  const limit = req.query.limit === undefined ? 50 : Number(req.query.limit);
  const offset = req.query.offset === undefined ? 0 : Number(req.query.offset);
  if (typeof search !== 'string' || search.length > 100) {
    res.status(400).json({ error: 'Search text must be 100 characters or fewer' });
    return;
  }
  if (typeof category !== 'string' || (category && !CROP_CATEGORIES.some((item) => item.value === category))) {
    res.status(400).json({ error: 'Crop category is not supported' });
    return;
  }
  if (!Number.isInteger(limit) || limit < 1 || limit > 100
      || !Number.isInteger(offset) || offset < 0 || offset > 10000) {
    res.status(400).json({ error: 'Pagination values are outside the supported range' });
    return;
  }

  try {
    const result = await query(
      `SELECT ${cropFields} FROM crop_library
       WHERE ($1::text = '' OR name ILIKE $2 ESCAPE '\\')
         AND ($3::text = '' OR category = $3)
       ORDER BY category, lower(name)
       LIMIT $4 OFFSET $5`,
      [search, `%${search.replace(/[\\%_]/g, '\\$&')}%`, category, limit, offset],
    );
    res.json({
      crops: result.rows,
      pagination: { limit, offset, hasMore: result.rows.length === limit },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  if (!isUuid(req.params.id)) {
    res.status(400).json({ error: 'A valid crop ID is required' });
    return;
  }
  try {
    const cropResult = await query(`SELECT ${cropFields} FROM crop_library WHERE id = $1`, [req.params.id]);
    if (!cropResult.rows[0]) {
      res.status(404).json({ error: 'Crop not found' });
      return;
    }
    const varieties = await query(
      `SELECT id, name, region, notes, information_status, created_at, updated_at
       FROM crop_library_varieties WHERE crop_id = $1
       ORDER BY lower(region) NULLS FIRST, lower(name)`,
      [req.params.id],
    );
    res.json({ crop: { ...cropResult.rows[0], varieties: varieties.rows } });
  } catch (error) {
    next(error);
  }
});

router.post('/', requireAdmin, async (req, res, next) => {
  const input = req.body || {};
  const validationError = validateCropLibraryEntry(input);
  if (validationError) {
    res.status(400).json({ error: validationError });
    return;
  }
  try {
    const result = await query(
      `INSERT INTO crop_library (name, category, scientific_name, description, profile, information_status)
       VALUES ($1, $2, $3, $4, $5::jsonb, $6) RETURNING ${cropFields}`,
      [
        input.name.trim(), input.category, nullableText(input.scientificName),
        nullableText(input.description), JSON.stringify(input.profile || {}),
        input.informationStatus || 'unknown',
      ],
    );
    res.status(201).json({ crop: result.rows[0] });
  } catch (error) {
    queryError(error, res, next, 'A crop with this name already exists in this category');
  }
});

router.patch('/:id', requireAdmin, async (req, res, next) => {
  if (!isUuid(req.params.id)) {
    res.status(400).json({ error: 'A valid crop ID is required' });
    return;
  }
  const input = req.body || {};
  const validationError = validateCropLibraryEntry(input, true);
  if (validationError) {
    res.status(400).json({ error: validationError });
    return;
  }
  try {
    const result = await query(
      `UPDATE crop_library SET
         name = COALESCE($2, name),
         category = COALESCE($3, category),
         scientific_name = CASE WHEN $4::boolean THEN $5 ELSE scientific_name END,
         description = CASE WHEN $6::boolean THEN $7 ELSE description END,
         profile = CASE WHEN $8::boolean THEN profile || $9::jsonb ELSE profile END,
         information_status = COALESCE($10, information_status),
         updated_at = now()
       WHERE id = $1 RETURNING ${cropFields}`,
      [
        req.params.id, input.name === undefined ? null : input.name.trim(),
        input.category ?? null, input.scientificName !== undefined, nullableText(input.scientificName),
        input.description !== undefined, nullableText(input.description),
        input.profile !== undefined, JSON.stringify(input.profile || {}),
        input.informationStatus ?? null,
      ],
    );
    if (!result.rows[0]) {
      res.status(404).json({ error: 'Crop not found' });
      return;
    }
    res.json({ crop: result.rows[0] });
  } catch (error) {
    queryError(error, res, next, 'A crop with this name already exists in this category');
  }
});

router.post('/:id/varieties', requireAdmin, async (req, res, next) => {
  if (!isUuid(req.params.id)) {
    res.status(400).json({ error: 'A valid crop ID is required' });
    return;
  }
  const input = req.body || {};
  const validationError = validateCropVariety(input);
  if (validationError) {
    res.status(400).json({ error: validationError });
    return;
  }
  try {
    const result = await query(
      `INSERT INTO crop_library_varieties (crop_id, name, region, notes, information_status)
       SELECT id, $2, $3, $4, $5 FROM crop_library WHERE id = $1
       RETURNING id, crop_id, name, region, notes, information_status, created_at, updated_at`,
      [
        req.params.id, input.name.trim(), nullableText(input.region),
        nullableText(input.notes), input.informationStatus || 'unknown',
      ],
    );
    if (!result.rows[0]) {
      res.status(404).json({ error: 'Crop not found' });
      return;
    }
    res.status(201).json({ variety: result.rows[0] });
  } catch (error) {
    queryError(error, res, next, 'This variety already exists for the crop and region');
  }
});

router.patch('/:id/varieties/:varietyId', requireAdmin, async (req, res, next) => {
  if (!isUuid(req.params.id) || !isUuid(req.params.varietyId)) {
    res.status(400).json({ error: 'Valid crop and variety IDs are required' });
    return;
  }
  const input = req.body || {};
  const validationError = validateCropVariety(input);
  if (validationError) {
    res.status(400).json({ error: validationError });
    return;
  }
  try {
    const result = await query(
      `UPDATE crop_library_varieties SET
         name = $3, region = $4, notes = $5, information_status = $6, updated_at = now()
       WHERE id = $1 AND crop_id = $2
       RETURNING id, crop_id, name, region, notes, information_status, created_at, updated_at`,
      [
        req.params.varietyId, req.params.id, input.name.trim(), nullableText(input.region),
        nullableText(input.notes), input.informationStatus || 'unknown',
      ],
    );
    if (!result.rows[0]) {
      res.status(404).json({ error: 'Crop variety not found' });
      return;
    }
    res.json({ variety: result.rows[0] });
  } catch (error) {
    queryError(error, res, next, 'This variety already exists for the crop and region');
  }
});

router.delete('/:id/varieties/:varietyId', requireAdmin, async (req, res, next) => {
  if (!isUuid(req.params.id) || !isUuid(req.params.varietyId)) {
    res.status(400).json({ error: 'Valid crop and variety IDs are required' });
    return;
  }
  try {
    const result = await query(
      'DELETE FROM crop_library_varieties WHERE id = $1 AND crop_id = $2 RETURNING id',
      [req.params.varietyId, req.params.id],
    );
    if (!result.rows[0]) {
      res.status(404).json({ error: 'Crop variety not found' });
      return;
    }
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

module.exports = router;
