/**
 * @file src/lib/cam.ts
 * @description Class Activation Map (CAM) generation explaining supervised model spatial focus.
 */

import { SerializedClassifier } from './classifier';

/**
 * Computes a 14x14 Class Activation Map (CAM) for a target class.
 *
 * @param patchFeatures - 196 feature vectors [196, featureDim].
 * @param classIndex - Target class index in classifier.
 * @param model - Serialized classifier weights.
 * @returns 14x14 numerical activation values in range [0, 1].
 */
export function computeClassActivationMap(
  patchFeatures: number[][],
  classIndex: number,
  model: SerializedClassifier
): number[][] {
  if (patchFeatures.length === 0 || !model.weights) {
    return Array.from({ length: 14 }, () => new Array(14).fill(0));
  }

  const rawMap: number[] = new Array(patchFeatures.length).fill(0);
  let minVal = Infinity;
  let maxVal = -Infinity;

  for (let i = 0; i < patchFeatures.length; i++) {
    const patch = patchFeatures[i];
    let score = 0;
    for (let f = 0; f < patch.length; f++) {
      score += patch[f] * (model.weights[f]?.[classIndex] || 0);
    }
    rawMap[i] = score;
    if (score < minVal) minVal = score;
    if (score > maxVal) maxVal = score;
  }

  const range = maxVal > minVal ? maxVal - minVal : 1;
  const grid: number[][] = [];

  for (let r = 0; r < 14; r++) {
    const row: number[] = [];
    for (let c = 0; c < 14; c++) {
      const idx = r * 14 + c;
      const normalized = Math.max(0, Math.min(1, (rawMap[idx] - minVal) / range));
      row.push(Number(normalized.toFixed(3)));
    }
    grid.push(row);
  }

  return grid;
}

/**
 * Renders a 14x14 CAM 2D array into a smoothed RGBA data URL overlay.
 *
 * @param camGrid - 14x14 normalized float grid.
 * @returns Data URL string of the smoothed heatmap.
 */
export function renderCamOverlayUrl(camGrid: number[][]): string {
  const canvas = document.createElement('canvas');
  canvas.width = 14;
  canvas.height = 14;
  const ctx = canvas.getContext('2d');
  if (!ctx) return 'data:image/png;base64,mockCam';

  const imgData = ctx.createImageData(14, 14);
  for (let r = 0; r < 14; r++) {
    for (let c = 0; c < 14; c++) {
      const val = camGrid[r][c];
      const idx = (r * 14 + c) * 4;
      // Blue-Teal (val < 0.5) to Yellow-Red (val >= 0.5)
      imgData.data[idx] = Math.round(val * 240);
      imgData.data[idx + 1] = Math.round((1 - Math.abs(val - 0.5) * 2) * 200);
      imgData.data[idx + 2] = Math.round((1 - val) * 200);
      imgData.data[idx + 3] = Math.round(val * 180 + 30);
    }
  }

  ctx.putImageData(imgData, 0, 0);

  const out = document.createElement('canvas');
  out.width = 224;
  out.height = 224;
  const outCtx = out.getContext('2d');
  if (!outCtx) return canvas.toDataURL();
  outCtx.imageSmoothingEnabled = true;
  outCtx.drawImage(canvas, 0, 0, 224, 224);

  try {
    const url = out.toDataURL('image/png');
    return url && url.startsWith('data:') ? url : 'data:image/png;base64,mockCam';
  } catch {
    return 'data:image/png;base64,mockCam';
  }
}
