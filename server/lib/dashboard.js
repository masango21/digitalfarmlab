function buildDashboardSummary({
  farmCount = 0,
  fieldCount = 0,
  pendingTaskCount = 0,
  lastScore = null,
  recentRuns = [],
} = {}) {
  const normalizedRuns = Array.isArray(recentRuns)
    ? recentRuns.slice(0, 3).map((run) => ({
        id: run.id,
        scenario_name: run.scenario_name || run.scenarioName || 'Scenario',
        score: Number(run.score ?? run.value ?? 0),
        created_at: run.created_at || run.createdAt || new Date().toISOString(),
      }))
    : [];

  const resolvedLastScore = Number.isFinite(Number(lastScore))
    ? Number(lastScore)
    : normalizedRuns[0] && Number.isFinite(Number(normalizedRuns[0].score))
      ? Number(normalizedRuns[0].score)
      : null;

  return {
    summary: {
      farmCount: Number(farmCount) || 0,
      fieldCount: Number(fieldCount) || 0,
      pendingTaskCount: Number(pendingTaskCount) || 0,
      lastScore: resolvedLastScore,
      lastUpdated: new Date().toISOString(),
    },
    recentRuns: normalizedRuns,
    dataStatus: {
      weather: {
        available: false,
        label: 'No live weather source connected',
        source: 'manual',
      },
      sensors: {
        available: false,
        label: 'No live sensor feed connected',
        source: 'manual',
      },
    },
  };
}

module.exports = { buildDashboardSummary };
