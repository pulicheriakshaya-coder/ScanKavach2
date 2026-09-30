/**
 * @file src/types/index.ts
 * @description Core TypeScript domain types for ScanKavach.
 */

export type UserRole = 'Clinician' | 'Radiology Technician' | 'Student/Researcher';

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  saltHex: string;
  hashHex: string;
  createdAt: number;
}

export interface UserSession {
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
  };
  expiresAt: number;
  token: string;
}

export interface GateCheckResult {
  passed: boolean;
  reason?: string;
  colorDiff: number;
  contrastStd: number;
  blurVariance: number;
  embeddingDistance: number;
}

export type AnomalyVerdict = 'Normal' | 'Review' | 'Refer';

export interface VerdictResult {
  verdict: AnomalyVerdict;
  isBorderline: boolean;
  percentile: number;
  explanation: string;
  message: string;
}

export interface ShiftResult {
  isShift: boolean;
  highPatchFraction: number;
  message?: string;
}

export type FusionVerdict =
  | 'Consistent-normal'
  | 'Suggested-condition'
  | 'Conflict'
  | 'Inconclusive';

export interface FusionResult {
  fusionVerdict: FusionVerdict;
  topClass: string;
  confidence: number;
  isHighConfidence: boolean;
  message: string;
  disclaimer: string;
  probabilities: Record<string, number>;
  camHeatmap?: number[][];
}

export interface ValidationStats {
  meanContrast: number;
  meanBlur: number;
  sortedScores: number[];
  patchThreshold: number;
  blurLimit: number;
  oodLimit: number;
}

export interface ReferenceBank {
  id: string;
  name: string;
  createdAt: string;
  patches: number[][]; // flattened or array of float arrays
  patchImageIds: number[];
  globalEmbeddings: number[][];
  thumbnails: string[];
  validationStats: ValidationStats;
  reviewThreshold: number;
  referThreshold: number;
  patchThreshold: number;
  blurLimit: number;
  oodLimit: number;
  totalNormals: number;
}

export interface AnalysisStageTiming {
  metadataMs: number;
  gateMs: number;
  inferenceMs: number;
  scoringMs: number;
  verdictMs: number;
  totalMs: number;
}

export interface AnalysisResult {
  id: string;
  timestamp: number;
  fileName: string;
  gateResult: GateCheckResult;
  score?: number;
  verdict?: VerdictResult;
  shift?: ShiftResult;
  fusion?: FusionResult;
  timings: AnalysisStageTiming;
  nearestHealthyThumbnail?: string;
  heatmapDataUrl?: string;
  processedImagePreviewUrl?: string;
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  fileName: string;
  verdict: AnomalyVerdict;
  isBorderline: boolean;
  percentile: number;
  score: number;
  gatePassed: boolean;
  gateReason?: string;
  shiftWarning: boolean;
  suggestedFinding?: string;
  latencyMs: number;
}

export interface AuditLogEntry {
  id: string;
  timestamp: number;
  userEmail: string;
  action: string;
  details: string;
}

export type Language = 'en' | 'te' | 'hi';
