function calculateOutcome(scenario, irrigationPercent, fertilizerPercent) {
  const baselineYieldKg = Number(scenario.baseline_yield_kg);
  const baselineWaterLiters = Number(scenario.baseline_water_liters);
  const baselineCost = Number(scenario.baseline_cost);
  const irrigationFactor = irrigationPercent / 100;
  const fertilizerFactor = fertilizerPercent / 100;
  const yieldFactor = Math.max(
    0.35,
    1 - Math.abs(1 - irrigationFactor) * 0.42 - Math.abs(1 - fertilizerFactor) * 0.3,
  );
  const yieldKg = Math.round(baselineYieldKg * yieldFactor);
  const waterLiters = Math.round(baselineWaterLiters * irrigationFactor);
  const cost = Number((baselineCost * (0.25 + 0.4 * irrigationFactor + 0.35 * fertilizerFactor)).toFixed(2));
  const yieldScore = Math.min(100, yieldKg / baselineYieldKg * 100);
  const waterScore = Math.max(0, 100 - waterLiters / baselineWaterLiters * 100);
  const costScore = Math.max(0, 100 - cost / baselineCost * 100);
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
