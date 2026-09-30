import { describe, it, expect } from 'vitest';
import {
  splitBankAndValidation,
  subsampleBankPatches,
  calculatePercentileValue,
  calibrateValidationSet,
  buildReferenceBank,
  BankInputItem,
} from '../../src/lib/memoryBank';
import { MIN_NORMALS } from '../../src/config';

describe('Memory Bank Builder & Calibration Unit Tests', () => {
  const makeMockItems = (count: number): BankInputItem[] => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      patches: Array.from({ length: 196 }, () => [0.1 * i, 0.2]),
      globalEmbedding: [0.1 * i, 0.2],
      contrastStd: 0.15 + (i % 5) * 0.02,
      blurVariance: 25 + (i % 5) * 2,
      thumbnailUrl: 'data:thumb',
    }));
  };

  it('enforces MIN_NORMALS threshold on bank split', () => {
    expect(() => splitBankAndValidation(makeMockItems(MIN_NORMALS - 1))).toThrow();
  });

  it('splits items into non-overlapping bank and validation sets with 70/30 split', () => {
    const items = makeMockItems(20);
    const { bankItems, valItems } = splitBankAndValidation(items, 0.7);
    expect(bankItems.length).toBe(14);
    expect(valItems.length).toBe(6);

    const bankIds = new Set(bankItems.map((i) => i.id));
    for (const v of valItems) {
      expect(bankIds.has(v.id)).toBe(false);
    }
  });

  it('subsamples patches to stay within budget', () => {
    const items = makeMockItems(20);
    const { patches } = subsampleBankPatches(items, 500);
    expect(patches.length).toBe(500);
  });

  it('computes mathematical percentile values accurately', () => {
    const arr = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
    expect(calculatePercentileValue(arr, 50)).toBe(55);
    expect(calculatePercentileValue(arr, 95)).toBeCloseTo(95.5);
  });

  it('calibrates thresholds from held-out validation set', () => {
    const bankItems = makeMockItems(14);
    const valItems = makeMockItems(6);
    const { patches } = subsampleBankPatches(bankItems, 200);
    const bankEmbs = bankItems.map((b) => b.globalEmbedding);

    const calibration = calibrateValidationSet(patches, bankEmbs, valItems);
    expect(calibration.reviewThreshold).toBeGreaterThanOrEqual(0);
    expect(calibration.referThreshold).toBeGreaterThanOrEqual(calibration.reviewThreshold);
    expect(calibration.blurLimit).toBeGreaterThanOrEqual(1);
    expect(calibration.oodLimit).toBeGreaterThan(0);
  });

  it('builds a complete ReferenceBank data structure', () => {
    const items = makeMockItems(20);
    const bank = buildReferenceBank(items, 'Chest X-Ray Test Bank');
    expect(bank.totalNormals).toBe(20);
    expect(bank.patches.length).toBeGreaterThan(0);
    expect(bank.reviewThreshold).toBeGreaterThan(0);
    expect(bank.thumbnails.length).toBeGreaterThan(0);
  });
});
