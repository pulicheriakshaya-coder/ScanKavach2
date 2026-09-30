import { describe, it, expect } from 'vitest';
import { makeSyntheticBank } from '../fixtures';
import { evaluateSafetyGate } from '../../src/lib/gate';
import { computePatchDistances, computeImageScore } from '../../src/lib/scorer';
import { determineVerdict } from '../../src/lib/verdict';
import { generateExplanationSentence } from '../../src/lib/explain';
import { detectScannerShift } from '../../src/lib/shift';
import { fuse } from '../../src/lib/fusion';

describe('Integration Test: End-to-End Screening Pipeline', () => {
  it('executes full pipeline on synthetic reference bank with complete safety audit', () => {
    // 1. Load Reference Bank
    const bank = makeSyntheticBank();
    expect(bank.patches.length).toBeGreaterThan(0);
    expect(bank.reviewThreshold).toBeGreaterThan(0);

    // 2. Mock incoming scan
    const incomingStats = { contrastStd: 0.2, blurVariance: 35.0, colorDiff: 1.5, meanIntensity: 0.48 };
    const incomingPatches = Array.from({ length: 196 }, () => new Array(128).fill(0.3));

    // 3. Safety Gate
    const gate = evaluateSafetyGate(incomingStats, 2.0, bank.blurLimit, bank.oodLimit);
    expect(gate.passed).toBe(true);

    // 4. Scoring against bank patches
    const patchDists = computePatchDistances(incomingPatches, bank.patches);
    const score = computeImageScore(patchDists);
    expect(score).toBeGreaterThan(0);

    // 5. Verdict & Calibration
    const verdict = determineVerdict(score, bank.reviewThreshold, bank.referThreshold, bank.validationStats.sortedScores);
    expect(['Normal', 'Review', 'Refer']).toContain(verdict.verdict);

    // 6. Spatial Explanation
    const sentence = generateExplanationSentence(patchDists, bank.patchThreshold, verdict.verdict === 'Normal');
    expect(sentence.length).toBeGreaterThan(10);
    expect(sentence).not.toContain('diagnosed with');

    // 7. Scanner Shift
    const shift = detectScannerShift(patchDists, bank.patchThreshold, incomingStats, bank.validationStats);
    expect(typeof shift.isShift).toBe('boolean');

    // 8. Supervised Fusion
    const fused = fuse(verdict.verdict, verdict.isBorderline, { Normal: 0.1, Pneumonia: 0.85 });
    expect(fused.disclaimer).toContain('research prototype');
    expect(fused.disclaimer).toContain('not a confirmed diagnosis');
  });
});
