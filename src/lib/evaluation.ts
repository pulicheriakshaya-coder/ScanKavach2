/**
 * @file src/lib/evaluation.ts
 * @description Statistical evaluation tools: rank-based AUROC, ROC curves, calibration (ECE), and ablation.
 */

export interface RocPoint {
  fpr: number;
  tpr: number;
  threshold: number;
}

export interface OperatingPointMetrics {
  threshold: number;
  sensitivity: number;
  specificity: number;
  fpr: number;
  tpr: number;
}

/**
 * Computes rank-based AUROC using the Mann-Whitney U statistic.
 *
 * @param positiveScores - Anomaly scores of abnormal scans.
 * @param negativeScores - Anomaly scores of normal validation scans.
 * @returns AUROC between 0.0 and 1.0.
 */
export function computeRankAuroc(positiveScores: number[], negativeScores: number[]): number {
  const nPos = positiveScores.length;
  const nNeg = negativeScores.length;
  if (nPos === 0 || nNeg === 0) return 0.5;

  interface ScoredItem {
    score: number;
    isPos: boolean;
  }

  const combined: ScoredItem[] = [
    ...positiveScores.map((s) => ({ score: s, isPos: true })),
    ...negativeScores.map((s) => ({ score: s, isPos: false })),
  ].sort((a, b) => a.score - b.score);

  // Compute rank sum of positives with tie-handling
  let rankSumPos = 0;
  let i = 0;
  while (i < combined.length) {
    let j = i;
    while (j < combined.length && combined[j].score === combined[i].score) {
      j++;
    }
    const avgRank = (i + 1 + j) / 2.0;
    for (let k = i; k < j; k++) {
      if (combined[k].isPos) {
        rankSumPos += avgRank;
      }
    }
    i = j;
  }

  const u = rankSumPos - (nPos * (nPos + 1)) / 2.0;
  return Number((u / (nPos * nNeg)).toFixed(4));
}

/**
 * Calculates sensitivity and specificity at a specified threshold.
 */
export function computeOperatingPoint(
  positiveScores: number[],
  negativeScores: number[],
  threshold: number
): OperatingPointMetrics {
  const tp = positiveScores.filter((s) => s >= threshold).length;
  const fn = positiveScores.length - tp;
  const tn = negativeScores.filter((s) => s < threshold).length;
  const fp = negativeScores.length - tn;

  const sensitivity = positiveScores.length > 0 ? tp / (tp + fn) : 0;
  const specificity = negativeScores.length > 0 ? tn / (tn + fp) : 0;
  const fpr = 1 - specificity;
  const tpr = sensitivity;

  return {
    threshold,
    sensitivity: Number(sensitivity.toFixed(3)),
    specificity: Number(specificity.toFixed(3)),
    fpr: Number(fpr.toFixed(3)),
    tpr: Number(tpr.toFixed(3)),
  };
}

/**
 * Generates ROC curve coordinate points from paired test scores.
 */
export function generateRocCurve(
  positiveScores: number[],
  negativeScores: number[],
  numSteps: number = 50
): RocPoint[] {
  if (positiveScores.length === 0 || negativeScores.length === 0) return [];
  const allScores = [...positiveScores, ...negativeScores].sort((a, b) => a - b);
  const minScore = allScores[0];
  const maxScore = allScores[allScores.length - 1];
  const step = (maxScore - minScore) / numSteps || 0.01;

  const points: RocPoint[] = [];
  for (let s = minScore - step; s <= maxScore + step; s += step) {
    const pt = computeOperatingPoint(positiveScores, negativeScores, s);
    points.push({ fpr: pt.fpr, tpr: pt.tpr, threshold: Number(s.toFixed(3)) });
  }

  // Ensure points start at (1,1) down to (0,0) or vice versa
  return points.sort((a, b) => a.fpr - b.fpr);
}

/**
 * Computes Expected Calibration Error (ECE) across M probability bins.
 */
export function computeExpectedCalibrationError(
  confidences: number[],
  correctness: boolean[],
  numBins: number = 10
): { ece: number; binData: { bin: string; conf: number; acc: number; count: number }[] } {
  const binData = [];
  let totalEce = 0;
  const N = confidences.length;
  if (N === 0) return { ece: 0, binData: [] };

  for (let b = 0; b < numBins; b++) {
    const binLower = b / numBins;
    const binUpper = (b + 1) / numBins;
    const inBinIndices: number[] = [];

    for (let i = 0; i < N; i++) {
      if (
        confidences[i] >= binLower &&
        (b === numBins - 1 ? confidences[i] <= binUpper : confidences[i] < binUpper)
      ) {
        inBinIndices.push(i);
      }
    }

    const count = inBinIndices.length;
    if (count > 0) {
      const avgConf = inBinIndices.reduce((sum, idx) => sum + confidences[idx], 0) / count;
      const avgAcc = inBinIndices.reduce((sum, idx) => sum + (correctness[idx] ? 1 : 0), 0) / count;
      totalEce += (count / N) * Math.abs(avgAcc - avgConf);
      binData.push({
        bin: `${(binLower * 100).toFixed(0)}-${(binUpper * 100).toFixed(0)}%`,
        conf: Number(avgConf.toFixed(3)),
        acc: Number(avgAcc.toFixed(3)),
        count,
      });
    }
  }

  return { ece: Number(totalEce.toFixed(4)), binData };
}
