function buildReportSummary({
  farmName = 'Farm',
  scenarioName = 'Scenario',
  score = 0,
  yieldKg = 0,
  waterLiters = 0,
  completedAt = new Date().toISOString(),
} = {}) {
  const normalizedScore = Number(score) || 0;
  const normalizedYield = Number(yieldKg) || 0;
  const normalizedWater = Number(waterLiters) || 0;
  const safeCompletedAt = completedAt ? new Date(completedAt).toISOString() : new Date().toISOString();
  const status = normalizedScore >= 70 ? 'ok' : normalizedScore >= 40 ? 'warning' : 'at-risk';

  return {
    farmName: String(farmName || 'Farm'),
    scenarioName: String(scenarioName || 'Scenario'),
    score: normalizedScore,
    yieldKg: normalizedYield,
    waterLiters: normalizedWater,
    completedAt: safeCompletedAt,
    status,
    shareText: `${String(farmName || 'Farm')} completed ${String(scenarioName || 'Scenario')} with a score of ${normalizedScore} and ${normalizedYield} kg yield.`,
  };
}

function generateCertificate({
  learnerName = 'Learner',
  farmName = 'Farm',
  score = 0,
  issueDate = new Date().toISOString().slice(0, 10),
} = {}) {
  const normalizedScore = Number(score) || 0;
  const token = `DFL-${String(learnerName || 'Learner').toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/^-|-$/g, '')}-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;

  return {
    learnerName: String(learnerName || 'Learner'),
    farmName: String(farmName || 'Farm'),
    score: normalizedScore,
    issueDate: String(issueDate),
    verifyToken: token,
    certificateId: `CERT-${Date.now().toString(36).toUpperCase()}`,
  };
}

module.exports = {
  buildReportSummary,
  generateCertificate,
};
