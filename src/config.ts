/**
 * @file src/config.ts
 * @description Centralized configuration parameters and tuning constants for ScanKavach.
 */

export const IMG_SIZE = 224;
export const MAX_BANK_PATCHES = 8000;
export const BANK_FRACTION = 0.7;
export const REVIEW_PERCENTILE = 95;
export const REFER_PERCENTILE = 99;
export const BORDERLINE_MARGIN = 0.05;
export const MAX_THUMBNAILS = 100;
export const THUMB_SIZE = 128;
export const TOPK_PATCHES = 3;
export const MIN_NORMALS = 20;
export const RECOMMENDED_NORMALS = 60;
export const OOD_MARGIN = 1.5;
export const COLOR_DIFF_LIMIT = 12;
export const DEFAULT_BLUR_LIMIT = 15;
export const MIN_CONTRAST_STD = 0.05;
export const MAX_UPLOAD_MB = 15;
export const HISTORY_LIMIT = 500;
export const BATCH_LIMIT = 50;
export const CLASS_MIN_IMAGES = 30;
export const CLASS_RECOMMENDED_IMAGES = 200;
export const TRAIN_SPLIT = 0.8;
export const EPOCHS = 80;
export const LEARNING_RATE = 0.01;
export const MIN_CONFIDENCE = 0.6;
export const HIGH_CONFIDENCE = 0.85;
export const DISAGREEMENT_PROB = 0.7;
export const GEMINI_MODEL = 'gemini-2.5-flash';

export const APP_NAME = 'ScanKavach';
export const APP_SLOGAN = 'Your shield for safer medical image screening';
export const STORAGE_PREFIX = 'scankavach_';
export const SESSION_DURATION_HOURS = 8;
export const MAX_LOGIN_ATTEMPTS = 5;
export const LOGIN_LOCKOUT_SECONDS = 30;

export const MOBILENET_MODEL_URL =
  'https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v1_0.25_224/model.json';
export const TARGET_EXTRACTOR_LAYER = 'conv_pw_11_relu';
