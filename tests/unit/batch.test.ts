import { describe, it, expect } from 'vitest';
import {
  validateBatchFiles,
  exportBatchCsv,
  batchResultsToHistory,
  BatchItemResult,
} from '../../src/lib/batch';
import { BATCH_LIMIT } from '../../src/config';

describe('Batch Processing Unit Tests', () => {
  it('throws on empty files list', () => {
    expect(() => validateBatchFiles([])).toThrow();
  });

  it('throws when file count exceeds BATCH_LIMIT', () => {
    const tooMany = Array.from({ length: BATCH_LIMIT + 1 }, () => new File([''], 'test.png'));
    expect(() => validateBatchFiles(tooMany)).toThrow();
  });

  it('formats batch results into valid CSV string', () => {
    const results: BatchItemResult[] = [
      {
        id: '1',
        file: new File([''], 'scan1.png'),
        fileName: 'scan1.png',
        thumbnailUrl: '',
        gateResult: { passed: true, colorDiff: 2, contrastStd: 0.1, blurVariance: 30, embeddingDistance: 2 },
        score: 0.25,
        percentile: 60,
        verdict: 'Normal',
        isBorderline: false,
        shiftWarning: false,
        latencyMs: 120,
      },
    ];

    const csv = exportBatchCsv(results);
    expect(csv).toContain('File Name,Gate Passed');
    expect(csv).toContain('"scan1.png"');
    expect(csv).toContain('Normal');
  });

  it('converts batch results to history entries', () => {
    const results: BatchItemResult[] = [
      {
        id: '1',
        file: new File([''], 'scan1.png'),
        fileName: 'scan1.png',
        thumbnailUrl: '',
        gateResult: { passed: true, colorDiff: 2, contrastStd: 0.1, blurVariance: 30, embeddingDistance: 2 },
        score: 0.25,
        percentile: 60,
        verdict: 'Normal',
        isBorderline: false,
        shiftWarning: false,
        latencyMs: 120,
      },
    ];
    const history = batchResultsToHistory(results);
    expect(history.length).toBe(1);
    expect(history[0].fileName).toBe('scan1.png');
    expect(history[0].score).toBe(0.25);
  });
});
