/**
 * @file src/pages/BatchPage.tsx
 * @description Sequential high-throughput batch screening up to 50 scans with CSV export.
 */

import React, { useState } from 'react';
import { Layers, Upload, Download, Save, CheckCircle2, AlertTriangle, Eye } from 'lucide-react';
import { BATCH_LIMIT } from '../config';
import {
  BatchItemResult,
  exportBatchCsv,
  batchResultsToHistory,
  validateBatchFiles,
} from '../lib/batch';
import { evaluateSafetyGate } from '../lib/gate';
import {
  computePatchDistances,
  computeImageScore,
  computeGlobalEmbeddingDistance,
} from '../lib/scorer';
import { determineVerdict } from '../lib/verdict';
import { detectScannerShift } from '../lib/shift';
import { fuse } from '../lib/fusion';
import { predictProbabilities } from '../lib/classifier';
import {
  loadImageElement,
  drawToCanvasImageData,
  computeImageStatistics,
  generateThumbnailDataUrl,
} from '../lib/imageProcessor';
import { loadFeatureExtractor } from '../lib/tfLoader';
import { addHistoryEntry } from '../lib/history';
import { downloadCsvFile, logAuditEvent } from '../lib/auditLog';
import { useApp } from '../context/AppContext';

export const BatchPage: React.FC = () => {
  const { session, bank, classifier } = useApp();
  const [files, setFiles] = useState<File[]>([]);
  const [results, setResults] = useState<BatchItemResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [savedToHistory, setSavedToHistory] = useState(false);

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    try {
      const selected = Array.from(e.target.files);
      validateBatchFiles(selected);
      setFiles(selected);
      setResults([]);
      setSavedToHistory(false);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Invalid files');
    }
  };

  const runBatchProcessing = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    setProgress(0);
    const batchResults: BatchItemResult[] = [];

    try {
      const extractor = await loadFeatureExtractor();
      const tf = await import('@tensorflow/tfjs');

      for (let i = 0; i < files.length; i++) {
        setCurrentFileIndex(i + 1);
        const file = files[i];
        const t0 = performance.now();

        const img = await loadImageElement(file);
        const imgData = drawToCanvasImageData(img);
        const stats = computeImageStatistics(imgData);
        const thumb = generateThumbnailDataUrl(img);

        const { patchFeatures, globalEmbedding } = tf.tidy(() => {
          const tensor = tf.browser
            .fromPixels(img)
            .resizeBilinear([224, 224])
            .toFloat()
            .div(127.5)
            .sub(1.0)
            .expandDims(0);
          const out = extractor.predict(tensor) as import('@tensorflow/tfjs').Tensor;
          const channels = (out.shape[3] as number) || 128;
          return {
            patchFeatures: out.reshape([196, channels]).arraySync() as number[][],
            globalEmbedding: out.mean([1, 2]).squeeze().arraySync() as number[],
          };
        });

        const oodDist = bank
          ? computeGlobalEmbeddingDistance(globalEmbedding, bank.globalEmbeddings)
          : 0;
        const gateResult = evaluateSafetyGate(
          stats,
          oodDist,
          bank?.blurLimit ?? 15,
          bank?.oodLimit ?? 999
        );

        let score = 0;
        let percentile = 0;
        let verdict: import('../types').AnomalyVerdict = 'Normal';
        let isBorderline = false;
        let isShift = false;
        let suggestedFinding: string | undefined;

        if (gateResult.passed) {
          const patchDists = computePatchDistances(patchFeatures, bank?.patches ?? []);
          score = computeImageScore(patchDists);
          const revThresh = bank?.reviewThreshold ?? 0.35;
          const refThresh = bank?.referThreshold ?? 0.65;
          const verdictRes = determineVerdict(
            score,
            revThresh,
            refThresh,
            bank?.validationStats.sortedScores ?? []
          );
          verdict = verdictRes.verdict;
          isBorderline = verdictRes.isBorderline;
          percentile = verdictRes.percentile;

          const shiftRes = detectScannerShift(
            patchDists,
            bank?.patchThreshold ?? 0.45,
            stats,
            bank?.validationStats
          );
          isShift = shiftRes.isShift;

          if (classifier) {
            const probs = predictProbabilities(globalEmbedding, classifier);
            const fusionRes = fuse(verdict, isBorderline, probs);
            suggestedFinding = fusionRes.message;
          }
        }

        const latencyMs = Math.round(performance.now() - t0);

        batchResults.push({
          id: `batch_${i}`,
          file,
          fileName: file.name,
          thumbnailUrl: thumb,
          gateResult,
          score,
          percentile,
          verdict,
          isBorderline,
          shiftWarning: isShift,
          suggestedFinding,
          latencyMs,
        });

        setProgress(Math.round(((i + 1) / files.length) * 100));
      }

      // Sort by percentile descending (highest anomaly first)
      batchResults.sort((a, b) => b.percentile - a.percentile);
      setResults(batchResults);

      if (session?.user) {
        await logAuditEvent(
          session.user.email,
          'BATCH_ANALYSIS',
          `Completed batch screening of ${files.length} scans.`
        );
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExportCsv = () => {
    const csv = exportBatchCsv(results);
    downloadCsvFile(csv, `scankavach-batch-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const handleSaveToHistory = async () => {
    const historyItems = batchResultsToHistory(results);
    for (const item of historyItems) {
      await addHistoryEntry(item);
    }
    setSavedToHistory(true);
    alert(`Successfully appended ${results.length} records to local screening history.`);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
          <Layers className="w-6 h-6 text-teal-400" />
          Batch Screening Triage
        </h1>
        <p className="text-sm text-slate-400">
          Process up to {BATCH_LIMIT} scans sequentially. Ranked automatically by anomaly percentile.
        </p>
      </div>

      {/* Control Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors">
            <Upload className="w-4 h-4" />
            Select Scans (Up to {BATCH_LIMIT})
            <input
              type="file"
              multiple
              accept="image/png,image/jpeg,image/webp"
              onChange={handleFiles}
              className="hidden"
            />
          </label>

          <div className="flex items-center gap-2">
            <button
              onClick={runBatchProcessing}
              disabled={files.length === 0 || isProcessing}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-teal-400 border border-teal-500/30 rounded-lg text-xs font-semibold transition-colors"
            >
              {isProcessing
                ? `Screening (${currentFileIndex}/${files.length})...`
                : `Run Batch Screening (${files.length})`}
            </button>
            {results.length > 0 && (
              <>
                <button
                  onClick={handleExportCsv}
                  className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
                >
                  <Download className="w-4 h-4" />
                  Export CSV
                </button>
                <button
                  onClick={handleSaveToHistory}
                  disabled={savedToHistory}
                  className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  {savedToHistory ? 'Saved' : 'Save to History'}
                </button>
              </>
            )}
          </div>
        </div>

        {isProcessing && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Screening in progress...</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-teal-500 transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Results Table */}
      {results.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-200">
              Batch Results (Sorted by Anomaly Percentile)
            </span>
            <span className="text-xs text-slate-400">{results.length} scans screened</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/60 text-slate-400 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-3 py-2.5">Thumb</th>
                  <th className="px-3 py-2.5">File Name</th>
                  <th className="px-3 py-2.5">Gate Status</th>
                  <th className="px-3 py-2.5">Verdict</th>
                  <th className="px-3 py-2.5">Score</th>
                  <th className="px-3 py-2.5">Percentile</th>
                  <th className="px-3 py-2.5">Shift Alert</th>
                  <th className="px-3 py-2.5">Finding Suggestion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {results.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-3 py-2">
                      <img
                        src={item.thumbnailUrl}
                        alt="thumbnail"
                        className="w-8 h-8 rounded object-cover bg-black"
                      />
                    </td>
                    <td className="px-3 py-2 font-medium text-slate-200 max-w-[140px] truncate">
                      {item.fileName}
                    </td>
                    <td className="px-3 py-2">
                      {item.gateResult.passed ? (
                        <span className="text-teal-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Passed
                        </span>
                      ) : (
                        <span className="text-rose-400 truncate max-w-[130px] block" title={item.gateResult.reason}>
                          Stopped ({item.gateResult.reason?.slice(0, 18)}...)
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {item.gateResult.passed ? (
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            item.verdict === 'Normal'
                              ? 'bg-teal-950 text-teal-300 border border-teal-800'
                              : item.verdict === 'Review'
                              ? 'bg-amber-950 text-amber-300 border border-amber-800'
                              : 'bg-rose-950 text-rose-300 border border-rose-800'
                          }`}
                        >
                          {item.verdict} {item.isBorderline ? '*' : ''}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {item.gateResult.passed ? item.score.toFixed(3) : '—'}
                    </td>
                    <td className="px-3 py-2 font-semibold text-slate-200">
                      {item.gateResult.passed ? `${item.percentile}%` : '—'}
                    </td>
                    <td className="px-3 py-2">
                      {item.shiftWarning ? (
                        <span className="text-amber-400 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" /> Yes
                        </span>
                      ) : (
                        <span className="text-slate-500">No</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-slate-400 max-w-[160px] truncate">
                      {item.suggestedFinding || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
