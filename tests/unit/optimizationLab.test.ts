import { describe, it, expect } from 'vitest';
import {
  greedyKCenterCoreset,
  estimateBankMemoryMb,
} from '../../src/lib/optimizationLab';

describe('Optimization Lab Unit Tests', () => {
  it('extracts target number of coreset patches', () => {
    const allPatches = Array.from({ length: 50 }, (_, i) => [i, i * 2]);
    const selected = greedyKCenterCoreset(allPatches, 10, 1000);
    expect(selected.length).toBe(10);
  });

  it('falls back gracefully if timeout is reached', () => {
    const allPatches = Array.from({ length: 100 }, (_, i) => [i, i * 2]);
    // Force 0ms timeout to trigger fallback
    const selected = greedyKCenterCoreset(allPatches, 20, 0);
    expect(selected.length).toBe(20);
  });

  it('estimates memory footprint in megabytes accurately', () => {
    // 1000 patches * 128 float32 (4 bytes) = 512,000 bytes ~ 0.49 MB
    const mb = estimateBankMemoryMb(1000, 128);
    expect(mb).toBeCloseTo(0.49, 1);
  });
});
