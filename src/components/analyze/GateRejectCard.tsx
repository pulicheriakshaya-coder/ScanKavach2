/**
 * @file src/components/analyze/GateRejectCard.tsx
 * @description Safety gate failure card explaining why a scan was stopped before scoring.
 */

import React from 'react';
import { ShieldAlert, RefreshCw } from 'lucide-react';
import { GateCheckResult } from '../../types';

interface GateRejectCardProps {
  gateResult: GateCheckResult;
  onRetry: () => void;
}

export const GateRejectCard: React.FC<GateRejectCardProps> = ({ gateResult, onRetry }) => {
  return (
    <div className="bg-rose-950/20 border border-rose-800/60 rounded-2xl p-6 text-slate-200 space-y-4 shadow-xl">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center flex-shrink-0">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-rose-300">Safety Gate Rejection</h2>
          <p className="text-xs text-rose-400/80">Scan did not meet safety and quality thresholds.</p>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-slate-900/90 border border-rose-900/40 text-sm">
        <p className="font-semibold text-rose-200 mb-1">Reason for Rejection:</p>
        <p className="text-rose-300">{gateResult.reason}</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
        <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
          <div className="text-slate-400">Color Diff</div>
          <div className="font-mono font-semibold text-slate-200 mt-0.5">
            {gateResult.colorDiff.toFixed(1)} (limit 12)
          </div>
        </div>
        <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
          <div className="text-slate-400">Contrast Std</div>
          <div className="font-mono font-semibold text-slate-200 mt-0.5">
            {gateResult.contrastStd.toFixed(3)} (min 0.05)
          </div>
        </div>
        <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
          <div className="text-slate-400">Blur Var</div>
          <div className="font-mono font-semibold text-slate-200 mt-0.5">
            {gateResult.blurVariance.toFixed(1)}
          </div>
        </div>
        <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
          <div className="text-slate-400">OOD Dist</div>
          <div className="font-mono font-semibold text-slate-200 mt-0.5">
            {gateResult.embeddingDistance.toFixed(2)}
          </div>
        </div>
      </div>

      <p className="text-xs text-slate-400">
        Per clinical safety guidelines, no anomaly score, verdict, or finding suggestion is computed when the safety gate fails.
      </p>

      <button
        onClick={onRetry}
        className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        Analyze Another Scan
      </button>
    </div>
  );
};
