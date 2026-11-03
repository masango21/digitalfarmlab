const express = require('express');
const { pool, query } = require('../db');
const { requireAuth } = require('../middleware/auth');
const { calculateOutcome } = require('../lib/simulation');

const router = express.Router();
router.use(requireAuth);

router.get('/', async (_req, res, next) => {
  try {
    const result = await query('SELECT * FROM scenarios ORDER BY name');
    res.json({ scenarios: result.rows });
  } catch (error) {
    next(error);
  }
});

router.post('/run', async (req, res, next) => {
  const {
    scenarioId = 'crop-growth',
    farmId = null,
    irrigationPercent = 100,
    fertilizerPercent = 100,
    plantingDate = null,
  } = req.body || {};

  const irrigation = Number(irrigationPercent);
  const fertilizer = Number(fertilizerPercent);
  if (!Number.isFinite(irrigation) || irrigation < 0 || irrigation > 200
      || !Number.isFinite(fertilizer) || fertilizer < 0 || fertilizer > 200) {
    res.status(400).json({ error: 'Irrigation and fertilizer must be between 0 and 200 percent' });
    return;
  }
  if (plantingDate !== null && (typeof plantingDate !== 'string' || Number.isNaN(Date.parse(plantingDate)))) {
    res.status(400).json({ error: 'Planting date must be a valid date string' });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const scenarioResult = await client.query('SELECT * FROM scenarios WHERE id = $1', [scenarioId]);
    const scenario = scenarioResult.rows[0];
    if (!scenario) {
      await client.query('ROLLBACK');
      res.status(404).json({ error: 'Scenario not found' });
      return;
    }
    if (farmId) {
      const farm = await client.query(
        'SELECT id FROM farms WHERE id = $1 AND user_id = $2',
        [farmId, req.user.id],
      );
      if (!farm.rows[0]) {
        await client.query('ROLLBACK');
        res.status(404).json({ error: 'Farm not found' });
        return;
      }
    }

    const parameters = { irrigationPercent: irrigation, fertilizerPercent: fertilizer, plantingDate };
    const outcome = calculateOutcome(scenario, irrigation, fertilizer);
    const runResult = await client.query(
      `INSERT INTO runs (user_id, farm_id, scenario_id, parameters, outcome)
       VALUES ($1, $2, $3, $4, $5) RETURNING id, created_at`,
      [req.user.id, farmId, scenario.id, parameters, outcome],
    );
    await client.query(
      'INSERT INTO scores (run_id, user_id, value) VALUES ($1, $2, $3)',
      [runResult.rows[0].id, req.user.id, outcome.score],
    );
    await client.query('COMMIT');
    res.status(201).json({
      runId: runResult.rows[0].id,
      scenario: { id: scenario.id, name: scenario.name },
      parameters,
      ...outcome,
      createdAt: runResult.rows[0].created_at,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
});

router.get('/runs', async (req, res, next) => {
  try {
    const result = await query(
      `SELECT runs.id, runs.scenario_id, scenarios.name AS scenario_name,
        runs.parameters, runs.outcome, scores.value AS score, runs.created_at
       FROM runs
       JOIN scenarios ON scenarios.id = runs.scenario_id
       JOIN scores ON scores.run_id = runs.id
       WHERE runs.user_id = $1 ORDER BY runs.created_at DESC LIMIT 50`,
      [req.user.id],
    );
    res.json({ runs: result.rows });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
