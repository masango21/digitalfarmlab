const express = require('express');
const { query } = require('../db');
const { requireAuth } = require('../middleware/auth');
const { buildDailyChallenge, claimChallengeReward } = require('../lib/challenges');

const router = express.Router();
router.use(requireAuth);

const DEFAULT_PREFERENCES = {
  pushNotifications: true,
  emailUpdates: false,
  quietHours: true,
  challengeReminders: true,
};

router.get('/', async (req, res, next) => {
  try {
    const result = await query(
      'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 100',
      [req.user.id],
    );
    res.json({ notifications: result.rows });
  } catch (error) {
    next(error);
  }
});

router.get('/preferences', async (_req, res) => {
  res.json({ preferences: DEFAULT_PREFERENCES });
});

router.patch('/preferences', async (req, res) => {
  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const preferences = {
    ...DEFAULT_PREFERENCES,
    ...Object.fromEntries(
      Object.entries(DEFAULT_PREFERENCES).map(([key, defaultValue]) => [
        key,
        typeof body[key] === 'boolean' ? body[key] : defaultValue,
      ]),
    ),
  };

  res.json({ preferences });
});

router.get('/challenge', async (_req, res) => {
  const challenge = buildDailyChallenge({
    title: 'Complete a field check',
    target: 3,
    progress: 2,
    streak: 4,
    rewardId: 'field-check',
    claimedRewardIds: [],
  });

  res.json({ challenge });
});

router.post('/challenge/claim', async (req, res) => {
  const rewardId = typeof req.body?.rewardId === 'string' ? req.body.rewardId : 'field-check';
  const claimedRewardIds = Array.isArray(req.body?.claimedRewardIds) ? req.body.claimedRewardIds : [];

  res.json(claimChallengeReward({
    challengeId: 'field-check',
    rewardId,
    claimedRewardIds,
  }));
});

router.patch('/:id/read', async (req, res, next) => {
  try {
    const result = await query(
      'UPDATE notifications SET read_at = COALESCE(read_at, now()) WHERE id = $1 AND user_id = $2 RETURNING *',
      [req.params.id, req.user.id],
    );
    if (!result.rows[0]) {
      res.status(404).json({ error: 'Notification not found' });
      return;
    }
    res.json({ notification: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
