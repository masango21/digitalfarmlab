const assert = require('node:assert/strict');
const test = require('node:test');
const { calculateOutcome } = require('../lib/simulation');

const scenario = {
  baseline_yield_kg: '5000',
  baseline_water_liters: '12000',
  baseline_cost: '1800',
};

test('baseline inputs return baseline farm metrics', () => {
  assert.deepEqual(calculateOutcome(scenario, 100, 100), {
    yieldKg: 5000,
    baselineYieldKg: 5000,
    waterLiters: 12000,
    baselineWaterLiters: 12000,
    cost: 1800,
    baselineCost: 1800,
    score: 60,
  });
});

test('reduced irrigation reports yield, water, cost, and score outcomes', () => {
  assert.deepEqual(calculateOutcome(scenario, 80, 100), {
    yieldKg: 4580,
    baselineYieldKg: 5000,
    waterLiters: 9600,
    baselineWaterLiters: 12000,
    cost: 1656,
    baselineCost: 1800,
    score: 61,
  });
});

test('score remains bounded at zero and one hundred', () => {
  for (const irrigation of [0, 50, 100, 150, 200]) {
    for (const fertilizer of [0, 50, 100, 150, 200]) {
      const { score } = calculateOutcome(scenario, irrigation, fertilizer);
      assert.ok(score >= 0 && score <= 100);
    }
  }
});
