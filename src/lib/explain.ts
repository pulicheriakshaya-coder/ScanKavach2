/**
 * @file src/lib/explain.ts
 * @description Generates visual heatmaps and grid-based explanation sentences without anatomical claims.
 */

const GRID_ROWS = ['top', 'middle', 'lower'];
const GRID_COLS = ['left', 'center', 'right'];

/**
 * Maps 14x14 spatial patch indices into 3x3 general image sectors.
 * Always refers to "of the image", never anatomical regions.
 *
 * @param maxPatchIndex - Spatial index (0..195) of the highest anomaly patch.
 * @returns General grid sector name (e.g., "lower right of the image").
 */
export function getSectorName(maxPatchIndex: number): string {
  const row14 = Math.floor(maxPatchIndex / 14);
  const col14 = maxPatchIndex % 14;

  const row3 = Math.min(2, Math.floor((row14 / 14) * 3));
  const col3 = Math.min(2, Math.floor((col14 / 14) * 3));

  const rowLabel = GRID_ROWS[row3];
  const colLabel = GRID_COLS[col3];

  if (rowLabel === 'middle' && colLabel === 'center') {
    return 'center of the image';
  }
  return `${rowLabel} ${colLabel} of the image`;
}

/**
 * Generates an objective, safety-compliant explanation sentence for the anomaly heatmap.
 *
 * @param patchDistances - 196 patch distance scores.
 * @param patchThreshold - 99th percentile patch threshold from calibration.
 * @param isNormal - Whether the scan was classified as Normal.
 * @returns Safety-compliant explanation sentence.
 */
export function generateExplanationSentence(
  patchDistances: number[],
  patchThreshold: number,
  isNormal: boolean
): string {
  if (isNormal || patchDistances.length === 0) {
    return 'No region stands out from the healthy reference set.';
  }

  let highCount = 0;
  let maxVal = -Infinity;
  let maxIdx = 0;

  for (let i = 0; i < patchDistances.length; i++) {
    const val = patchDistances[i];
    if (val > patchThreshold) highCount++;
    if (val > maxVal) {
      maxVal = val;
      maxIdx = i;
    }
  }

  if (highCount === 0) {
    return 'No region stands out from the healthy reference set.';
  }

  const areaPercent = Math.round((highCount / patchDistances.length) * 100);
  const sector = getSectorName(maxIdx);

  return `Unusual pattern in the ${sector}, about ${areaPercent}% of the area. Not a diagnosis.`;
}

/**
 * Interpolates an anomaly intensity [0, 1] into an RGBA color.
 */
function intensityToRgba(t: number): [number, number, number, number] {
  const clamped = Math.max(0, Math.min(1, t));
  // Teal (13, 148, 136) -> Amber (245, 158, 11) -> Red (239, 68, 68)
  if (clamped < 0.5) {
    const factor = clamped * 2;
    return [
      Math.round(13 + (245 - 13) * factor),
      Math.round(148 + (158 - 148) * factor),
      Math.round(136 + (11 - 136) * factor),
      Math.round(120 * factor + 30),
    ];
  }
  const factor = (clamped - 0.5) * 2;
  return [
    Math.round(245 + (239 - 245) * factor),
    Math.round(158 + (68 - 158) * factor),
    Math.round(11 + (68 - 11) * factor),
    Math.round(150 + 75 * factor),
  ];
}

/**
 * Creates an image data URL representing the 224x224 interpolated heatmap.
 *
 * @param patchDistances - 196 patch scores for 14x14 grid.
 * @param minVal - Minimum scale distance.
 * @param maxVal - Maximum scale distance.
 */
export function renderHeatmapDataUrl(
  patchDistances: number[],
  minVal: number,
  maxVal: number
): string {
  const canvas = document.createElement('canvas');
  canvas.width = 14;
  canvas.height = 14;
  const ctx = canvas.getContext('2d');
  if (!ctx) return 'data:image/png;base64,mockHeatmap';

  const imgData = ctx.createImageData(14, 14);
  const range = maxVal > minVal ? maxVal - minVal : 1;

  for (let i = 0; i < 196; i++) {
    const norm = (patchDistances[i] - minVal) / range;
    const [r, g, b, a] = intensityToRgba(norm);
    imgData.data[i * 4] = r;
    imgData.data[i * 4 + 1] = g;
    imgData.data[i * 4 + 2] = b;
    imgData.data[i * 4 + 3] = a;
  }

  ctx.putImageData(imgData, 0, 0);

  // Upscale smooth to 224x224
  const outCanvas = document.createElement('canvas');
  outCanvas.width = 224;
  outCanvas.height = 224;
  const outCtx = outCanvas.getContext('2d');
  if (!outCtx) return canvas.toDataURL();
  outCtx.imageSmoothingEnabled = true;
  outCtx.drawImage(canvas, 0, 0, 224, 224);
  try {
    const url = outCanvas.toDataURL('image/png');
    return url && url.startsWith('data:') ? url : 'data:image/png;base64,mockHeatmap';
  } catch {
    return 'data:image/png;base64,mockHeatmap';
  }
}
