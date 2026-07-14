import { describe, expect, it } from 'vitest';
import { DIRECTION_META, formatDelta, formatPct } from './direction';

describe('DIRECTION_META', () => {
  it('maps improvement to green and decline to red', () => {
    expect(DIRECTION_META.improvement.color).toBe('teal');
    expect(DIRECTION_META.decline.color).toBe('red');
    expect(DIRECTION_META.neutral.color).toBe('gray');
  });
});

describe('formatDelta', () => {
  it('adds an explicit sign', () => {
    expect(formatDelta(70)).toBe('+70');
    expect(formatDelta(-5)).toBe('-5');
    expect(formatDelta(0)).toBe('0');
  });
  it('appends a unit when given', () => {
    expect(formatDelta(70, 'deg')).toBe('+70 deg');
  });
  it('shows a dash for null', () => {
    expect(formatDelta(null)).toBe('—');
  });
});

describe('formatPct', () => {
  it('formats with sign and percent', () => {
    expect(formatPct(77.8)).toBe('+77.8%');
    expect(formatPct(-75)).toBe('-75%');
  });
  it('shows a dash for null', () => {
    expect(formatPct(null)).toBe('—');
  });
});
