const assert = require('node:assert/strict');
const test = require('node:test');
const { buildGamificationState, awardRewards } = require('../lib/gamification');

test('gamification state derives level and verified progress from farm activity', () => {
  const state = buildGamificationState({
    farmCount: 1,
    fieldCount: 2,
    scenarioRuns: 4,
    earnedRewardIds: ['farm-profile', 'field-setup'],
  });

  assert.equal(state.level, 2);
  assert.equal(state.totalPoints, 140);
  assert.equal(state.achievements.length, 3);
  assert.equal(state.nextLevelAt, 200);
  assert.equal(state.achievements[0].id, 'farm-profile');
  assert.equal(state.achievements[1].earned, true);
});

test('reward awards are idempotent and keep a clean history', () => {
  const history = awardRewards({
    rewards: [
      { id: 'farm-profile', title: 'Farm profile', verified: true },
      { id: 'field-setup', title: 'Field setup', verified: true },
      { id: 'scenario-run', title: 'Scenario run', verified: true },
    ],
    earnedRewardIds: ['farm-profile', 'farm-profile', 'field-setup'],
  });

  assert.deepEqual(history.map((item) => item.id), ['farm-profile', 'field-setup', 'scenario-run']);
  assert.equal(history.filter((item) => item.earned).length, 3);
});
