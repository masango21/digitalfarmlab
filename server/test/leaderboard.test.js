const assert = require('node:assert/strict');
const test = require('node:test');
const { buildLeaderboard, getLeaderboardScope } = require('../lib/leaderboard');

test('leaderboard filters by consent and ranks top performers', () => {
  const leaderboard = buildLeaderboard({
    scope: 'cohort',
    entries: [
      { display_name: 'Nandi', score: 82, consent: false },
      { display_name: 'Amina', score: 94, consent: true },
      { display_name: 'Lerato', score: 90, consent: true },
    ],
  });

  assert.equal(leaderboard.scope, 'cohort');
  assert.deepEqual(leaderboard.rows.map((row) => row.display_name), ['Amina', 'Lerato']);
  assert.equal(leaderboard.rows.every((row) => row.consent), true);
});

test('leaderboard scope blocks learner access to institutional rankings', () => {
  const scope = getLeaderboardScope({
    userRole: 'learner',
    requestedScope: 'institution',
    cohortMembership: false,
  });

  assert.equal(scope.allowed, false);
  assert.match(scope.reason, /trainer/i);
});
