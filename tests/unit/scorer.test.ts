import { describe, it, expect } from 'vitest';
import {
  euclideanDistance,
  computePatchDistances,
  computeImageScore,
  computeGlobalEmbeddingDistance,
} from '../../src/lib/scorer';

describe('Scorer Unit Tests', () => {
  it('computes exact Euclidean distance between two vectors', () => {
    const d = euclideanDistance([0, 0, 0], [3, 4, 0]);
    expect(d).toBeCloseTo(5.0);
  });

  it('computes nearest neighbor patch distance to memory bank', () => {
    const testPatches = [
      [1, 1],
      [5, 5],
    ];
    const bankPatches = [
      [1, 1],
      [2, 2],
    ];
    const dists = computePatchDistances(testPatches, bankPatches);
    expect(dists[0]).toBeCloseTo(0);
    expect(dists[1]).toBeGreaterThan(3.0);
  });

  it('computes top-K mean image score accurately', () => {
    const patchDists = [0.1, 0.9, 0.4, 0.8, 0.7]; // Top 3 are 0.9, 0.8, 0.7 -> mean = 0.8
    const score = computeImageScore(patchDists, 3);
    expect(score).toBeCloseTo(0.8);
  });

  it('handles empty patch array in computeImageScore without throwing', () => {
    const score = computeImageScore([]);
    expect(score).toBe(0);
  });

  it('computes global embedding distance to reference centroids', () => {
    const testEmb = [2, 2, 2];
    const refEmbs = [
      [10, 10, 10],
      [2, 2, 1],
    ];
    const minDist = computeGlobalEmbeddingDistance(testEmb, refEmbs);
    expect(minDist).toBeCloseTo(1.0);
  });
});
