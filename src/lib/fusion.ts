/**
 * @file src/lib/fusion.ts
 * @description Decision fusion combining unsupervised anomaly verdict and supervised classifier probabilities.
 */

import {
  DISAGREEMENT_PROB,
  HIGH_CONFIDENCE,
  MIN_CONFIDENCE,
} from '../config';
import { AnomalyVerdict, FusionResult, FusionVerdict } from '../types';

export interface FusionConfig {
  minConfidence?: number;
  highConfidence?: number;
  disagreementProb?: number;
}

/**
 * Pure fusion engine that merges the unsupervised anomaly verdict with supervised class probabilities.
 *
 * @param anomalyVerdict - Normal, Review, or Refer from the memory bank.
 * @param isBorderline - Whether the anomaly score is borderline near a threshold.
 * @param classProbs - Map of class names to predicted probabilities (sum to 1.0).
 * @param config - Optional thresholds override.
 * @returns FusionResult with standardized clinical safety wording and flags.
 */
export function fuse(
  anomalyVerdict: AnomalyVerdict,
  isBorderline: boolean,
  classProbs: Record<string, number>,
  config: FusionConfig = {}
): FusionResult {
  const minConf = config.minConfidence ?? MIN_CONFIDENCE;
  const highConf = config.highConfidence ?? HIGH_CONFIDENCE;
  const disagreeThresh = config.disagreementProb ?? DISAGREEMENT_PROB;

  const entries = Object.entries(classProbs).sort(([, a], [, b]) => b - a);
  const [topClass = 'Normal', topProb = 0] = entries[0] || [];

  const normalProb = classProbs['Normal'] ?? 0;
  const nonNormalEntries = entries.filter(([name]) => name.toLowerCase() !== 'normal');
  const [topNonNormalClass = '', topNonNormalProb = 0] = nonNormalEntries[0] || [];

  let fusionVerdict: FusionVerdict = 'Inconclusive';
  let message = '';
  const isHighConfidence = topProb >= highConf;

  // Conflict Branch 1: Anomaly is Normal, but classifier strongly predicts pathology
  if (anomalyVerdict === 'Normal' && !isBorderline && topNonNormalProb >= disagreeThresh) {
    fusionVerdict = 'Conflict';
    message = 'Signals disagree. A clinician review is strongly recommended.';
  }
  // Conflict Branch 2: Anomaly is Refer, but classifier is confident Normal
  else if (anomalyVerdict === 'Refer' && normalProb >= disagreeThresh) {
    fusionVerdict = 'Conflict';
    message = 'Signals disagree. A clinician review is strongly recommended.';
  }
  // Consistent-normal: Anomaly is Normal and classifier agrees Normal
  else if (anomalyVerdict === 'Normal' && topClass.toLowerCase() === 'normal') {
    fusionVerdict = 'Consistent-normal';
    message = 'Consistent with healthy reference patterns.';
  }
  // Suggested-condition: Anomaly flags Review/Refer AND top non-normal class >= minConf
  else if (
    (anomalyVerdict === 'Review' || anomalyVerdict === 'Refer' || isBorderline) &&
    topNonNormalProb >= minConf
  ) {
    fusionVerdict = 'Suggested-condition';
    const confPct = Math.round(topNonNormalProb * 100);
    message = `Pattern most similar to: ${topNonNormalClass} (${confPct}% model confidence)`;
  }
  // Inconclusive fallback
  else {
    fusionVerdict = 'Inconclusive';
    message = 'The model is not confident. Unusual pattern present but condition unclear.';
  }

  const disclaimer =
    'This is an AI-suggested finding from a research prototype, not a confirmed diagnosis and not a medical device. It must be reviewed and confirmed by a qualified doctor or radiologist.';

  return {
    fusionVerdict,
    topClass: topNonNormalClass || topClass,
    confidence: topNonNormalProb || topProb,
    isHighConfidence,
    message,
    disclaimer,
    probabilities: classProbs,
  };
}
