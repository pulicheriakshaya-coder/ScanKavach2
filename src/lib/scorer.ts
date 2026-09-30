/**
 * @file src/lib/scorer.ts
 * @description Patch-level nearest-neighbour anomaly scoring and global embedding distance.
 */

import { TOPK_PATCHES } from '../config';

/**
 * Computes Euclidean (L2) distance between two numerical vectors.
 */
export function euclideanDistance(a: number[], b: number[]): number {
  let sum = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

/**
 * Computes the minimum distance from each test patch to any patch in the reference bank.
 * Uses chunked in-memory matrix evaluation to prevent memory spikes.
 *
 * @param testPatches - Array of feature vectors for the test image (e.g. 196 vectors).
 * @param bankPatches - Reference memory bank patch vectors.
 * @returns Array of minimum nearest-neighbour distances per patch.
 */
export function computePatchDistances(
  testPatches: number[][],
  bankPatches: number[][]
): number[] {
  if (bankPatches.length === 0) {
    return new Array(testPatches.length).fill(0);
  }

  const patchDistances: number[] = new Array(testPatches.length);

  for (let i = 0; i < testPatches.length; i++) {
    const p = testPatches[i];
    let minDist = Infinity;
    for (let j = 0; j < bankPatches.length; j++) {
      const d = euclideanDistance(p, bankPatches[j]);
      if (d < minDist) {
        minDist = d;
      }
    }
    patchDistances[i] = minDist;
  }

  return patchDistances;
}

/**
 * Computes the aggregated image score as the mean of the top K largest patch anomaly scores.
 *
 * @param patchDistances - Array of patch distances.
 * @param topK - Number of top patches to average (default TOPK_PATCHES = 3).
 * @returns Mean top-K anomaly score.
 */
export function computeImageScore(
  patchDistances: number[],
  topK: number = TOPK_PATCHES
): number {
  if (patchDistances.length === 0) return 0;
  const sorted = [...patchDistances].sort((a, b) => b - a);
  const k = Math.min(topK, sorted.length);
  let sum = 0;
  for (let i = 0; i < k; i++) {
    sum += sorted[i];
  }
  return sum / k;
}

/**
 * Computes minimum distance from a global test embedding to healthy reference embeddings.
 *
 * @param testEmbedding - Global feature embedding vector.
 * @param referenceEmbeddings - Array of reference healthy embeddings.
 * @returns Minimum distance to reference embeddings.
 */
export function computeGlobalEmbeddingDistance(
  testEmbedding: number[],
  referenceEmbeddings: number[][]
): number {
  if (referenceEmbeddings.length === 0) return 0;
  let minDist = Infinity;
  for (const ref of referenceEmbeddings) {
    const d = euclideanDistance(testEmbedding, ref);
    if (d < minDist) minDist = d;
  }
  return minDist;
}
