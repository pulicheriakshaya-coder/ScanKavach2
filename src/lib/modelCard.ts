/**
 * @file src/lib/modelCard.ts
 * @description Transparent documentation of intended use, prior work, calibration, SDGs, and limitations.
 */

import { ReferenceBank } from '../types';
import { SerializedClassifier } from './classifier';

export interface ModelCardData {
  intendedUse: string;
  notIntendedUse: string;
  referenceBankInfo: {
    totalNormals: number;
    patchesCount: number;
    reviewThreshold: number;
    referThreshold: number;
    blurLimit: number;
    oodLimit: number;
    createdAt: string;
  };
  conditionModelInfo?: {
    classes: string[];
    accuracy?: number;
    macroAuroc?: number;
    createdAt: string;
  };
  privacyStatement: string;
  sustainableDevelopmentGoals: {
    goal: string;
    description: string;
  }[];
  priorWorkNote: string;
}

/**
 * Builds dynamic Model Card specifications based on the active memory bank and classifier.
 */
export function generateModelCardData(
  bank?: ReferenceBank | null,
  classifier?: SerializedClassifier | null
): ModelCardData {
  return {
    intendedUse:
      'Decision support and screening assistance for qualified healthcare professionals. Flags unusual feature representations in medical imaging to assist triage and review.',
    notIntendedUse:
      'Autonomous diagnosis, consumer self-treatment, prescribing therapeutics or medications, or replacing clinical radiological examination.',
    referenceBankInfo: {
      totalNormals: bank?.totalNormals || 0,
      patchesCount: bank?.patches?.length || 0,
      reviewThreshold: Number((bank?.reviewThreshold || 0).toFixed(3)),
      referThreshold: Number((bank?.referThreshold || 0).toFixed(3)),
      blurLimit: Number((bank?.blurLimit || 15).toFixed(2)),
      oodLimit: Number((bank?.oodLimit || 10).toFixed(2)),
      createdAt: bank?.createdAt || 'Not yet calibrated',
    },
    conditionModelInfo: classifier
      ? {
          classes: classifier.classNames,
          accuracy: classifier.metrics?.accuracy,
          macroAuroc: classifier.metrics?.macroAuroc,
          createdAt: classifier.createdAt,
        }
      : undefined,
    privacyStatement:
      'ScanKavach executes strictly on-device in the browser using WebGL and CPU acceleration. Scans never leave the client device, preserving patient data confidentiality.',
    sustainableDevelopmentGoals: [
      {
        goal: 'SDG 3: Good Health & Well-Being',
        description:
          'Enhancing access to high-quality early screening for respiratory infections like pneumonia and tuberculosis in resource-limited primary health centers.',
      },
      {
        goal: 'SDG 9: Industry, Innovation & Infrastructure',
        description:
          'Deploying label-free anomaly screening on standard commodity browsers without requiring high-cost cloud computing or heavy GPU servers.',
      },
      {
        goal: 'SDG 10: Reduced Inequalities',
        description:
          'Bridging the diagnostic disparity between well-equipped urban medical centers and underserved rural clinics through offline-capable screening assistance.',
      },
    ],
    priorWorkNote:
      'Inspired by memory bank methods such as PatchCore (Roth et al., 2022), leveraging localized feature extraction from frozen representation backbones without requiring extensive labeled pathology datasets for initial screening.',
  };
}
