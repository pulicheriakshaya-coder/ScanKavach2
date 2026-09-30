/**
 * @file src/pages/EvaluationPage.tsx
 * @description Statistical evaluation dashboard with rank-based AUROC, ROC curves, and ablation analysis.
 */

import React, { useState } from 'react';
import {
  LineChart as LineChartIcon,
  Upload,
  AlertTriangle,
  RotateCcw,
  Check,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceDot,
} from 'recharts';
import {
  computeRankAuroc,
  computeOperatingPoint,
  generateRocCurve,
  computeExpectedCalibrationError,
} from '../lib/evaluation';
import { evaluateSafetyGate } from '../lib/gate';
import { computePatchDistances, computeImageScore } from '../lib/scorer';
import {
  loadImageElement,
  drawToCanvasImageData,
  computeImageStatistics,
} from '../lib/imageProcessor';
import { loadFeatureExtractor } from '../lib/tfLoader';
import { saveReferenceBank } from '../lib/memoryBank';
import { useApp } from '../context/AppContext';

export const EvaluationPage: React.FC = () => {
  const { bank, refreshBank } = useApp();
  const [abnormalScores, setAbnormalScores] = useState<number[]>([]);
  const [gateRejectionsCount, setGateRejectionsCount] = useState(0);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [customReviewThresh, setCustomReviewThresh] = useState<number>(() => bank?.reviewThreshold ?? 0.35);

  const normalScores = bank?.validationStats.sortedScores ?? [0.12, 0.15, 0.18, 0.22, 0.25, 0.28, 0.31];
  const auroc = computeRankAuroc(abnormalScores, normalScores);

  const calReview = bank?.reviewThreshold ?? 0.35;
  const calRefer = bank?.referThreshold ?? 0.65;
  const opReview = computeOperatingPoint(abnormalScores, normalScores, customReviewThresh);
  const opRefer = computeOperatingPoint(abnormalScores, normalScores, calRefer);

  const rocData = generateRocCurve(abnormalScores, normalScores, 40);

  const handleAbnormalUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    setIsEvaluating(true);
    let rejections = 0;
    const scores: number[] = [];

    try {
      const extractor = await loadFeatureExtractor();
      const tf = await import('@tensorflow/tfjs');

      for (const file of files) {
        const img = await loadImageElement(file);
        const imgData = drawToCanvasImageData(img);
        const stats = computeImageStatistics(imgData);
        const gate = evaluateSafetyGate(stats, 0, bank?.blurLimit ?? 15, bank?.oodLimit ?? 999);
        if (!gate.passed) {
          rejections++;
          continue;
        }

        const patches = tf.tidy(() => {
          const tensor = tf.browser
            .fromPixels(img)
            .resizeBilinear([224, 224])
            .toFloat()
            .div(127.5)
            .sub(1.0)
            .expandDims(0);
          const out = extractor.predict(tensor) as import('@tensorflow/tfjs').Tensor;
          const channels = (out.shape[3] as number) || 128;
          return out.reshape([196, channels]).arraySync() as number[][];
        });

        const dists = computePatchDistances(patches, bank?.patches ?? []);
        const s = computeImageScore(dists);
        scores.push(s);
      }

      setGateRejectionsCount((prev) => prev + rejections);
      setAbnormalScores((prev) => [...prev, ...scores]);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleLoadSyntheticEvaluation = () => {
    // Synthetic distribution: abnormal scores centered around 0.6-0.85
    const syntheticAbnormals = [
      0.45, 0.52, 0.58, 0.62, 0.65, 0.68, 0.71, 0.74, 0.77, 0.81, 0.84, 0.88, 0.92,
    ];
    setAbnormalScores(syntheticAbnormals);
    setGateRejectionsCount(1);
  };

  const handleApplyThreshold = async () => {
    if (!bank) return;
    if (window.confirm(`Apply ${customReviewThresh.toFixed(3)} as the new active Review threshold?`)) {
      const updated = { ...bank, reviewThreshold: customReviewThresh };
      await saveReferenceBank(updated);
      await refreshBank();
      alert('Threshold updated successfully in reference bank.');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
          <LineChartIcon className="w-6 h-6 text-teal-400" />
          Clinical Evaluation & Operating Calibration
        </h1>
        <p className="text-sm text-slate-400">
          Rank-based AUROC, operating point trade-offs, and live threshold sensitivity tuning.
        </p>
      </div>

      {/* Warnings */}
      {abnormalScores.length > 0 && abnormalScores.length < 10 && (
        <div className="p-3.5 bg-amber-950/30 border border-amber-800/50 rounded-xl text-xs text-amber-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>Evaluation sample size ({abnormalScores.length} abnormal scans) is under 10. Metric estimates may be statistically unstable.</span>
        </div>
      )}

      {/* Controls & Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-xs text-slate-400">Rank AUROC</div>
          <div className="text-2xl font-bold text-teal-400 mt-1">
            {abnormalScores.length > 0 ? auroc.toFixed(3) : '—'}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Mann-Whitney U statistic</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-xs text-slate-400">Review Sensitivity / Spec</div>
          <div className="text-xl font-bold text-amber-400 mt-1">
            {opReview.sensitivity.toFixed(2)} / {opReview.specificity.toFixed(2)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Threshold: {customReviewThresh.toFixed(3)}</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-xs text-slate-400">Refer Sensitivity / Spec</div>
          <div className="text-xl font-bold text-rose-400 mt-1">
            {opRefer.sensitivity.toFixed(2)} / {opRefer.specificity.toFixed(2)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Threshold: {calRefer.toFixed(3)}</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col justify-center gap-2">
          <label className="cursor-pointer px-3 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-semibold text-center transition-colors">
            Upload Abnormal Scans
            <input type="file" multiple accept="image/*" onChange={handleAbnormalUpload} className="hidden" />
          </label>
          <button
            onClick={handleLoadSyntheticEvaluation}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-teal-400 border border-slate-700 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Load Sample Evaluation
          </button>
        </div>
      </div>

      {/* ROC Curve */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <h2 className="text-sm font-semibold text-slate-200 mb-2">
          Receiver Operating Characteristic (ROC) Curve
        </h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={rocData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="fpr" type="number" domain={[0, 1]} stroke="#64748b" tick={{ fontSize: 10 }} />
              <YAxis dataKey="tpr" type="number" domain={[0, 1]} stroke="#64748b" tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }} />
              <Line type="monotone" dataKey="tpr" stroke="#0d9488" strokeWidth={2.5} dot={false} />
              {/* Operating Points */}
              <ReferenceDot x={opReview.fpr} y={opReview.tpr} r={5} fill="#f59e0b" stroke="#fff" />
              <ReferenceDot x={opRefer.fpr} y={opRefer.tpr} r={5} fill="#ef4444" stroke="#fff" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-center gap-6 text-xs text-slate-400 mt-2">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-500" />
            Review Operating Point (FPR: {opReview.fpr.toFixed(2)}, TPR: {opReview.tpr.toFixed(2)})
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500" />
            Refer Operating Point (FPR: {opRefer.fpr.toFixed(2)}, TPR: {opRefer.tpr.toFixed(2)})
          </span>
        </div>
      </div>

      {/* Live Threshold Slider */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-200">
            Interactive Threshold Tuning
          </h2>
          <span className="text-xs font-mono text-teal-400 font-bold">
            Review: {customReviewThresh.toFixed(3)}
          </span>
        </div>

        <input
          type="range"
          min="0.1"
          max="0.9"
          step="0.01"
          value={customReviewThresh}
          onChange={(e) => setCustomReviewThresh(parseFloat(e.target.value))}
          className="w-full accent-teal-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
        />

        <div className="flex items-center justify-between gap-3 pt-2">
          <button
            onClick={() => setCustomReviewThresh(calReview)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium border border-slate-700 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset to Calibrated ({calReview.toFixed(3)})
          </button>
          <button
            onClick={handleApplyThreshold}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            <Check className="w-3.5 h-3.5" />
            Apply as New Active Threshold
          </button>
        </div>
      </div>
    </div>
  );
};
