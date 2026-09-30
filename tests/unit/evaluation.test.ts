import { describe, it, expect } from 'vitest';
import {
  computeRankAuroc,
  computeOperatingPoint,
  generateRocCurve,
  computeExpectedCalibrationError,
} from '../../src/lib/evaluation';

describe('Evaluation & AUROC Unit Tests', () => {
  it('computes 1.0 AUROC for perfectly separated distributions', () => {
    const positives = [0.8, 0.85, 0.9, 0.95];
    const negatives = [0.1, 0.15, 0.2, 0.25];
    const auroc = computeRankAuroc(positives, negatives);
    expect(auroc).toBe(1.0);
  });

  it('computes 0.5 AUROC for identical distributions', () => {
    const positives = [0.5, 0.6];
    const negatives = [0.5, 0.6];
    const auroc = computeRankAuroc(positives, negatives);
    expect(auroc).toBe(0.5);
  });

  it('computes sensitivity, specificity, and FPR at threshold', () => {
    const positives = [0.6, 0.7, 0.8, 0.9];
    const negatives = [0.1, 0.2, 0.3, 0.7];
    const metrics = computeOperatingPoint(positives, negatives, 0.5);

    expect(metrics.sensitivity).toBe(1.0); // all positives >= 0.5
    expect(metrics.specificity).toBe(0.75); // 3 of 4 negatives < 0.5
    expect(metrics.fpr).toBe(0.25);
  });

  it('generates monotonic ROC curve coordinates', () => {
    const positives = [0.7, 0.8, 0.9];
    const negatives = [0.1, 0.2, 0.3];
    const curve = generateRocCurve(positives, negatives, 10);
    expect(curve.length).toBeGreaterThan(0);
    for (let i = 1; i < curve.length; i++) {
      expect(curve[i].fpr).toBeGreaterThanOrEqual(curve[i - 1].fpr);
    }
  });

  it('computes Expected Calibration Error (ECE)', () => {
    const confidences = [0.9, 0.8, 0.7, 0.6];
    const correctness = [true, true, false, false];
    const res = computeExpectedCalibrationError(confidences, correctness, 5);
    expect(res.ece).toBeGreaterThanOrEqual(0);
    expect(res.ece).toBeLessThanOrEqual(1);
    expect(res.binData.length).toBeGreaterThan(0);
  });
});
