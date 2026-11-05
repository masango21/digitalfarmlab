const assert = require('node:assert/strict');
const test = require('node:test');
const { buildReportSummary, generateCertificate } = require('../lib/reports');

test('report summaries compile score, farm, and scenario details into a shareable snapshot', () => {
  const summary = buildReportSummary({
    farmName: 'Green Valley',
    scenarioName: 'Water saving',
    score: 88,
    yieldKg: 5400,
    waterLiters: 9600,
    completedAt: '2026-11-05T12:00:00.000Z',
  });

  assert.equal(summary.farmName, 'Green Valley');
  assert.equal(summary.score, 88);
  assert.equal(summary.status, 'ok');
  assert.match(summary.shareText, /Water saving/i);
});

test('certificates are generated with stable metadata and a verification token', () => {
  const certificate = generateCertificate({
    learnerName: 'Amina Ndlovu',
    farmName: 'Green Valley',
    score: 92,
    issueDate: '2026-11-05',
  });

  assert.equal(certificate.learnerName, 'Amina Ndlovu');
  assert.equal(certificate.score, 92);
  assert.ok(certificate.verifyToken.length >= 12);
});
