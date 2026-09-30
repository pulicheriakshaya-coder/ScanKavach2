import { describe, it, expect } from 'vitest';
import {
  euclideanDistance,
  computePatchDistances,
  computeImageScore,
  computeGlobalEmbeddingDistance,
} from '../../src/lib/scorer';
import { evaluateSafetyGate } from '../../src/lib/gate';
import { determineVerdict, computePercentile, isNearThreshold } from '../../src/lib/verdict';
import { getSectorName, generateExplanationSentence } from '../../src/lib/explain';
import { detectScannerShift } from '../../src/lib/shift';
import { fuse } from '../../src/lib/fusion';
import { calculatePercentileValue } from '../../src/lib/memoryBank';
import { estimateBankMemoryMb } from '../../src/lib/optimizationLab';
import { triage } from '../../src/data/healthContent';
import { logAuditEvent, getAuditLogs, exportAuditCsv } from '../../src/lib/auditLog';
import { computeDashboardStats } from '../../src/lib/history';
import { generateModelCardData } from '../../src/lib/modelCard';
import { translations } from '../../src/lib/i18n';

describe('Comprehensive Edge Cases & Boundary Value Tests', () => {
  // Scorer Edge Cases (1-10)
  it('scorer: handles single patch distance', () => {
    const dist = computePatchDistances([[1, 2]], [[1, 2]]);
    expect(dist).toEqual([0]);
  });

  it('scorer: handles zero-length bank patches safely', () => {
    const dist = computePatchDistances([[1, 2], [3, 4]], []);
    expect(dist).toEqual([0, 0]);
  });

  it('scorer: handles single element top-k average', () => {
    expect(computeImageScore([0.75], 1)).toBe(0.75);
    expect(computeImageScore([0.75], 5)).toBe(0.75);
  });

  it('scorer: handles identical patches with zero distance', () => {
    const p = [0.5, 0.5, 0.5];
    expect(euclideanDistance(p, p)).toBe(0);
  });

  it('scorer: handles different vector lengths gracefully', () => {
    const d = euclideanDistance([1, 2], [1, 2, 99]);
    expect(d).toBe(0);
  });

  it('scorer: handles empty vectors', () => {
    expect(euclideanDistance([], [])).toBe(0);
  });

  it('scorer: global embedding distance with empty references returns 0', () => {
    expect(computeGlobalEmbeddingDistance([1, 2], [])).toBe(0);
  });

  it('scorer: global embedding distance picks the closest centroid', () => {
    const d = computeGlobalEmbeddingDistance([0, 0], [[10, 10], [1, 1], [5, 5]]);
    expect(d).toBeCloseTo(Math.sqrt(2));
  });

  it('scorer: top-k image score with K=1 returns the maximum patch', () => {
    expect(computeImageScore([0.1, 0.9, 0.4], 1)).toBe(0.9);
  });

  it('scorer: top-k image score with K=all returns the mean', () => {
    expect(computeImageScore([0.2, 0.4, 0.6], 3)).toBeCloseTo(0.4);
  });

  // Explain: All 9 sectors of 3x3 grid (11-19)
  it('explain: maps row 0 col 0 to top left of the image', () => {
    expect(getSectorName(0)).toBe('top left of the image');
  });

  it('explain: maps row 0 col 6 to top center of the image', () => {
    expect(getSectorName(6)).toBe('top center of the image');
  });

  it('explain: maps row 0 col 13 to top right of the image', () => {
    expect(getSectorName(13)).toBe('top right of the image');
  });

  it('explain: maps row 7 col 0 to middle left of the image', () => {
    expect(getSectorName(7 * 14 + 0)).toBe('middle left of the image');
  });

  it('explain: maps row 7 col 7 to center of the image', () => {
    expect(getSectorName(7 * 14 + 7)).toBe('center of the image');
  });

  it('explain: maps row 7 col 13 to middle right of the image', () => {
    expect(getSectorName(7 * 14 + 13)).toBe('middle right of the image');
  });

  it('explain: maps row 13 col 0 to lower left of the image', () => {
    expect(getSectorName(13 * 14 + 0)).toBe('lower left of the image');
  });

  it('explain: maps row 13 col 6 to lower center of the image', () => {
    expect(getSectorName(13 * 14 + 6)).toBe('lower center of the image');
  });

  it('explain: maps row 13 col 13 to lower right of the image', () => {
    expect(getSectorName(13 * 14 + 13)).toBe('lower right of the image');
  });

  // Gate Edge Cases (20-27)
  it('gate: passes when all metrics are exactly at acceptable thresholds', () => {
    const res = evaluateSafetyGate({ contrastStd: 0.05, blurVariance: 15.0, colorDiff: 12.0, meanIntensity: 0.5 }, 5.0, 15.0, 10.0);
    expect(res.passed).toBe(true);
  });

  it('gate: fails when colorDiff is 12.001', () => {
    const res = evaluateSafetyGate({ contrastStd: 0.1, blurVariance: 30, colorDiff: 12.001, meanIntensity: 0.5 });
    expect(res.passed).toBe(false);
  });

  it('gate: fails when contrastStd is 0.0499', () => {
    const res = evaluateSafetyGate({ contrastStd: 0.0499, blurVariance: 30, colorDiff: 2, meanIntensity: 0.5 });
    expect(res.passed).toBe(false);
  });

  it('gate: fails when blurVariance is 14.99 with blurLimit 15.0', () => {
    const res = evaluateSafetyGate({ contrastStd: 0.1, blurVariance: 14.99, colorDiff: 2, meanIntensity: 0.5 }, 0, 15.0);
    expect(res.passed).toBe(false);
  });

  it('gate: fails when embeddingDistance exceeds oodLimit', () => {
    const res = evaluateSafetyGate({ contrastStd: 0.1, blurVariance: 30, colorDiff: 2, meanIntensity: 0.5 }, 10.1, 15.0, 10.0);
    expect(res.passed).toBe(false);
  });

  it('gate: stops immediately on first failure without evaluating subsequent checks', () => {
    // Both colorDiff and contrast are bad; colorDiff is checked first
    const res = evaluateSafetyGate({ contrastStd: 0.01, blurVariance: 5, colorDiff: 50, meanIntensity: 0.5 });
    expect(res.reason).toContain('colour photo');
  });

  it('gate: handles negative or zero blur variance gracefully', () => {
    const res = evaluateSafetyGate({ contrastStd: 0.1, blurVariance: 0, colorDiff: 2, meanIntensity: 0.5 });
    expect(res.passed).toBe(false);
  });

  it('gate: handles extreme contrast safely', () => {
    const res = evaluateSafetyGate({ contrastStd: 0.9, blurVariance: 50, colorDiff: 0.1, meanIntensity: 0.5 });
    expect(res.passed).toBe(true);
  });

  // Verdict & Percentile Edge Cases (28-36)
  it('verdict: score exactly on review threshold is classified as Review', () => {
    const res = determineVerdict(0.35, 0.35, 0.65, [0.1, 0.2, 0.3, 0.35]);
    expect(res.verdict).toBe('Review');
    expect(res.isBorderline).toBe(true);
  });

  it('verdict: score exactly on refer threshold is classified as Refer', () => {
    const res = determineVerdict(0.65, 0.35, 0.65, [0.1, 0.2, 0.35, 0.65]);
    expect(res.verdict).toBe('Refer');
    expect(res.isBorderline).toBe(true);
  });

  it('verdict: score far below review threshold is not borderline', () => {
    const res = determineVerdict(0.1, 0.35, 0.65, [0.1, 0.2]);
    expect(res.isBorderline).toBe(false);
    expect(res.verdict).toBe('Normal');
  });

  it('verdict: score far above refer threshold is not borderline', () => {
    const res = determineVerdict(0.99, 0.35, 0.65, [0.1, 0.2]);
    expect(res.isBorderline).toBe(false);
    expect(res.verdict).toBe('Refer');
  });

  it('verdict: percentile handles score lower than minimum validation score', () => {
    const pct = computePercentile(0.01, [0.1, 0.2, 0.3]);
    expect(pct).toBe(0.1); // lower bound clamp
  });

  it('verdict: percentile handles score higher than maximum validation score', () => {
    const pct = computePercentile(0.99, [0.1, 0.2, 0.3]);
    expect(pct).toBe(99.9); // upper bound clamp
  });

  it('verdict: isNearThreshold returns true within delta', () => {
    expect(isNearThreshold(0.35, 0.35)).toBe(true);
    expect(isNearThreshold(0.39, 0.35, 0.05)).toBe(true);
    expect(isNearThreshold(0.31, 0.35, 0.05)).toBe(true);
  });

  it('verdict: isNearThreshold returns false outside delta', () => {
    expect(isNearThreshold(0.42, 0.35, 0.05)).toBe(false);
    expect(isNearThreshold(0.28, 0.35, 0.05)).toBe(false);
  });

  it('verdict: explanation contains mandatory percentage formatting', () => {
    const res = determineVerdict(0.2, 0.35, 0.65, [0.1, 0.2, 0.3]);
    expect(res.explanation).toContain('More unusual than');
  });

  // Shift Edge Cases (37-43)
  it('shift: fraction exactly 0.45 is not shift', () => {
    const patchDists = new Array(100).fill(0.1);
    for (let i = 0; i < 45; i++) patchDists[i] = 0.9;
    const res = detectScannerShift(patchDists, 0.5, { contrastStd: 0.2, blurVariance: 30, colorDiff: 1, meanIntensity: 0.5 });
    expect(res.isShift).toBe(false);
  });

  it('shift: fraction 0.46 triggers scanner shift', () => {
    const patchDists = new Array(100).fill(0.1);
    for (let i = 0; i < 46; i++) patchDists[i] = 0.9;
    const res = detectScannerShift(patchDists, 0.5, { contrastStd: 0.2, blurVariance: 30, colorDiff: 1, meanIntensity: 0.5 });
    expect(res.isShift).toBe(true);
    expect(res.highPatchFraction).toBe(0.46);
  });

  it('shift: contrast ratio below 0.4 triggers shift', () => {
    const res = detectScannerShift([0.1], 0.5, { contrastStd: 0.07, blurVariance: 30, colorDiff: 1, meanIntensity: 0.5 }, {
      meanContrast: 0.2, meanBlur: 30, sortedScores: [], patchThreshold: 0.5, blurLimit: 12, oodLimit: 8
    });
    expect(res.isShift).toBe(true);
  });

  it('shift: contrast ratio above 2.5 triggers shift', () => {
    const res = detectScannerShift([0.1], 0.5, { contrastStd: 0.6, blurVariance: 30, colorDiff: 1, meanIntensity: 0.5 }, {
      meanContrast: 0.2, meanBlur: 30, sortedScores: [], patchThreshold: 0.5, blurLimit: 12, oodLimit: 8
    });
    expect(res.isShift).toBe(true);
  });

  it('shift: empty validation stats does not crash', () => {
    const res = detectScannerShift([0.1, 0.2], 0.5, { contrastStd: 0.2, blurVariance: 30, colorDiff: 1, meanIntensity: 0.5 });
    expect(res.isShift).toBe(false);
  });

  it('shift: zero mean contrast in validation stats handled safely', () => {
    const res = detectScannerShift([0.1], 0.5, { contrastStd: 0.2, blurVariance: 30, colorDiff: 1, meanIntensity: 0.5 }, {
      meanContrast: 0, meanBlur: 30, sortedScores: [], patchThreshold: 0.5, blurLimit: 12, oodLimit: 8
    });
    expect(res.isShift).toBe(false);
  });

  it('shift: message contains specific clinical hardware caution', () => {
    const patchDists = new Array(100).fill(0.9);
    const res = detectScannerShift(patchDists, 0.5, { contrastStd: 0.2, blurVariance: 30, colorDiff: 1, meanIntensity: 0.5 });
    expect(res.message).toBe('This scan may come from a different scanner or protocol. The score may reflect the device, not disease.');
  });

  // Triage System Comprehensive Combinations (44-53)
  it('triage: all 6 symptoms true triggers urgent care', () => {
    const res = triage({
      hasSevereBreathlessness: true, hasChestPainInhaling: true, hasCoughOverTwoWeeks: true,
      hasBloodInSputum: true, hasFeverChills: true, hasWeightLossNightSweats: true
    });
    expect(res.urgency).toBe('Seek urgent care now');
    expect(res.reasons.length).toBe(3); // 3 red flags
  });

  it('triage: only chest pain inhaling triggers urgent care', () => {
    const res = triage({
      hasSevereBreathlessness: false, hasChestPainInhaling: true, hasCoughOverTwoWeeks: false,
      hasBloodInSputum: false, hasFeverChills: false, hasWeightLossNightSweats: false
    });
    expect(res.urgency).toBe('Seek urgent care now');
  });

  it('triage: only fever and chills triggers see a doctor soon', () => {
    const res = triage({
      hasSevereBreathlessness: false, hasChestPainInhaling: false, hasCoughOverTwoWeeks: false,
      hasBloodInSputum: false, hasFeverChills: true, hasWeightLossNightSweats: false
    });
    expect(res.urgency).toBe('See a doctor soon');
  });

  it('triage: only night sweats and weight loss triggers see a doctor soon', () => {
    const res = triage({
      hasSevereBreathlessness: false, hasChestPainInhaling: false, hasCoughOverTwoWeeks: false,
      hasBloodInSputum: false, hasFeverChills: false, hasWeightLossNightSweats: true
    });
    expect(res.urgency).toBe('See a doctor soon');
  });

  it('triage: returns routine when all inputs false', () => {
    const res = triage({
      hasSevereBreathlessness: false, hasChestPainInhaling: false, hasCoughOverTwoWeeks: false,
      hasBloodInSputum: false, hasFeverChills: false, hasWeightLossNightSweats: false
    });
    expect(res.urgency).toBe('Routine - maintain healthy habits');
  });

  // Optimization Lab Math & Memory (54-58)
  it('optLab: computes memory for 1000 patches at 128 dim', () => {
    const mb = estimateBankMemoryMb(1000, 128);
    expect(mb).toBe(0.49);
  });

  it('optLab: computes memory for 8000 patches at 128 dim', () => {
    const mb = estimateBankMemoryMb(8000, 128);
    expect(mb).toBe(3.91);
  });

  it('optLab: computes memory for 256 dim features', () => {
    const mb = estimateBankMemoryMb(1000, 256);
    expect(mb).toBe(0.98);
  });

  it('optLab: memory calculation handles 0 patches', () => {
    expect(estimateBankMemoryMb(0)).toBe(0);
  });

  // Model Card & Governance (59-63)
  it('modelCard: generates complete governance data structure without bank', () => {
    const data = generateModelCardData(null, null);
    expect(data.intendedUse).toContain('Decision support');
    expect(data.notIntendedUse).toContain('Autonomous diagnosis');
    expect(data.sustainableDevelopmentGoals.length).toBe(3);
    expect(data.priorWorkNote).toContain('PatchCore');
  });

  it('modelCard: includes reference bank parameters when provided', () => {
    const mockBank = {
      id: 'b1', name: 'Test', createdAt: '2026-01-01', patches: [[1, 2]], patchImageIds: [0],
      globalEmbeddings: [[1, 2]], thumbnails: [], totalNormals: 50, reviewThreshold: 0.38,
      referThreshold: 0.68, patchThreshold: 0.45, blurLimit: 14.5, oodLimit: 9.2,
      validationStats: { meanContrast: 0.2, meanBlur: 30, sortedScores: [], patchThreshold: 0.45, blurLimit: 14.5, oodLimit: 9.2 }
    };
    const data = generateModelCardData(mockBank, null);
    expect(data.referenceBankInfo.totalNormals).toBe(50);
    expect(data.referenceBankInfo.reviewThreshold).toBe(0.38);
    expect(data.referenceBankInfo.blurLimit).toBe(14.5);
  });

  // Audit Log & CSV serialization (64-67)
  it('audit: logs and exports audit entries', async () => {
    await logAuditEvent('doc@kavach.org', 'TEST_ACTION', 'Ran automated unit verification');
    const logs = await getAuditLogs();
    expect(logs.length).toBeGreaterThan(0);
    const csv = exportAuditCsv(logs);
    expect(csv).toContain('TEST_ACTION');
    expect(csv).toContain('doc@kavach.org');
  });

  it('audit: handles quotes inside audit details gracefully', () => {
    const csv = exportAuditCsv([
      { id: '1', timestamp: 1000, userEmail: 'u@test.org', action: 'ACT', details: 'Detail with "quotes"' }
    ]);
    expect(csv).toContain('""quotes""');
  });

  // Percentile calculation helper (68-70)
  it('memoryBank: calculatePercentileValue handles empty array', () => {
    expect(calculatePercentileValue([], 50)).toBe(0);
  });

  it('memoryBank: calculatePercentileValue interpolates accurately', () => {
    const val = calculatePercentileValue([10, 20], 50);
    expect(val).toBe(15);
  });

  it('memoryBank: calculatePercentileValue handles 0th and 100th percentile', () => {
    expect(calculatePercentileValue([10, 20, 30], 0)).toBe(10);
    expect(calculatePercentileValue([10, 20, 30], 100)).toBe(30);
  });
});
