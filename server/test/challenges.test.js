const assert = require('node:assert/strict');
const test = require('node:test');
const { buildDailyChallenge, claimChallengeReward } = require('../lib/challenges');

test('daily challenge resolves progress, streak, and completion status', () => {
  const challenge = buildDailyChallenge({
    title: 'Complete a field check',
    target: 3,
    progress: 2,
    streak: 4,
    rewardId: 'field-check',
    claimedRewardIds: [],
  });

  assert.equal(challenge.title, 'Complete a field check');
  assert.equal(challenge.progress, 2);
  assert.equal(challenge.percentComplete, 67);
  assert.equal(challenge.completed, false);
  assert.equal(challenge.rewarded, false);
});

test('challenge reward claims are idempotent and prevent duplicate awards', () => {
  const result = claimChallengeReward({
    challengeId: 'field-check',
    rewardId: 'field-check',
    claimedRewardIds: ['field-check', 'field-check'],
  });

  assert.equal(result.rewardClaimed, false);
  assert.deepEqual(result.claimedRewardIds, ['field-check']);
});
