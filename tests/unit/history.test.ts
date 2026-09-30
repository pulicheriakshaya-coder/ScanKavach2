import { describe, it, expect, beforeEach } from 'vitest';
import {
  computeDashboardStats,
  exportHistoryCsv,
  addHistoryEntry,
  getHistory,
  clearHistory,
} from '../../src/lib/history';
import { HistoryItem } from '../../src/types';

describe('History and Stats Unit Tests', () => {
  beforeEach(async () => {
    await clearHistory();
  });

  const mockHistory: HistoryItem[] = [
    {
      id: 'h1',
      timestamp: Date.now() - 10000,
      fileName: 's1.png',
      verdict: 'Normal',
      isBorderline: false,
      percentile: 40,
      score: 0.18,
      gatePassed: true,
      shiftWarning: false,
      suggestedFinding: 'Healthy pattern',
      latencyMs: 300,
    },
    {
      id: 'h2',
      timestamp: Date.now() - 5000,
      fileName: 's2.png',
      verdict: 'Review',
      isBorderline: true,
      percentile: 96,
      score: 0.42,
      gatePassed: true,
      shiftWarning: false,
      suggestedFinding: 'Pneumonia pattern',
      latencyMs: 500,
    },
    {
      id: 'h3',
      timestamp: Date.now(),
      fileName: 's3.png',
      verdict: 'Review',
      isBorderline: false,
      percentile: 0,
      score: 0,
      gatePassed: false,
      gateReason: 'Too blurry',
      shiftWarning: false,
      latencyMs: 50,
    },
  ];

  it('computes correct dashboard metrics and averages', () => {
    const stats = computeDashboardStats(mockHistory);
    expect(stats.totalScans).toBe(3);
    expect(stats.normalCount).toBe(1);
    expect(stats.reviewCount).toBe(1);
    expect(stats.borderlineCount).toBe(1);
    expect(stats.stoppedByGate).toBe(1);
    expect(stats.avgLatencyMs).toBe(Math.round((300 + 500 + 50) / 3));
  });

  it('exports valid CSV formatted history string', () => {
    const csv = exportHistoryCsv(mockHistory);
    expect(csv).toContain('File Name');
    expect(csv).toContain('"s1.png"');
    expect(csv).toContain('"s2.png"');
    expect(csv).toContain('Too blurry');
  });

  it('stores and retrieves history entries without saving image pixels', async () => {
    await addHistoryEntry({
      fileName: 'test_persist.png',
      verdict: 'Normal',
      isBorderline: false,
      percentile: 30,
      score: 0.15,
      gatePassed: true,
      shiftWarning: false,
      latencyMs: 250,
    });

    const list = await getHistory();
    expect(list.length).toBe(1);
    expect(list[0].fileName).toBe('test_persist.png');
    // Ensure no image data property exists
    expect((list[0] as unknown as Record<string, unknown>).imageData).toBeUndefined();
  });
});
