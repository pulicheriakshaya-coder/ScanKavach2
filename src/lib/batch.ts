/**
 * @file src/lib/batch.ts
 * @description Sequential batch processing for multiple screening images with CSV export.
 */

import { BATCH_LIMIT } from '../config';
import { AnomalyVerdict, GateCheckResult, HistoryItem } from '../types';

export interface BatchItemResult {
  id: string;
  file: File;
  fileName: string;
  thumbnailUrl: string;
  gateResult: GateCheckResult;
  score: number;
  percentile: number;
  verdict: AnomalyVerdict;
  isBorderline: boolean;
  shiftWarning: boolean;
  suggestedFinding?: string;
  latencyMs: number;
}

/**
 * Validates batch files list against BATCH_LIMIT.
 */
export function validateBatchFiles(files: File[]): void {
  if (files.length === 0) {
    throw new Error('Please select at least one scan file.');
  }
  if (files.length > BATCH_LIMIT) {
    throw new Error(`Batch processing is limited to ${BATCH_LIMIT} scans at once.`);
  }
}

/**
 * Formats batch processing results into CSV string for download.
 *
 * @param results - Array of completed batch screening items.
 * @returns CSV formatted string.
 */
export function exportBatchCsv(results: BatchItemResult[]): string {
  const headers = [
    'File Name',
    'Gate Passed',
    'Gate Reason',
    'Score',
    'Percentile',
    'Verdict',
    'Borderline',
    'Shift Warning',
    'Suggested Finding',
    'Latency ms',
  ];

  const rows = results.map((item) => [
    `"${item.fileName.replace(/"/g, '""')}"`,
    item.gateResult.passed,
    `"${(item.gateResult.reason || '').replace(/"/g, '""')}"`,
    item.score.toFixed(3),
    item.percentile,
    item.verdict,
    item.isBorderline,
    item.shiftWarning,
    `"${(item.suggestedFinding || '').replace(/"/g, '""')}"`,
    item.latencyMs,
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

/**
 * Converts batch results to HistoryItem array for history saving.
 */
export function batchResultsToHistory(results: BatchItemResult[]): Omit<HistoryItem, 'id' | 'timestamp'>[] {
  return results.map((r) => ({
    fileName: r.fileName,
    verdict: r.verdict,
    isBorderline: r.isBorderline,
    percentile: r.percentile,
    score: r.score,
    gatePassed: r.gateResult.passed,
    gateReason: r.gateResult.reason,
    shiftWarning: r.shiftWarning,
    suggestedFinding: r.suggestedFinding,
    latencyMs: r.latencyMs,
  }));
}
