/**
 * @file src/pages/AnalyzePage.tsx
 * @description Single scan screening execution with safety gate, patch scoring, and result display.
 */

import React, { useState } from 'react';
import { Upload, ScanEye, AlertCircle, Sparkles } from 'lucide-react';
import { GateRejectCard } from '../components/analyze/GateRejectCard';
import { ResultCard } from '../components/analyze/ResultCard';
import { evaluateSafetyGate } from '../lib/gate';
import {
  computePatchDistances,
  computeImageScore,
  computeGlobalEmbeddingDistance,
} from '../lib/scorer';
import { determineVerdict } from '../lib/verdict';
import { detectScannerShift } from '../lib/shift';
import {
  generateExplanationSentence,
  renderHeatmapDataUrl,
} from '../lib/explain';
import { fuse } from '../lib/fusion';
import { predictProbabilities } from '../lib/classifier';
import {
  loadImageElement,
  drawToCanvasImageData,
  computeImageStatistics,
  validateImageFile,
} from '../lib/imageProcessor';
import { loadFeatureExtractor } from '../lib/tfLoader';
import { addHistoryEntry } from '../lib/history';
import { logAuditEvent } from '../lib/auditLog';
import { AnalysisResult } from '../types';
import { useApp } from '../context/AppContext';

export const AnalyzePage: React.FC = () => {
  const { session, bank, classifier } = useApp();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentResult, setCurrentResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    try {
      validateImageFile(e.target.files[0]);
      setSelectedFile(e.target.files[0]);
      setError(null);
      setCurrentResult(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid file');
    }
  };

  const handleLoadSampleScan = () => {
    // Generates a mock medical scan canvas for instant user testing
    const canvas = document.createElement('canvas');
    canvas.width = 224;
    canvas.height = 224;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 224, 224);

    // Anatomical chest-like contours
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 4;
    for (let y = 40; y < 190; y += 22) {
      ctx.beginPath();
      ctx.ellipse(112, y, 70, 16, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    // Asymmetric anomaly cluster in lower right
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.arc(150, 150, 25, 0, Math.PI * 2);
    ctx.fill();

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'sample_screening_scan.png', { type: 'image/png' });
        setSelectedFile(file);
        setError(null);
        setCurrentResult(null);
      }
    }, 'image/png');
  };

  const runScreeningPipeline = async () => {
    if (!selectedFile) return;
    setIsAnalyzing(true);
    setError(null);
    const startTotal = performance.now();

    try {
      // Stage 1: Load & Strip Metadata
      const t0 = performance.now();
      const img = await loadImageElement(selectedFile);
      const imgData = drawToCanvasImageData(img);
      const stats = computeImageStatistics(imgData);
      const metadataMs = Math.round(performance.now() - t0);

      // Stage 2: Feature Extraction (needed for OOD gate)
      const tInf = performance.now();
      const extractor = await loadFeatureExtractor();
      const tf = await import('@tensorflow/tfjs');

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
        const reshaped = out.reshape([196, channels]);
        return {
          patchFeatures: reshaped.arraySync() as number[][],
          globalEmbedding: out.mean([1, 2]).squeeze().arraySync() as number[],
        };
      });
      const inferenceMs = Math.round(performance.now() - tInf);

      // Stage 3: Gate Evaluation
      const tGate = performance.now();
      const oodDist = bank
        ? computeGlobalEmbeddingDistance(globalEmbedding, bank.globalEmbeddings)
        : 0;
      const gateResult = evaluateSafetyGate(
        stats,
        oodDist,
        bank?.blurLimit ?? 15,
        bank?.oodLimit ?? 999
      );
      const gateMs = Math.round(performance.now() - tGate);

      const previewCanvas = document.createElement('canvas');
      previewCanvas.width = 224;
      previewCanvas.height = 224;
      previewCanvas.getContext('2d')?.putImageData(imgData, 0, 0);
      const previewUrl = previewCanvas.toDataURL('image/jpeg');

      if (!gateResult.passed) {
        const totalMs = Math.round(performance.now() - startTotal);
        const rejectResult: AnalysisResult = {
          id: `res_${Date.now()}`,
          timestamp: Date.now(),
          fileName: selectedFile.name,
          gateResult,
          timings: { metadataMs, gateMs, inferenceMs, scoringMs: 0, verdictMs: 0, totalMs },
          processedImagePreviewUrl: previewUrl,
        };
        setCurrentResult(rejectResult);
        await addHistoryEntry({
          fileName: selectedFile.name,
          verdict: 'Review',
          isBorderline: false,
          percentile: 0,
          score: 0,
          gatePassed: false,
          gateReason: gateResult.reason,
          shiftWarning: false,
          latencyMs: totalMs,
        });
        return;
      }

      // Stage 4: Scoring against Bank
      const tScore = performance.now();
      const bankPatches = bank?.patches ?? [];
      const patchDists = computePatchDistances(patchFeatures, bankPatches);
      const score = computeImageScore(patchDists);
      const scoringMs = Math.round(performance.now() - tScore);

      // Stage 5: Verdict & Explanation
      const tVerd = performance.now();
      const revThresh = bank?.reviewThreshold ?? 0.35;
      const refThresh = bank?.referThreshold ?? 0.65;
      const patchThresh = bank?.patchThreshold ?? 0.45;
      const verdict = determineVerdict(score, revThresh, refThresh, bank?.validationStats.sortedScores ?? []);
      const shift = detectScannerShift(patchDists, patchThresh, stats, bank?.validationStats);
      const sentence = generateExplanationSentence(patchDists, patchThresh, verdict.verdict === 'Normal');
      verdict.explanation = sentence;

      const minVal = Math.min(...patchDists);
      const maxVal = Math.max(...patchDists);
      const heatmapUrl = renderHeatmapDataUrl(patchDists, minVal, maxVal);

      // Stage 6: Supervised Fusion
      let fusionResult;
      if (classifier) {
        const probs = predictProbabilities(globalEmbedding, classifier);
        fusionResult = fuse(verdict.verdict, verdict.isBorderline, probs);
      }

      const verdictMs = Math.round(performance.now() - tVerd);
      const totalMs = Math.round(performance.now() - startTotal);

      const completeResult: AnalysisResult = {
        id: `res_${Date.now()}`,
        timestamp: Date.now(),
        fileName: selectedFile.name,
        gateResult,
        score,
        verdict,
        shift,
        fusion: fusionResult,
        timings: { metadataMs, gateMs, inferenceMs, scoringMs, verdictMs, totalMs },
        heatmapDataUrl: heatmapUrl,
        processedImagePreviewUrl: previewUrl,
        nearestHealthyThumbnail: bank?.thumbnails?.[0],
      };

      setCurrentResult(completeResult);

      await addHistoryEntry({
        fileName: selectedFile.name,
        verdict: verdict.verdict,
        isBorderline: verdict.isBorderline,
        percentile: verdict.percentile,
        score,
        gatePassed: true,
        shiftWarning: shift.isShift,
        suggestedFinding: fusionResult?.message,
        latencyMs: totalMs,
      });

      if (session?.user) {
        await logAuditEvent(
          session.user.email,
          'ANALYZE_IMAGE',
          `Screened ${selectedFile.name} -> ${verdict.verdict} (Score: ${score.toFixed(3)})`
        );
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Screening failed.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
          <ScanEye className="w-6 h-6 text-teal-400" />
          Analyze Medical Scan
        </h1>
        <p className="text-sm text-slate-400">
          Label-free localized anomaly screening and clinical decision support.
        </p>
      </div>

      {!bank && (
        <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-800/50 flex items-center gap-3 text-xs text-amber-300">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-amber-400" />
          <span>
            No reference bank is currently active. For calibrated percentiles and thresholds, please build or import a reference bank first. Default heuristics will be used.
          </span>
        </div>
      )}

      {/* Upload Zone */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="border-2 border-dashed border-slate-700 hover:border-teal-500/60 rounded-xl p-6 text-center transition-colors">
          <Upload className="w-8 h-8 text-slate-500 mx-auto mb-2" />
          <p className="text-sm font-medium text-slate-200">
            {selectedFile ? selectedFile.name : 'Select or drop a medical scan to screen'}
          </p>
          <p className="text-xs text-slate-500 mt-1">PNG, JPG, WEBP up to 15 MB</p>

          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <label className="cursor-pointer px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors">
              Browse Scan
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
            <button
              onClick={handleLoadSampleScan}
              type="button"
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-teal-400 rounded-lg text-xs font-medium border border-slate-700 transition-colors flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Load Test Scan
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-lg text-xs text-rose-300">
            {error}
          </div>
        )}

        <button
          onClick={runScreeningPipeline}
          disabled={!selectedFile || isAnalyzing}
          className="w-full py-3 px-4 bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white font-semibold text-sm rounded-lg shadow-md transition-colors"
        >
          {isAnalyzing ? 'Screening Scan (Local Inference)...' : 'Run Kavach Screening'}
        </button>
      </div>

      {/* Results View */}
      {currentResult && (
        <div className="mt-6">
          {!currentResult.gateResult.passed ? (
            <GateRejectCard
              gateResult={currentResult.gateResult}
              onRetry={() => {
                setSelectedFile(null);
                setCurrentResult(null);
              }}
            />
          ) : (
            <ResultCard result={currentResult} />
          )}
        </div>
      )}
    </div>
  );
};
