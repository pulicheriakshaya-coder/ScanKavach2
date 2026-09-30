import { describe, it, expect } from 'vitest';
import { determineVerdict, computePercentile, isNearThreshold } from '../../src/lib/verdict';

describe('Verdict and Percentile Unit Tests', () => {
  const sortedValScores = [0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5, 0.55];
  const revThresh = 0.35;
  const refThresh = 0.55;

  it('classifies Normal when score is below review threshold', () => {
    const res = determineVerdict(0.2, revThresh, refThresh, sortedValScores);
    expect(res.verdict).toBe('Normal');
    expect(res.isBorderline).toBe(false);
  });

  it('classifies Review when score exceeds review threshold but below refer', () => {
    const res = determineVerdict(0.45, revThresh, refThresh, sortedValScores);
    expect(res.verdict).toBe('Review');
  });

  it('classifies Refer when score exceeds refer threshold', () => {
    const res = determineVerdict(0.7, revThresh, refThresh, sortedValScores);
    expect(res.verdict).toBe('Refer');
  });

  it('flags borderline when score is within 0.05 margin of threshold', () => {
    const res = determineVerdict(0.34, revThresh, refThresh, sortedValScores);
    expect(res.isBorderline).toBe(true);
    expect(res.message).toContain('Borderline: needs human review');
  });

  it('computes correct percentile from empirical validation set', () => {
    const pctLow = computePercentile(0.05, sortedValScores);
    expect(pctLow).toBeLessThanOrEqual(5);

    const pctHigh = computePercentile(0.6, sortedValScores);
    expect(pctHigh).toBeGreaterThanOrEqual(95);
  });

  it('handles empty validation scores gracefully', () => {
    const res = determineVerdict(0.4, 0.35, 0.65, []);
    expect(res.percentile).toBe(50);
  });

  it('correctly tests isNearThreshold boundary conditions', () => {
    expect(isNearThreshold(0.35, 0.35, 0.05)).toBe(true);
    expect(isNearThreshold(0.40, 0.35, 0.05)).toBe(true);
    expect(isNearThreshold(0.41, 0.35, 0.05)).toBe(false);
  });
});
