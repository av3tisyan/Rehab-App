import { describe, expect, it } from 'vitest';
import { measureKindLabel, motionLabel, muscleLabel, regionLabel } from './clinical-terms';

describe('regionLabel', () => {
  it('translates known regions', () => {
    expect(regionLabel('shoulder', 'en')).toBe('Shoulder');
    expect(regionLabel('shoulder', 'hy')).toBe('Ուս');
    expect(regionLabel('cervical_spine', 'hy')).toBe('Պարանոցային ողնաշար');
  });
  it('falls back to prettified English for unknown codes', () => {
    expect(regionLabel('elbow_tip', 'hy')).toBe('Elbow Tip');
  });
  it('returns empty string for null', () => {
    expect(regionLabel(null, 'en')).toBe('');
  });
});

describe('motionLabel', () => {
  it('translates motions per language', () => {
    expect(motionLabel('flexion', 'en')).toBe('Flexion');
    expect(motionLabel('flexion', 'hy')).toBe('Ճկում');
    expect(motionLabel('abduction', 'hy')).toBe('Հեռացում');
  });
});

describe('muscleLabel', () => {
  it('translates muscle codes', () => {
    expect(muscleLabel('DELTOID', 'en')).toBe('Deltoid');
    expect(muscleLabel('QUADRICEPS', 'hy')).toBe('Քառագլխանի ազդրամկան');
  });
});

describe('measureKindLabel', () => {
  it('handles ROM composite motion_kind keys', () => {
    expect(measureKindLabel('flexion_active', 'en')).toBe('Flexion (active)');
    expect(measureKindLabel('abduction_passive', 'hy')).toBe('Հեռացում (պասիվ)');
  });
  it('handles MMT muscle codes', () => {
    expect(measureKindLabel('DELTOID', 'en')).toBe('Deltoid');
  });
  it('handles a bare motion code (no active/passive suffix)', () => {
    expect(measureKindLabel('abduction', 'hy')).toBe('Հեռացում');
  });
  it('returns empty for null (e.g. VAS)', () => {
    expect(measureKindLabel(null, 'en')).toBe('');
  });
  it('prettifies unknown keys', () => {
    expect(measureKindLabel('custom_metric_active', 'en')).toBe('Custom Metric (active)');
  });
});
