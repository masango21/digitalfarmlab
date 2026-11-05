const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { summarizeActivity, buildTrendSnapshot } = require('../lib/analytics');

const router = express.Router();
router.use(requireAuth);

router.get('/', (_req, res) => {
  const activities = [
    { type: 'journal', value: 2 },
    { type: 'run', value: 4 },
    { type: 'journal', value: 1 },
    { type: 'task', value: 3 },
  ];

  const summary = summarizeActivity({ activities });
  const trend = buildTrendSnapshot({ values: [20, 32, 44, 58] });

  res.json({ summary, trend });
});

module.exports = router;
