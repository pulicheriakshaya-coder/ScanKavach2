/**
 * @file src/lib/verdict.ts
 * @description Calibrated anomaly verdict mapping, borderline detection, and percentile ranking.
 */

import { BORDERLINE_MARGIN } from '../config';
import { AnomalyVerdict, VerdictResult } from '../types';

/**
 * Determines the percentile rank of a score relative to sorted validation scores.
 *
 * @param score - Test image score.
 * @param sortedValScores - Ascending array of healthy validation scores.
 * @returns Percentile between 0 and 100.
 */
export function computePercentile(score: number, sortedValScores: number[]): number {
  if (sortedValScores.length === 0) return 50;
  let count = 0;
  for (const s of sortedValScores) {
    if (s <= score) count++;
  }
  const pct = (count / sortedValScores.length) * 100;
  return Math.min(99.9, Math.max(0.1, Number(pct.toFixed(1))));
}

/**
 * Determines whether a score falls within the borderline margin of a threshold.
 *
 * @param score - Test image score.
 * @param threshold - Target threshold value.
 * @param margin - Borderline margin (default 0.05).
 */
export function isNearThreshold(
  score: number,
  threshold: number,
  margin: number = BORDERLINE_MARGIN
): boolean {
  return Math.abs(score - threshold) <= margin + 1e-7;
}

/**
 * Maps an anomaly score to a clinical screening verdict with percentile and borderline badge.
 *
 * @param score - Calculated image anomaly score.
 * @param reviewThreshold - 95th percentile threshold.
 * @param referThreshold - 99th percentile threshold.
 * @param sortedValScores - Sorted validation scores for percentile calculation.
 * @returns VerdictResult structure.
 */
export function determineVerdict(
  score: number,
  reviewThreshold: number,
  referThreshold: number,
  sortedValScores: number[]
): VerdictResult {
  const percentile = computePercentile(score, sortedValScores);
  const isBorderline =
    isNearThreshold(score, reviewThreshold) ||
    isNearThreshold(score, referThreshold);

  let verdict: AnomalyVerdict = 'Normal';
  if (score >= referThreshold) {
    verdict = 'Refer';
  } else if (score >= reviewThreshold) {
    verdict = 'Review';
  }

  const explanation =
    `More unusual than ${percentile}% of healthy validation scans. ` +
    (verdict === 'Normal'
      ? 'Patterns align with the healthy reference range.'
      : 'Unusual feature density detected relative to healthy baselines.');

  const message = isBorderline
    ? 'Borderline: needs human review'
    : verdict === 'Review'
    ? 'Review recommended: score exceeds the 95th percentile calibration limit.'
    : verdict === 'Refer'
    ? 'Referral flagged: score exceeds the 99th percentile calibration limit.'
    : 'Patterns within expected healthy variation.';

  return {
    verdict,
    isBorderline,
    percentile,
    explanation,
    message,
  };
}
