/**
 * Comparison logic — the baseline-vs-final math and improvement direction.
 *
 * Direction is driven by the assessment type's flags, never hardcoded per metric:
 *   - isDirectional = false  → NEUTRAL (range-based vitals: weight, BP, HR, BMI)
 *   - higherIsBetter = true  → an increase is improvement (ROM, strength)
 *   - higherIsBetter = false → a decrease is improvement (pain)
 */

export type Direction = 'improvement' | 'decline' | 'unchanged' | 'neutral';

export interface MetricTypeInfo {
  higherIsBetter: boolean;
  isDirectional: boolean;
}

export interface ComparisonInput {
  baseline: number | null;
  latest: number | null;
}

export interface ComparisonResult {
  baseline: number | null;
  latest: number | null;
  delta: number | null;
  pctChange: number | null;
  direction: Direction;
}

/** Absolute change from baseline to latest; null if either endpoint is missing. */
export function computeDelta(baseline: number | null, latest: number | null): number | null {
  if (baseline === null || latest === null) return null;
  return round(latest - baseline);
}

/** Percentage change relative to baseline; null if baseline is missing or zero. */
export function computePctChange(baseline: number | null, latest: number | null): number | null {
  if (baseline === null || latest === null || baseline === 0) return null;
  return round(((latest - baseline) / Math.abs(baseline)) * 100, 1);
}

/** Classifies a change as improvement / decline / unchanged / neutral. */
export function computeDirection(delta: number | null, type: MetricTypeInfo): Direction {
  if (!type.isDirectional) return 'neutral';
  if (delta === null) return 'neutral';
  if (delta === 0) return 'unchanged';
  const increased = delta > 0;
  const isImprovement = increased === type.higherIsBetter;
  return isImprovement ? 'improvement' : 'decline';
}

/** Full comparison for a single metric endpoint pair. */
export function compareMetric(input: ComparisonInput, type: MetricTypeInfo): ComparisonResult {
  const delta = computeDelta(input.baseline, input.latest);
  return {
    baseline: input.baseline,
    latest: input.latest,
    delta,
    pctChange: computePctChange(input.baseline, input.latest),
    direction: computeDirection(delta, type),
  };
}

function round(n: number, decimals = 2): number {
  const f = 10 ** decimals;
  return Math.round(n * f) / f;
}
