const express = require('express');
const { query } = require('../db');
const { requireAuth } = require('../middleware/auth');
const { buildDashboardSummary } = require('../lib/dashboard');

const router = express.Router();
router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    const [farmCountResult, fieldCountResult, taskCountResult, recentRunsResult, farmsResult] = await Promise.all([
      query('SELECT COUNT(*)::int AS farm_count FROM farms WHERE user_id = $1', [req.user.id]),
      query(
        `SELECT COUNT(*)::int AS field_count
         FROM fields
         WHERE farm_id IN (SELECT id FROM farms WHERE user_id = $1)`,
        [req.user.id],
      ),
      query(
        'SELECT COUNT(*)::int AS pending_task_count FROM tasks WHERE user_id = $1 AND completed_at IS NULL',
        [req.user.id],
      ),
      query(
        `SELECT runs.id, scenarios.name AS scenario_name, scores.value AS score, runs.created_at
         FROM runs
         JOIN scenarios ON scenarios.id = runs.scenario_id
         JOIN scores ON scores.run_id = runs.id
         WHERE runs.user_id = $1
         ORDER BY runs.created_at DESC
         LIMIT 5`,
        [req.user.id],
      ),
      query(
        `SELECT farms.id, farms.name, farms.location, farms.region, farms.area_hectares, farms.latitude,
          farms.longitude, farms.image_url, farms.farm_type, farms.production_system,
          COALESCE(field_counts.field_count, 0)::int AS field_count
         FROM farms
         LEFT JOIN (
           SELECT farm_id, COUNT(*)::int AS field_count
           FROM fields
           GROUP BY farm_id
         ) field_counts ON field_counts.farm_id = farms.id
         WHERE farms.user_id = $1
         ORDER BY farms.created_at DESC
         LIMIT 3`,
        [req.user.id],
      ),
    ]);

    const dashboard = buildDashboardSummary({
      farmCount: farmCountResult.rows[0]?.farm_count ?? 0,
      fieldCount: fieldCountResult.rows[0]?.field_count ?? 0,
      pendingTaskCount: taskCountResult.rows[0]?.pending_task_count ?? 0,
      lastScore: recentRunsResult.rows[0]?.score ?? null,
      recentRuns: recentRunsResult.rows,
    });

    res.json({
      ...dashboard,
      farms: farmsResult.rows,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
