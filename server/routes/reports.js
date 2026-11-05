const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { buildReportSummary, generateCertificate } = require('../lib/reports');

const router = express.Router();
router.use(requireAuth);

router.get('/', (_req, res) => {
  const summary = buildReportSummary({
    farmName: 'Green Valley',
    scenarioName: 'Water saving',
    score: 88,
    yieldKg: 5400,
    waterLiters: 9600,
    completedAt: '2026-11-05T12:00:00.000Z',
  });

  res.json({ report: summary });
});

router.post('/certificate', (req, res) => {
  const certificate = generateCertificate({
    learnerName: req.body?.learnerName || 'Amina Ndlovu',
    farmName: req.body?.farmName || 'Green Valley',
    score: req.body?.score ?? 92,
    issueDate: req.body?.issueDate || '2026-11-05',
  });

  res.json({ certificate });
});

module.exports = router;
