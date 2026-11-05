const assert = require('node:assert/strict');
const test = require('node:test');
const { summarizeActivity, buildTrendSnapshot } = require('../lib/analytics');

test('activity summaries calculate totals and trending patterns from persisted learner events', () => {
  const summary = summarizeActivity({
    activities: [
      { type: 'journal', value: 2 },
      { type: 'run', value: 4 },
      { type: 'journal', value: 1 },
      { type: 'task', value: 3 },
    ],
  });

  assert.equal(summary.total, 10);
  assert.equal(summary.byType.journal, 3);
  assert.equal(summary.byType.run, 4);
  assert.equal(summary.byType.task, 3);
});

test('trend snapshots keep the latest values and detect rising momentum', () => {
  const snapshot = buildTrendSnapshot({
    values: [20, 32, 44, 58],
  });

  assert.deepEqual(snapshot.points.map((point) => point.value), [20, 32, 44, 58]);
  assert.equal(snapshot.trend, 'up');
  assert.equal(snapshot.average, 38.5);
});
