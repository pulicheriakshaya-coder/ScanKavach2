/**
 * @file src/components/analyze/VerdictBadge.tsx
 * @description Standardized clinical verdict badge with color coding and accessibility labels.
 */

import React from 'react';
import { CheckCircle2, AlertTriangle, AlertOctagon } from 'lucide-react';
import { AnomalyVerdict } from '../../types';

interface VerdictBadgeProps {
  verdict: AnomalyVerdict;
  isBorderline?: boolean;
}

export const VerdictBadge: React.FC<VerdictBadgeProps> = ({ verdict, isBorderline }) => {
  if (verdict === 'Normal') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-teal-950/80 text-teal-300 border border-teal-700/60">
        <CheckCircle2 className="w-3.5 h-3.5" />
        Normal {isBorderline ? '(Borderline)' : ''}
      </span>
    );
  }

  if (verdict === 'Review') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-950/80 text-amber-300 border border-amber-700/60">
        <AlertTriangle className="w-3.5 h-3.5" />
        Review {isBorderline ? '(Borderline: Needs Human Review)' : ''}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-950/80 text-rose-300 border border-rose-700/60">
      <AlertOctagon className="w-3.5 h-3.5" />
      Refer {isBorderline ? '(Borderline)' : ''}
    </span>
  );
};
