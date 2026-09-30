/**
 * @file src/lib/shift.ts
 * @description Scanner shift detector distinguishing genuine localized pathology from acquisition shift.
 */

import { ShiftResult, ValidationStats } from '../types';
import { ImageDataStats } from './imageProcessor';

/**
 * Evaluates whether an elevated anomaly score is likely due to whole-image scanner/protocol shift
 * rather than localized pathology.
 *
 * @param patchDistances - 196 patch distance scores.
 * @param patchThreshold - Median or calibrated patch threshold.
 * @param imageStats - Measured contrast and mean intensity.
 * @param valStats - Calibrated validation set baseline stats.
 * @returns ShiftResult with detection flag and safety wording.
 */
export function detectScannerShift(
  patchDistances: number[],
  patchThreshold: number,
  imageStats: ImageDataStats,
  valStats?: ValidationStats
): ShiftResult {
  if (patchDistances.length === 0) {
    return { isShift: false, highPatchFraction: 0 };
  }

  let highCount = 0;
  for (const dist of patchDistances) {
    if (dist > patchThreshold) {
      highCount++;
    }
  }

  const highPatchFraction = highCount / patchDistances.length;

  // A diffuse shift affects widespread areas (>45% of patches) across the entire image
  let isShift = highPatchFraction > 0.45;

  // If contrast drastically differs from validation normals, flag potential scanner shift
  if (valStats && valStats.meanContrast > 0) {
    const contrastRatio = imageStats.contrastStd / valStats.meanContrast;
    if (contrastRatio < 0.4 || contrastRatio > 2.5) {
      isShift = true;
    }
  }

  const result: ShiftResult = {
    isShift,
    highPatchFraction: Number(highPatchFraction.toFixed(3)),
  };

  if (isShift) {
    result.message =
      'This scan may come from a different scanner or protocol. The score may reflect the device, not disease.';
  }

  return result;
}
