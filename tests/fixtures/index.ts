/**
 * @file tests/fixtures/index.ts
 * @description Deterministic fixture factories for test suites.
 */

import { ReferenceBank, HistoryItem } from '../../src/types';
import { SerializedClassifier, ClassDataItem } from '../../src/lib/classifier';

/**
 * Creates a simple deterministic pseudo-random generator with LCG algorithm.
 */
export function seededRandom(seed: number = 42): () => number {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

/**
 * Generates synthetic grayscale ImageData.
 */
export function makeGrayImageData(w: number = 224, h: number = 224, contrast: number = 0.2): ImageData {
  const data = new Uint8ClampedArray(w * h * 4);
  const rng = seededRandom(101);
  for (let i = 0; i < w * h; i++) {
    const val = Math.floor(128 + (rng() - 0.5) * 255 * contrast);
    data[i * 4] = val;
    data[i * 4 + 1] = val;
    data[i * 4 + 2] = val;
    data[i * 4 + 3] = 255;
  }
  return { width: w, height: h, data } as unknown as ImageData;
}

/**
 * Generates synthetic color ImageData (color diff > 12).
 */
export function makeColourImageData(w: number = 224, h: number = 224): ImageData {
  const data = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    data[i * 4] = 220; // Red
    data[i * 4 + 1] = 50;  // Green
    data[i * 4 + 2] = 50;  // Blue
    data[i * 4 + 3] = 255;
  }
  return { width: w, height: h, data } as unknown as ImageData;
}

/**
 * Generates synthetic blurred ImageData.
 */
export function makeBlurredImageData(w: number = 224, h: number = 224): ImageData {
  const data = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    data[i * 4] = 128;
    data[i * 4 + 1] = 128;
    data[i * 4 + 2] = 128;
    data[i * 4 + 3] = 255;
  }
  return { width: w, height: h, data } as unknown as ImageData;
}

/**
 * Generates a mock ReferenceBank object with calibrated thresholds.
 */
export function makeSyntheticBank(): ReferenceBank {
  const rng = seededRandom(202);
  const patches: number[][] = [];
  const patchImageIds: number[] = [];
  for (let i = 0; i < 200; i++) {
    patches.push(Array.from({ length: 128 }, () => rng() * 0.5));
    patchImageIds.push(Math.floor(i / 10));
  }

  const globalEmbeddings = Array.from({ length: 20 }, () =>
    Array.from({ length: 128 }, () => rng() * 0.4)
  );

  return {
    id: 'bank_test_fixture',
    name: 'Fixture Bank',
    createdAt: new Date().toISOString(),
    patches,
    patchImageIds,
    globalEmbeddings,
    thumbnails: ['data:image/jpeg;base64,mockthumb'],
    totalNormals: 20,
    reviewThreshold: 0.35,
    referThreshold: 0.65,
    patchThreshold: 0.42,
    blurLimit: 12.0,
    oodLimit: 8.5,
    validationStats: {
      meanContrast: 0.22,
      meanBlur: 28.5,
      sortedScores: [0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45],
      patchThreshold: 0.42,
      blurLimit: 12.0,
      oodLimit: 8.5,
    },
  };
}

/**
 * Generates synthetic validation scores array.
 */
export function makeValidationScores(): number[] {
  return [0.08, 0.12, 0.15, 0.19, 0.22, 0.26, 0.29, 0.33, 0.38, 0.42];
}

/**
 * Generates calibrated thresholds.
 */
export function makeThresholds(): { review: number; refer: number } {
  return { review: 0.35, refer: 0.65 };
}

/**
 * Generates sample HistoryItems array.
 */
export function makeHistory(): HistoryItem[] {
  return [
    {
      id: 'h1',
      timestamp: Date.now() - 100000,
      fileName: 'scan_01.png',
      verdict: 'Normal',
      isBorderline: false,
      percentile: 40,
      score: 0.18,
      gatePassed: true,
      shiftWarning: false,
      suggestedFinding: 'Healthy pattern',
      latencyMs: 310,
    },
    {
      id: 'h2',
      timestamp: Date.now() - 50000,
      fileName: 'scan_02.png',
      verdict: 'Review',
      isBorderline: true,
      percentile: 96,
      score: 0.38,
      gatePassed: true,
      shiftWarning: false,
      suggestedFinding: 'Pneumonia pattern',
      latencyMs: 340,
    },
  ];
}

/**
 * Generates sample data items for condition model training.
 */
export function makeClassifierData(): ClassDataItem[] {
  const items: ClassDataItem[] = [];
  const classes = ['Normal', 'Pneumonia', 'Tuberculosis'];
  for (const c of classes) {
    for (let i = 0; i < 30; i++) {
      const vec = new Array(128).fill(0).map(() => Math.random() * 0.2);
      vec[classes.indexOf(c) * 5] += 0.8;
      items.push({ className: c, embedding: vec });
    }
  }
  return items;
}
