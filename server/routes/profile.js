const express = require('express');
const { query } = require('../db');
const { requireAuth } = require('../middleware/auth');
const { upload, uploadImage } = require('../middleware/upload');

const router = express.Router();
router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    const result = await query(
      `SELECT users.id, users.display_name, users.email, users.role, users.avatar_url, users.created_at,
        COUNT(DISTINCT farms.id)::int AS farm_count,
        COUNT(DISTINCT scores.id)::int AS simulation_count,
        COUNT(DISTINCT tasks.id)::int AS pending_task_count
       FROM users
       LEFT JOIN farms ON farms.user_id = users.id
       LEFT JOIN scores ON scores.user_id = users.id
       LEFT JOIN tasks ON tasks.user_id = users.id AND tasks.completed_at IS NULL
       WHERE users.id = $1 GROUP BY users.id`,
      [req.user.id],
    );
    if (!result.rows[0]) {
      res.status(404).json({ error: 'Profile not found' });
      return;
    }
    const scores = await query(
      `SELECT scores.value, scores.created_at, scenarios.name AS scenario_name
       FROM scores JOIN runs ON runs.id = scores.run_id
       JOIN scenarios ON scenarios.id = runs.scenario_id
       WHERE scores.user_id = $1 ORDER BY scores.created_at DESC LIMIT 20`,
      [req.user.id],
    );
    res.json({ profile: result.rows[0], scores: scores.rows });
  } catch (error) {
    next(error);
  }
});

router.patch('/', async (req, res, next) => {
  const { displayName } = req.body || {};
  if (typeof displayName !== 'string' || displayName.trim().length < 2 || displayName.trim().length > 100) {
    res.status(400).json({ error: 'Display name must be between 2 and 100 characters' });
    return;
  }
  try {
    const result = await query(
      'UPDATE users SET display_name = $2, updated_at = now() WHERE id = $1 RETURNING id, display_name, email, role, avatar_url, created_at',
      [req.user.id, displayName.trim()],
    );
    if (!result.rows[0]) {
      res.status(404).json({ error: 'Profile not found' });
      return;
    }
    res.json({ profile: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

router.post('/avatar', upload.single('image'), uploadImage('digitalfarmlab/avatars'), async (req, res, next) => {
  try {
    const result = await query(
      'UPDATE users SET avatar_url = $2, updated_at = now() WHERE id = $1 RETURNING id, display_name, email, role, avatar_url, created_at',
      [req.user.id, req.uploadedImageUrl],
    );
    if (!result.rows[0]) {
      res.status(404).json({ error: 'Profile not found' });
      return;
    }
    res.json({ profile: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
