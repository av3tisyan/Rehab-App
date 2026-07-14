import { describe, expect, it } from 'vitest';
import {
  compareMetric,
  computeDelta,
  computeDirection,
  computePctChange,
  type MetricTypeInfo,
} from './index';

const ROM: MetricTypeInfo = { higherIsBetter: true, isDirectional: true };
const PAIN: MetricTypeInfo = { higherIsBetter: false, isDirectional: true };
const VITAL: MetricTypeInfo = { higherIsBetter: true, isDirectional: false };

describe('computeDelta', () => {
  it('computes the difference', () => {
    expect(computeDelta(90, 160)).toBe(70);
    expect(computeDelta(160, 90)).toBe(-70);
  });
  it('returns null when an endpoint is missing', () => {
    expect(computeDelta(null, 160)).toBeNull();
    expect(computeDelta(90, null)).toBeNull();
  });
});

describe('computePctChange', () => {
  it('computes percentage relative to baseline magnitude', () => {
    expect(computePctChange(90, 160)).toBe(77.8);
    expect(computePctChange(10, 5)).toBe(-50);
  });
  it('returns null when baseline is zero or missing', () => {
    expect(computePctChange(0, 5)).toBeNull();
    expect(computePctChange(null, 5)).toBeNull();
  });
});

describe('computeDirection', () => {
  it('ROM/strength up is improvement, down is decline', () => {
    expect(computeDirection(70, ROM)).toBe('improvement');
    expect(computeDirection(-70, ROM)).toBe('decline');
  });
  it('pain down is improvement, up is decline', () => {
    expect(computeDirection(-3, PAIN)).toBe('improvement');
    expect(computeDirection(3, PAIN)).toBe('decline');
  });
  it('range-based vitals are always neutral', () => {
    expect(computeDirection(5, VITAL)).toBe('neutral');
    expect(computeDirection(-5, VITAL)).toBe('neutral');
  });
  it('no change is unchanged; missing delta is neutral', () => {
    expect(computeDirection(0, ROM)).toBe('unchanged');
    expect(computeDirection(null, ROM)).toBe('neutral');
  });
});

describe('compareMetric', () => {
  it('produces the full result for a ROM improvement', () => {
    expect(compareMetric({ baseline: 90, latest: 160 }, ROM)).toEqual({
      baseline: 90,
      latest: 160,
      delta: 70,
      pctChange: 77.8,
      direction: 'improvement',
    });
  });
});
