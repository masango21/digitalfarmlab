function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function calculateOutcome(scenario, irrigationPercent, fertilizerPercent) {
  const baselineYieldKg = Number(scenario.baseline_yield_kg);
  const baselineWaterLiters = Number(scenario.baseline_water_liters);
  const baselineCost = Number(scenario.baseline_cost);
  const irrigationFactor = Number(irrigationPercent) / 100;
  const fertilizerFactor = Number(fertilizerPercent) / 100;
  const scenarioId = scenario?.id || 'crop-growth';

  let yieldFactor = 1;
  let waterMultiplier = irrigationFactor;
  let costMultiplier = 0.25 + 0.4 * irrigationFactor + 0.35 * fertilizerFactor;

  if (scenarioId === 'water-saving') {
    yieldFactor = clamp(
      1 - Math.abs(1 - irrigationFactor) * 0.6 - Math.abs(1 - fertilizerFactor) * 0.12,
      0.35,
      1.1,
    );
    waterMultiplier = 0.45 + irrigationFactor * 0.55;
    costMultiplier = 0.25 + 0.42 * irrigationFactor + 0.33 * fertilizerFactor;
  } else if (scenarioId === 'soil-health') {
    const fertilizerBoost = Math.max(0, fertilizerFactor - 1) * 0.14;
    yieldFactor = clamp(
      1 - Math.abs(1 - irrigationFactor) * 0.18 - Math.abs(1 - fertilizerFactor) * 0.16 + fertilizerBoost,
      0.4,
      1.15,
    );
    waterMultiplier = 0.7 + irrigationFactor * 0.3;
    costMultiplier = 0.24 + 0.38 * irrigationFactor + 0.38 * fertilizerFactor;
  } else {
    yieldFactor = Math.max(
      0.35,
      1 - Math.abs(1 - irrigationFactor) * 0.42 - Math.abs(1 - fertilizerFactor) * 0.3,
    );
    waterMultiplier = irrigationFactor;
    costMultiplier = 0.25 + 0.4 * irrigationFactor + 0.35 * fertilizerFactor;
  }

  const yieldKg = Math.round(baselineYieldKg * yieldFactor);
  const waterLiters = Math.round(baselineWaterLiters * waterMultiplier);
  const cost = Number((baselineCost * costMultiplier).toFixed(2));
  const yieldScore = Math.min(100, (yieldKg / baselineYieldKg) * 100);
  const waterScore = Math.max(0, 100 - (waterLiters / baselineWaterLiters) * 100);
  const costScore = Math.max(0, 100 - (cost / baselineCost) * 100);
  const score = Math.round(yieldScore * 0.6 + waterScore * 0.2 + costScore * 0.2);

  return {
    yieldKg,
    baselineYieldKg,
    waterLiters,
    baselineWaterLiters,
    cost,
    baselineCost,
    score,
  };
}

module.exports = { calculateOutcome };
