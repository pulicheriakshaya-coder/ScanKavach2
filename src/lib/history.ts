/**
 * @file src/lib/history.ts
 * @description Stores screening history without image data and computes dashboard metrics.
 */

import { HISTORY_LIMIT } from '../config';
import { AnomalyVerdict, HistoryItem } from '../types';
import { getStorageItem, setStorageItem } from './storage';

const HISTORY_KEY = 'history';

/**
 * Retrieves the stored screening history.
 * @returns Array of HistoryItem objects.
 */
export async function getHistory(): Promise<HistoryItem[]> {
  return (await getStorageItem<HistoryItem[]>(HISTORY_KEY)) || [];
}

/**
 * Adds a new scan result to history (never storing image or thumbnail data).
 * @param item - Partial or full history item.
 */
export async function addHistoryEntry(
  item: Omit<HistoryItem, 'id' | 'timestamp'>
): Promise<void> {
  const history = await getHistory();
  const newEntry: HistoryItem = {
    ...item,
    id: `his_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    timestamp: Date.now(),
  };
  history.unshift(newEntry);
  if (history.length > HISTORY_LIMIT) {
    history.length = HISTORY_LIMIT;
  }
  await setStorageItem(HISTORY_KEY, history);
}

/**
 * Clears all scan history.
 */
export async function clearHistory(): Promise<void> {
  await setStorageItem(HISTORY_KEY, []);
}

export interface DashboardStats {
  totalScans: number;
  stoppedByGate: number;
  normalCount: number;
  reviewCount: number;
  referCount: number;
  borderlineCount: number;
  avgLatencyMs: number;
  verdictDistribution: { name: string; value: number; color: string }[];
  scansPerDay: { date: string; count: number }[];
  last30Scores: { index: number; score: number; verdict: AnomalyVerdict }[];
  findingsDistribution: { condition: string; count: number }[];
}

/**
 * Computes dashboard aggregate metrics from screening history.
 * @param history - Array of history items.
 * @returns DashboardStats record.
 */
export function computeDashboardStats(history: HistoryItem[]): DashboardStats {
  const totalScans = history.length;
  let stoppedByGate = 0;
  let normalCount = 0;
  let reviewCount = 0;
  let referCount = 0;
  let borderlineCount = 0;
  let totalLatency = 0;

  const dayCounts: Record<string, number> = {};
  const findingCounts: Record<string, number> = {};

  for (const item of history) {
    totalLatency += item.latencyMs || 0;
    if (!item.gatePassed) {
      stoppedByGate += 1;
    } else {
      if (item.verdict === 'Normal') normalCount += 1;
      else if (item.verdict === 'Review') reviewCount += 1;
      else if (item.verdict === 'Refer') referCount += 1;

      if (item.isBorderline) borderlineCount += 1;
    }

    const dayKey = new Date(item.timestamp).toISOString().slice(0, 10);
    dayCounts[dayKey] = (dayCounts[dayKey] || 0) + 1;

    if (item.suggestedFinding) {
      findingCounts[item.suggestedFinding] =
        (findingCounts[item.suggestedFinding] || 0) + 1;
    }
  }

  const avgLatencyMs = totalScans > 0 ? Math.round(totalLatency / totalScans) : 0;
  const verdictDistribution = [
    { name: 'Normal', value: normalCount, color: '#0d9488' },
    { name: 'Review', value: reviewCount, color: '#f59e0b' },
    { name: 'Refer', value: referCount, color: '#ef4444' },
  ];

  const scansPerDay = Object.entries(dayCounts)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-14)
    .map(([date, count]) => ({ date, count }));

  const last30Scores = history
    .filter((h) => h.gatePassed)
    .slice(0, 30)
    .reverse()
    .map((h, i) => ({
      index: i + 1,
      score: Number(h.score.toFixed(3)),
      verdict: h.verdict,
    }));

  const findingsDistribution = Object.entries(findingCounts).map(
    ([condition, count]) => ({ condition, count })
  );

  return {
    totalScans,
    stoppedByGate,
    normalCount,
    reviewCount,
    referCount,
    borderlineCount,
    avgLatencyMs,
    verdictDistribution,
    scansPerDay,
    last30Scores,
    findingsDistribution,
  };
}

/**
 * Loads synthetic sample data for demonstration.
 */
export async function loadSampleHistory(): Promise<HistoryItem[]> {
  const sampleItems: HistoryItem[] = [
    {
      id: 'his_syn_1',
      timestamp: Date.now() - 3600000 * 24 * 3,
      fileName: 'synthetic_scan_01.png',
      verdict: 'Normal',
      isBorderline: false,
      percentile: 45,
      score: 0.18,
      gatePassed: true,
      shiftWarning: false,
      suggestedFinding: 'Healthy pattern',
      latencyMs: 340,
    },
    {
      id: 'his_syn_2',
      timestamp: Date.now() - 3600000 * 24 * 2,
      fileName: 'synthetic_scan_02.png',
      verdict: 'Review',
      isBorderline: true,
      percentile: 96,
      score: 0.42,
      gatePassed: true,
      shiftWarning: false,
      suggestedFinding: 'Pneumonia pattern',
      latencyMs: 410,
    },
    {
      id: 'his_syn_3',
      timestamp: Date.now() - 3600000 * 24,
      fileName: 'synthetic_scan_03.png',
      verdict: 'Refer',
      isBorderline: false,
      percentile: 99.5,
      score: 0.78,
      gatePassed: true,
      shiftWarning: false,
      suggestedFinding: 'Tuberculosis pattern',
      latencyMs: 380,
    },
    {
      id: 'his_syn_4',
      timestamp: Date.now() - 3600000 * 12,
      fileName: 'photo_selfie.jpg',
      verdict: 'Review',
      isBorderline: false,
      percentile: 0,
      score: 0,
      gatePassed: false,
      gateReason: 'This is a colour photo. Expected a grayscale medical scan.',
      shiftWarning: false,
      latencyMs: 45,
    },
    {
      id: 'his_syn_5',
      timestamp: Date.now() - 3600000 * 2,
      fileName: 'synthetic_scan_05.png',
      verdict: 'Normal',
      isBorderline: false,
      percentile: 22,
      score: 0.12,
      gatePassed: true,
      shiftWarning: false,
      suggestedFinding: 'Healthy pattern',
      latencyMs: 360,
    },
  ];

  await setStorageItem(HISTORY_KEY, sampleItems);
  return sampleItems;
}

/**
 * Formats scan history as a CSV string.
 * @param history - Array of history records.
 */
export function exportHistoryCsv(history: HistoryItem[]): string {
  const headers = [
    'ID',
    'Timestamp',
    'Date ISO',
    'File Name',
    'Gate Passed',
    'Gate Reason',
    'Verdict',
    'Borderline',
    'Percentile',
    'Score',
    'Shift Warning',
    'Suggested Finding',
    'Latency ms',
  ];

  const rows = history.map((item) => [
    item.id,
    item.timestamp,
    new Date(item.timestamp).toISOString(),
    `"${item.fileName.replace(/"/g, '""')}"`,
    item.gatePassed,
    `"${(item.gateReason || '').replace(/"/g, '""')}"`,
    item.verdict,
    item.isBorderline,
    item.percentile,
    item.score,
    item.shiftWarning,
    `"${(item.suggestedFinding || '').replace(/"/g, '""')}"`,
    item.latencyMs,
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}
