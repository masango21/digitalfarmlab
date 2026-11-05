const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { sanitizeJournalEntry, buildFeedbackSummary } = require('../lib/journal');

const router = express.Router();
router.use(requireAuth);

const demoEntries = [
  {
    id: 'entry-1',
    userId: 'demo-user',
    title: 'Observed soil moisture trend',
    body: 'The soil stayed uneven after irrigation. I will keep monitoring the field before the next cycle.',
    tags: ['soil', 'irrigation'],
    visibility: 'cohort',
    createdAt: new Date().toISOString(),
  },
];

const demoFeedback = [
  { id: 'fb-1', rating: 'positive', action: 'Keep the irrigation notes' },
  { id: 'fb-2', rating: 'neutral', action: 'Consider more crop-specific observations' },
  { id: 'fb-3', rating: 'negative', action: 'Add missing field metrics' },
  { id: 'fb-4', rating: 'positive', action: 'Good progress on soil review' },
];

router.get('/entries', (_req, res) => {
  res.json({ entries: demoEntries });
});

router.post('/entries', (req, res) => {
  const result = sanitizeJournalEntry({
    userId: req.user.id,
    title: req.body?.title,
    body: req.body?.body,
    tags: req.body?.tags,
    visibility: req.body?.visibility,
  });

  if (!result.valid) {
    res.status(400).json({ error: result.error });
    return;
  }

  const entry = {
    id: `entry-${Date.now()}`,
    ...result.entry,
  };

  demoEntries.unshift(entry);
  res.status(201).json({ entry });
});

router.get('/feedback', (req, res) => {
  const visibleFeedback = req.user.role === 'trainer' ? demoFeedback : demoFeedback.slice(0, 2);

  res.json({
    feedback: visibleFeedback,
    summary: buildFeedbackSummary({ feedback: visibleFeedback }),
  });
});

module.exports = router;
