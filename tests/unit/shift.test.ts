import { describe, it, expect } from 'vitest';
import { detectScannerShift } from '../../src/lib/shift';

describe('Scanner-Shift Detector Unit Tests', () => {
  const stats = { contrastStd: 0.2, blurVariance: 30, colorDiff: 2, meanIntensity: 0.5 };
  const valStats = {
    meanContrast: 0.2,
    meanBlur: 30,
    sortedScores: [0.1, 0.2],
    patchThreshold: 0.5,
    blurLimit: 12,
    oodLimit: 8,
  };

  it('detects no shift when anomaly is localized in small fraction of patches', () => {
    const patchDists = new Array(196).fill(0.2);
    // 10 patches elevated
    for (let i = 0; i < 10; i++) patchDists[i] = 0.9;

    const res = detectScannerShift(patchDists, 0.5, stats, valStats);
    expect(res.isShift).toBe(false);
    expect(res.highPatchFraction).toBeLessThan(0.45);
  });

  it('flags scanner shift when high anomaly is widespread across > 45% of patches', () => {
    const patchDists = new Array(196).fill(0.9); // All patches elevated
    const res = detectScannerShift(patchDists, 0.5, stats, valStats);
    expect(res.isShift).toBe(true);
    expect(res.highPatchFraction).toBeGreaterThan(0.45);
    expect(res.message).toContain('different scanner or protocol');
  });

  it('flags scanner shift when image contrast is vastly divergent from validation normals', () => {
    const patchDists = new Array(196).fill(0.2);
    // Extremely degraded or saturated contrast
    const divergentStats = { ...stats, contrastStd: 0.06 }; // 0.06 / 0.2 = 0.3 < 0.4
    const res = detectScannerShift(patchDists, 0.5, divergentStats, valStats);
    expect(res.isShift).toBe(true);
  });

  it('handles empty patch array gracefully', () => {
    const res = detectScannerShift([], 0.5, stats);
    expect(res.isShift).toBe(false);
    expect(res.highPatchFraction).toBe(0);
  });
});
