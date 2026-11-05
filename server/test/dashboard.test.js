const assert = require('node:assert/strict');
const test = require('node:test');
const { buildDashboardSummary } = require('../lib/dashboard');

test('dashboard summary aggregates farm, field, task, and score data', () => {
  const result = buildDashboardSummary({
    farmCount: 3,
    fieldCount: 12,
    pendingTaskCount: 2,
    lastScore: 87,
    recentRuns: [{
      id: 'run-1',
      scenario_name: 'Water saving trial',
      score: 87,
      created_at: '2026-11-05T09:00:00.000Z',
    }],
  });

  assert.equal(result.summary.farmCount, 3);
  assert.equal(result.summary.fieldCount, 12);
  assert.equal(result.summary.pendingTaskCount, 2);
  assert.equal(result.summary.lastScore, 87);
  assert.equal(result.recentRuns.length, 1);
  assert.equal(result.dataStatus.weather.available, false);
  assert.equal(result.dataStatus.sensors.available, false);
});
