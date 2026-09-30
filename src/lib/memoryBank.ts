/**
 * @file src/lib/memoryBank.ts
 * @description Reference memory bank generation, calibration, split logic, and persistence.
 */

import {
  BANK_FRACTION,
  MAX_BANK_PATCHES,
  MAX_THUMBNAILS,
  MIN_NORMALS,
  OOD_MARGIN,
  REFER_PERCENTILE,
  REVIEW_PERCENTILE,
} from '../config';
import { ReferenceBank, ValidationStats } from '../types';
import { computeImageScore, computePatchDistances, computeGlobalEmbeddingDistance } from './scorer';
import { getStorageItem, setStorageItem } from './storage';

const BANK_STORAGE_KEY = 'bank';

/**
 * Calculates a specific percentile value from a numeric array.
 */
export function calculatePercentileValue(arr: number[], percentile: number): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const index = (percentile / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

export interface BankInputItem {
  id: number;
  patches: number[][]; // 196 vectors
  globalEmbedding: number[];
  contrastStd: number;
  blurVariance: number;
  thumbnailUrl: string;
}

/**
 * Splits healthy input scans into non-overlapping training bank and calibration validation sets.
 */
export function splitBankAndValidation(
  items: BankInputItem[],
  bankFraction: number = BANK_FRACTION
): { bankItems: BankInputItem[]; valItems: BankInputItem[] } {
  if (items.length < MIN_NORMALS) {
    throw new Error(`Minimum ${MIN_NORMALS} scans required to build reference bank.`);
  }

  // Seeded/deterministic or random shuffle
  const shuffled = [...items].sort(() => Math.random() - 0.5);
  const bankCount = Math.max(1, Math.floor(shuffled.length * bankFraction));

  return {
    bankItems: shuffled.slice(0, bankCount),
    valItems: shuffled.slice(bankCount),
  };
}

/**
 * Subsamples patch vectors uniformly or randomly to stay within MAX_BANK_PATCHES.
 */
export function subsampleBankPatches(
  bankItems: BankInputItem[],
  maxPatches: number = MAX_BANK_PATCHES
): { patches: number[][]; patchImageIds: number[] } {
  const allPatches: number[][] = [];
  const allImageIds: number[] = [];

  for (const item of bankItems) {
    for (const patch of item.patches) {
      allPatches.push(patch);
      allImageIds.push(item.id);
    }
  }

  if (allPatches.length <= maxPatches) {
    return { patches: allPatches, patchImageIds: allImageIds };
  }

  // Uniform stride subsample
  const step = allPatches.length / maxPatches;
  const selectedPatches: number[][] = [];
  const selectedImageIds: number[] = [];

  for (let i = 0; i < maxPatches; i++) {
    const idx = Math.floor(i * step);
    selectedPatches.push(allPatches[idx]);
    selectedImageIds.push(allImageIds[idx]);
  }

  return { patches: selectedPatches, patchImageIds: selectedImageIds };
}

/**
 * Calibrates thresholds and out-of-distribution limits against the held-out validation set.
 */
export function calibrateValidationSet(
  bankPatches: number[][],
  bankEmbeddings: number[][],
  valItems: BankInputItem[]
): {
  reviewThreshold: number;
  referThreshold: number;
  patchThreshold: number;
  blurLimit: number;
  oodLimit: number;
  validationStats: ValidationStats;
} {
  const valScores: number[] = [];
  const allValPatchDistances: number[] = [];
  const valBlurVariances: number[] = [];
  let totalContrast = 0;
  let totalBlur = 0;
  let maxEmbeddingDist = 0;

  for (const item of valItems) {
    const patchDists = computePatchDistances(item.patches, bankPatches);
    const score = computeImageScore(patchDists);
    valScores.push(score);

    for (const d of patchDists) allValPatchDistances.push(d);
    valBlurVariances.push(item.blurVariance);
    totalContrast += item.contrastStd;
    totalBlur += item.blurVariance;

    const embDist = computeGlobalEmbeddingDistance(item.globalEmbedding, bankEmbeddings);
    if (embDist > maxEmbeddingDist) maxEmbeddingDist = embDist;
  }

  const sortedScores = [...valScores].sort((a, b) => a - b);
  const reviewThreshold = calculatePercentileValue(sortedScores, REVIEW_PERCENTILE);
  const referThreshold = calculatePercentileValue(sortedScores, REFER_PERCENTILE);
  const patchThreshold = calculatePercentileValue(allValPatchDistances, 99);

  // Blur limit: half of 5th percentile of validation Laplacian variance, minimum 1
  const blur5th = calculatePercentileValue(valBlurVariances, 5);
  const blurLimit = Math.max(1, blur5th * 0.5);

  const oodLimit = maxEmbeddingDist > 0 ? maxEmbeddingDist * OOD_MARGIN : 10.0;

  const validationStats: ValidationStats = {
    meanContrast: totalContrast / (valItems.length || 1),
    meanBlur: totalBlur / (valItems.length || 1),
    sortedScores,
    patchThreshold,
    blurLimit,
    oodLimit,
  };

  return {
    reviewThreshold,
    referThreshold,
    patchThreshold,
    blurLimit,
    oodLimit,
    validationStats,
  };
}

/**
 * Builds and calibrates a ReferenceBank from healthy scan items.
 */
export function buildReferenceBank(items: BankInputItem[], name: string = 'Chest X-Ray Bank'): ReferenceBank {
  const { bankItems, valItems } = splitBankAndValidation(items);
  const { patches, patchImageIds } = subsampleBankPatches(bankItems);
  const bankEmbeddings = bankItems.map((i) => i.globalEmbedding);

  const calibration = calibrateValidationSet(patches, bankEmbeddings, valItems);
  const thumbnails = bankItems.slice(0, MAX_THUMBNAILS).map((i) => i.thumbnailUrl);

  return {
    id: `bank_${Date.now()}`,
    name,
    createdAt: new Date().toISOString(),
    patches,
    patchImageIds,
    globalEmbeddings: bankEmbeddings,
    thumbnails,
    totalNormals: items.length,
    ...calibration,
  };
}

/**
 * Saves reference bank to IndexedDB.
 */
export async function saveReferenceBank(bank: ReferenceBank): Promise<void> {
  await setStorageItem(BANK_STORAGE_KEY, bank);
}

/**
 * Loads the active reference bank from IndexedDB.
 */
export async function loadReferenceBank(): Promise<ReferenceBank | null> {
  return await getStorageItem<ReferenceBank>(BANK_STORAGE_KEY);
}
