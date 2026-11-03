const { randomBytes } = require('node:crypto');
const express = require('express');
const { query } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    const result = await query(
      `SELECT cohorts.id, cohorts.name, cohorts.created_at,
        CASE WHEN cohorts.trainer_id = $1 THEN cohorts.invite_code ELSE NULL END AS invite_code,
        (SELECT COUNT(*)::int FROM cohort_members WHERE cohort_members.cohort_id = cohorts.id) AS member_count
       FROM cohorts
       WHERE cohorts.trainer_id = $1 OR EXISTS (
         SELECT 1 FROM cohort_members
         WHERE cohort_members.cohort_id = cohorts.id AND cohort_members.user_id = $1
       )
       ORDER BY cohorts.created_at DESC`,
      [req.user.id],
    );
    res.json({ cohorts: result.rows });
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  if (req.user.role !== 'trainer') {
    res.status(403).json({ error: 'Only trainers can create cohorts' });
    return;
  }
  const { name } = req.body || {};
  if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 100) {
    res.status(400).json({ error: 'Cohort name must be between 2 and 100 characters' });
    return;
  }
  try {
    const inviteCode = randomBytes(5).toString('hex').toUpperCase();
    const result = await query(
      'INSERT INTO cohorts (trainer_id, name, invite_code) VALUES ($1, $2, $3) RETURNING id, name, invite_code, created_at',
      [req.user.id, name.trim(), inviteCode],
    );
    res.status(201).json({ cohort: { ...result.rows[0], member_count: 0 } });
  } catch (error) {
    next(error);
  }
});

router.post('/join', async (req, res, next) => {
  if (req.user.role !== 'learner') {
    res.status(403).json({ error: 'Only learners can join cohorts' });
    return;
  }
  const inviteCode = typeof req.body?.inviteCode === 'string' ? req.body.inviteCode.trim().toUpperCase() : '';
  if (!/^[A-F0-9]{10}$/.test(inviteCode)) {
    res.status(400).json({ error: 'Enter a valid 10-character cohort code' });
    return;
  }
  try {
    const result = await query(
      `INSERT INTO cohort_members (cohort_id, user_id)
       SELECT id, $2 FROM cohorts WHERE invite_code = $1
       ON CONFLICT (cohort_id, user_id) DO NOTHING
       RETURNING cohort_id`,
      [inviteCode, req.user.id],
    );
    if (!result.rows[0]) {
      const cohort = await query(
        `SELECT id, name FROM cohorts
         WHERE invite_code = $1 AND EXISTS (
           SELECT 1 FROM cohort_members
           WHERE cohort_members.cohort_id = cohorts.id AND cohort_members.user_id = $2
         )`,
        [inviteCode, req.user.id],
      );
      if (cohort.rows[0]) {
        res.json({ cohort: cohort.rows[0], alreadyJoined: true });
        return;
      }
      res.status(404).json({ error: 'Cohort code not found' });
      return;
    }

    const cohort = await query('SELECT id, name FROM cohorts WHERE id = $1', [result.rows[0].cohort_id]);
    res.status(201).json({ cohort: cohort.rows[0], alreadyJoined: false });
  } catch (error) {
    next(error);
  }
});

router.get('/:id/results', async (req, res, next) => {
  if (req.user.role !== 'trainer') {
    res.status(403).json({ error: 'Only trainers can view cohort results' });
    return;
  }
  try {
    const cohortResult = await query(
      'SELECT id, name FROM cohorts WHERE id = $1 AND trainer_id = $2',
      [req.params.id, req.user.id],
    );
    if (!cohortResult.rows[0]) {
      res.status(404).json({ error: 'Cohort not found' });
      return;
    }
    const results = await query(
      `SELECT users.id AS user_id, users.display_name,
        COUNT(DISTINCT runs.id)::int AS simulation_count,
        COALESCE(ROUND(AVG(scores.value), 1), 0) AS average_score,
        MAX(runs.created_at) AS latest_run_at
       FROM cohort_members
       JOIN users ON users.id = cohort_members.user_id
       LEFT JOIN runs ON runs.user_id = users.id AND runs.created_at >= cohort_members.joined_at
       LEFT JOIN scores ON scores.run_id = runs.id
       WHERE cohort_members.cohort_id = $1
       GROUP BY users.id ORDER BY users.display_name`,
      [req.params.id],
    );
    res.json({ cohort: cohortResult.rows[0], learners: results.rows });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
