/**
 * @file src/lib/gate.ts
 * @description Safety gate validation to prevent non-medical, blurry, or out-of-distribution scans.
 */

import {
  COLOR_DIFF_LIMIT,
  DEFAULT_BLUR_LIMIT,
  MIN_CONTRAST_STD,
} from '../config';
import { GateCheckResult } from '../types';
import { ImageDataStats } from './imageProcessor';

/**
 * Validates scan quality and domain suitability through sequential safety checks.
 * Stops at the first failure.
 *
 * @param stats - Measured image statistics (contrast, blur, color difference).
 * @param embeddingDistance - L2 distance of global embedding to reference distribution.
 * @param blurLimit - Custom blur limit from calibrated bank or default.
 * @param oodLimit - Maximum acceptable distance for in-distribution scans.
 * @returns GateCheckResult indicating pass/fail status and specific feedback.
 */
export function evaluateSafetyGate(
  stats: ImageDataStats,
  embeddingDistance: number = 0,
  blurLimit: number = DEFAULT_BLUR_LIMIT,
  oodLimit: number = 999
): GateCheckResult {
  const result: GateCheckResult = {
    passed: true,
    colorDiff: stats.colorDiff,
    contrastStd: stats.contrastStd,
    blurVariance: stats.blurVariance,
    embeddingDistance,
  };

  // 1. Color photo check
  if (stats.colorDiff > COLOR_DIFF_LIMIT) {
    result.passed = false;
    result.reason = 'This is a colour photo. Expected a grayscale medical scan.';
    return result;
  }

  // 2. Low contrast check
  if (stats.contrastStd < MIN_CONTRAST_STD) {
    result.passed = false;
    result.reason = 'The image has too little contrast to assess.';
    return result;
  }

  // 3. Blur check
  if (stats.blurVariance < blurLimit) {
    result.passed = false;
    result.reason = 'The image is too blurry to assess reliably.';
    return result;
  }

  // 4. Out-of-distribution (wrong modality/body part) check
  if (embeddingDistance > oodLimit) {
    result.passed = false;
    result.reason =
      'This does not look like the type of scan the reference set was built from (for example, not a chest X-ray).';
    return result;
  }

  return result;
}
