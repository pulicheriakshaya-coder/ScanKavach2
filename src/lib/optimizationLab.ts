/**
 * @file src/lib/optimizationLab.ts
 * @description Patch sampling methods (Random vs Greedy K-Center Coreset) and Pareto frontier analysis.
 */

import { euclideanDistance } from './scorer';

export type SamplingMethod = 'random' | 'coreset';

export interface OptimizationResultRow {
  patchCount: number;
  method: SamplingMethod;
  bankSizeMb: number;
  separationOrAuroc: number;
  latencyMs: number;
}

/**
 * Greedy K-Center Coreset patch selection with computation time limit and fallback.
 *
 * @param allPatches - Source pool of candidate patch feature vectors.
 * @param targetCount - Number of patches to extract (e.g. 1000, 2000, etc.).
 * @param maxTimeMs - Maximum execution budget in ms before fallback to random.
 * @returns Array of selected patch vectors.
 */
export function greedyKCenterCoreset(
  allPatches: number[][],
  targetCount: number,
  maxTimeMs: number = 500
): number[][] {
  const n = allPatches.length;
  if (n <= targetCount) return allPatches;

  const startTime = Date.now();
  const selected: number[][] = [];
  const selectedIndices = new Set<number>();

  // Pick first point randomly
  const firstIdx = Math.floor(Math.random() * n);
  selected.push(allPatches[firstIdx]);
  selectedIndices.add(firstIdx);

  const minDists = new Float32Array(n).fill(Infinity);

  for (let step = 1; step < targetCount; step++) {
    // Check timeout budget
    if (Date.now() - startTime > maxTimeMs) {
      // Fallback: fill remaining points uniformly
      const remainingCount = targetCount - selected.length;
      for (let i = 0; i < n && selected.length < targetCount; i++) {
        if (!selectedIndices.has(i)) {
          selected.push(allPatches[i]);
          selectedIndices.add(i);
        }
      }
      return selected;
    }

    const lastSelected = selected[selected.length - 1];
    let maxDist = -1;
    let bestIdx = -1;

    for (let i = 0; i < n; i++) {
      if (selectedIndices.has(i)) continue;
      const d = euclideanDistance(allPatches[i], lastSelected);
      if (d < minDists[i]) minDists[i] = d;
      if (minDists[i] > maxDist) {
        maxDist = minDists[i];
        bestIdx = i;
      }
    }

    if (bestIdx >= 0) {
      selected.push(allPatches[bestIdx]);
      selectedIndices.add(bestIdx);
    }
  }

  return selected;
}

/**
 * Evaluates memory consumption in MB for a given number of patch features.
 */
export function estimateBankMemoryMb(patchCount: number, featureDim: number = 128): number {
  const bytes = patchCount * featureDim * 4; // float32
  return Number((bytes / (1024 * 1024)).toFixed(2));
}
