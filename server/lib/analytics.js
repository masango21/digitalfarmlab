function summarizeActivity({ activities = [] } = {}) {
  const list = Array.isArray(activities) ? activities : [];
  const byType = {};

  let total = 0;
  for (const activity of list) {
    if (!activity || typeof activity.type !== 'string') {
      continue;
    }

    const value = Number(activity.value ?? 0);
    const safeValue = Number.isFinite(value) ? value : 0;
    total += safeValue;
    byType[activity.type] = (byType[activity.type] || 0) + safeValue;
  }

  return {
    total,
    byType,
    count: list.length,
  };
}

function buildTrendSnapshot({ values = [] } = {}) {
  const points = Array.isArray(values)
    ? values.map((value, index) => ({
        index,
        value: Number(value ?? 0),
      }))
    : [];

  const average = points.length
    ? points.reduce((sum, point) => sum + point.value, 0) / points.length
    : 0;

  const trend = points.length > 1 && points[points.length - 1].value > points[0].value
    ? 'up'
    : points.length > 1 && points[points.length - 1].value < points[0].value
      ? 'down'
      : 'flat';

  return {
    points,
    average: Number(average.toFixed(1)),
    trend,
  };
}

module.exports = {
  summarizeActivity,
  buildTrendSnapshot,
};
