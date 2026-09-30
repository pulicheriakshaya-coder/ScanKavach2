import { describe, it, expect } from 'vitest';
import { evaluateSafetyGate } from '../../src/lib/gate';
import { COLOR_DIFF_LIMIT, MIN_CONTRAST_STD } from '../../src/config';

describe('Safety Gate Unit Tests', () => {
  it('passes on high quality grayscale medical scans within distribution', () => {
    const stats = { contrastStd: 0.15, blurVariance: 35.0, colorDiff: 2.0, meanIntensity: 0.45 };
    const res = evaluateSafetyGate(stats, 2.5, 12.0, 10.0);
    expect(res.passed).toBe(true);
    expect(res.reason).toBeUndefined();
  });

  it('rejects colour photos when color difference exceeds limit', () => {
    const stats = { contrastStd: 0.15, blurVariance: 35.0, colorDiff: COLOR_DIFF_LIMIT + 5, meanIntensity: 0.45 };
    const res = evaluateSafetyGate(stats, 2.5, 12.0, 10.0);
    expect(res.passed).toBe(false);
    expect(res.reason).toContain('colour photo');
  });

  it('rejects blank or low contrast scans', () => {
    const stats = { contrastStd: MIN_CONTRAST_STD - 0.02, blurVariance: 35.0, colorDiff: 2.0, meanIntensity: 0.5 };
    const res = evaluateSafetyGate(stats, 2.5, 12.0, 10.0);
    expect(res.passed).toBe(false);
    expect(res.reason).toContain('too little contrast');
  });

  it('rejects blurry scans below blur threshold', () => {
    const stats = { contrastStd: 0.15, blurVariance: 5.0, colorDiff: 2.0, meanIntensity: 0.45 };
    const res = evaluateSafetyGate(stats, 2.5, 12.0, 10.0);
    expect(res.passed).toBe(false);
    expect(res.reason).toContain('too blurry');
  });

  it('rejects out of distribution scans exceeding oodLimit', () => {
    const stats = { contrastStd: 0.15, blurVariance: 35.0, colorDiff: 2.0, meanIntensity: 0.45 };
    const res = evaluateSafetyGate(stats, 15.0, 12.0, 10.0);
    expect(res.passed).toBe(false);
    expect(res.reason).toContain('does not look like the type of scan');
  });

  it('handles edge case: boundary values exactly on limits', () => {
    const stats = { contrastStd: MIN_CONTRAST_STD, blurVariance: 12.0, colorDiff: COLOR_DIFF_LIMIT, meanIntensity: 0.5 };
    const res = evaluateSafetyGate(stats, 10.0, 12.0, 10.0);
    expect(res.passed).toBe(true);
  });
});
