const assert = require('node:assert/strict');
const test = require('node:test');
const { sanitizeJournalEntry, buildFeedbackSummary } = require('../lib/journal');

test('journal entry validator preserves clean learner submissions and rejects empty content', () => {
  const valid = sanitizeJournalEntry({
    userId: '11111111-1111-1111-1111-111111111111',
    title: 'Field notes',
    body: 'I tested the irrigation timing and reduced runoff this week.',
    tags: ['irrigation', 'soil'],
    visibility: 'cohort',
  });

  assert.equal(valid.valid, true);
  assert.equal(valid.entry.title, 'Field notes');
  assert.deepEqual(valid.entry.tags, ['irrigation', 'soil']);

  const invalid = sanitizeJournalEntry({
    userId: '11111111-1111-1111-1111-111111111111',
    title: '   ',
    body: '',
    visibility: 'private',
  });

  assert.equal(invalid.valid, false);
  assert.match(invalid.error, /title|body/i);
});

test('feedback summary totals positive, neutral, and unresolved mentor notes', () => {
  const summary = buildFeedbackSummary({
    feedback: [
      { rating: 'positive', action: 'Keep the irrigation notes' },
      { rating: 'neutral', action: 'Consider more crop-specific observations' },
      { rating: 'negative', action: 'Add missing field metrics' },
      { rating: 'positive', action: 'Good progress on soil review' },
    ],
  });

  assert.equal(summary.total, 4);
  assert.equal(summary.positive, 2);
  assert.equal(summary.neutral, 1);
  assert.equal(summary.negative, 1);
  assert.equal(summary.pendingReview, 1);
});
