/**
 * @file src/pages/ModelCardPage.tsx
 * @description Transparent Model Card documentation reflecting active memory bank calibrations and SDGs.
 */

import React from 'react';
import { FileBadge, ShieldCheck, Globe, Cpu, AlertTriangle } from 'lucide-react';
import { generateModelCardData } from '../lib/modelCard';
import { useApp } from '../context/AppContext';

export const ModelCardPage: React.FC = () => {
  const { bank, classifier } = useApp();
  const cardData = generateModelCardData(bank, classifier);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
          <FileBadge className="w-6 h-6 text-teal-400" />
          ScanKavach Model Card & AI Governance
        </h1>
        <p className="text-sm text-slate-400">
          Transparent model specification, calibration details, safety boundaries, and SDG alignments.
        </p>
      </div>

      {/* Intended vs Not-Intended Use */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2">
          <h2 className="text-xs font-bold text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" /> Intended Clinical Use
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            {cardData.intendedUse}
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2">
          <h2 className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4" /> Prohibited &amp; Out-of-Scope Use
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            {cardData.notIntendedUse}
          </p>
        </div>
      </div>

      {/* Reference Bank Calibration */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <Cpu className="w-4 h-4 text-teal-400" />
          Active Calibration &amp; Hyperparameters
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
          <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/60">
            <div className="text-slate-400">Normal Scans</div>
            <div className="text-base font-bold text-slate-100 mt-1">
              {cardData.referenceBankInfo.totalNormals}
            </div>
          </div>
          <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/60">
            <div className="text-slate-400">Review (95th%)</div>
            <div className="text-base font-bold text-amber-400 mt-1">
              {cardData.referenceBankInfo.reviewThreshold}
            </div>
          </div>
          <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/60">
            <div className="text-slate-400">Refer (99th%)</div>
            <div className="text-base font-bold text-rose-400 mt-1">
              {cardData.referenceBankInfo.referThreshold}
            </div>
          </div>
          <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/60">
            <div className="text-slate-400">Blur Limit</div>
            <div className="text-base font-bold text-slate-200 mt-1">
              {cardData.referenceBankInfo.blurLimit}
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-400">
          Thresholds are calibrated non-parametrically from the 95th and 99th percentiles of held-out healthy validation images. By design, approximately 5% of healthy scans fall into the Review category to preserve sensitivity.
        </p>
      </div>

      {/* Sustainable Development Goals (SDGs) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <Globe className="w-4 h-4 text-teal-400" />
          United Nations Sustainable Development Goals
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {cardData.sustainableDevelopmentGoals.map((sdg, idx) => (
            <div key={idx} className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-4 space-y-1.5">
              <span className="text-xs font-bold text-teal-300 block">{sdg.goal}</span>
              <p className="text-[11px] text-slate-400 leading-relaxed">{sdg.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Prior Work & Privacy */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
        <h2 className="text-sm font-semibold text-slate-200">Scientific Lineage &amp; Privacy</h2>
        <p className="text-xs text-slate-300 leading-relaxed">
          {cardData.priorWorkNote}
        </p>
        <p className="text-xs text-slate-400 leading-relaxed">
          {cardData.privacyStatement}
        </p>
      </div>
    </div>
  );
};
