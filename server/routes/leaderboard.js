const express = require('express');
const { query } = require('../db');
const { requireAuth } = require('../middleware/auth');
const { buildLeaderboard, getLeaderboardScope } = require('../lib/leaderboard');

const router = express.Router();
router.use(requireAuth);

router.get('/', async (req, res, next) => {
  const scope = typeof req.query.scope === 'string' ? req.query.scope : 'cohort';
  const cohortId = typeof req.query.cohortId === 'string' ? req.query.cohortId : null;
  const scopeCheck = getLeaderboardScope({
    userRole: req.user.role,
    requestedScope: scope,
    cohortMembership: Boolean(cohortId),
  });

  if (!scopeCheck.allowed) {
    res.status(403).json({ error: scopeCheck.reason });
    return;
  }

  try {
    let rows = [];

    if (req.user.role === 'trainer') {
      const trainingCohorts = cohortId
        ? await query('SELECT id, name FROM cohorts WHERE id = $1 AND trainer_id = $2', [cohortId, req.user.id])
        : await query('SELECT id, name FROM cohorts WHERE trainer_id = $1 ORDER BY created_at DESC', [req.user.id]);

      if (cohortId && !trainingCohorts.rows[0]) {
        res.status(404).json({ error: 'Cohort not found or you do not have access.' });
        return;
      }

      const candidates = trainingCohorts.rows.map((cohort) => cohort.id);
      if (!candidates.length) {
        rows = [];
      } else {
        const queryResult = await query(
          `SELECT users.display_name,
            COALESCE(ROUND(AVG(scores.value), 1), 0) AS score,
            true AS consent
           FROM cohort_members
           JOIN users ON users.id = cohort_members.user_id
           LEFT JOIN runs ON runs.user_id = users.id AND runs.created_at >= cohort_members.joined_at
           LEFT JOIN scores ON scores.run_id = runs.id
           WHERE cohort_members.cohort_id = ANY ($1)
           GROUP BY users.id, users.display_name
           ORDER BY score DESC, users.display_name ASC`,
          [candidates],
        );
        rows = queryResult.rows.map((row) => ({ display_name: row.display_name, score: Number(row.score || 0), consent: row.consent !== false }));
      }
    } else {
      const membership = await query(
        'SELECT 1 FROM cohort_members WHERE cohort_id = $1 AND user_id = $2',
        [cohortId, req.user.id],
      );

      if (!cohortId || !membership.rows[0]) {
        res.status(403).json({ error: 'Join a cohort before viewing the cohort leaderboard.' });
        return;
      }

      const result = await query(
        `SELECT users.display_name,
          COALESCE(ROUND(AVG(scores.value), 1), 0) AS score,
          true AS consent
         FROM cohort_members
         JOIN users ON users.id = cohort_members.user_id
         LEFT JOIN runs ON runs.user_id = users.id AND runs.created_at >= cohort_members.joined_at
         LEFT JOIN scores ON scores.run_id = runs.id
         WHERE cohort_members.cohort_id = $1
         GROUP BY users.id, users.display_name
         ORDER BY score DESC, users.display_name ASC`,
        [cohortId],
      );
      rows = result.rows.map((row) => ({ display_name: row.display_name, score: Number(row.score || 0), consent: row.consent !== false }));
    }

    const leaderboard = buildLeaderboard({ scope, entries: rows });
    res.json({ leaderboard });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
