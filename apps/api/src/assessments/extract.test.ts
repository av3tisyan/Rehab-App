import { describe, expect, it } from 'vitest';
import { extractPrimaryValue } from './extract';

describe('extractPrimaryValue', () => {
  it('trusts an explicit numeric value', () => {
    expect(extractPrimaryValue('ROM', { degrees: 90 }, 160)).toBe(160);
  });

  it('pulls the conventional key per type', () => {
    expect(extractPrimaryValue('ROM', { degrees: 90 }, undefined)).toBe(90);
    expect(extractPrimaryValue('MMT', { grade: 4 }, undefined)).toBe(4);
    expect(extractPrimaryValue('VAS', { score: 6 }, undefined)).toBe(6);
    expect(extractPrimaryValue('WEIGHT', { kg: 72.5 }, undefined)).toBe(72.5);
  });

  it('falls back to a generic value key', () => {
    expect(extractPrimaryValue('CUSTOM', { value: 42 }, undefined)).toBe(42);
  });

  it('returns null when no number is present', () => {
    expect(extractPrimaryValue('ROM', {}, undefined)).toBeNull();
    expect(extractPrimaryValue('ROM', undefined, undefined)).toBeNull();
    expect(extractPrimaryValue('ROM', { degrees: 'ninety' }, undefined)).toBeNull();
  });

  it('ignores non-finite explicit values', () => {
    expect(extractPrimaryValue('ROM', { degrees: 90 }, NaN)).toBe(90);
  });
});
