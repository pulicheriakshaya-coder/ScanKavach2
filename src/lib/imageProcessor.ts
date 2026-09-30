/**
 * @file src/lib/imageProcessor.ts
 * @description Safe client-side image preprocessing, canvas re-draw, contrast and blur calculation.
 */

import {
  IMG_SIZE,
  MAX_UPLOAD_MB,
  THUMB_SIZE,
} from '../config';

export interface ImageDataStats {
  contrastStd: number;
  blurVariance: number;
  colorDiff: number;
  meanIntensity: number;
}

/**
 * Validates a file against allowed MIME types and maximum upload size.
 * @param file - Uploaded File object.
 */
export function validateImageFile(file: File): void {
  const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
  if (!allowed.includes(file.type.toLowerCase())) {
    throw new Error('Invalid image format. Allowed formats: PNG, JPG, JPEG, WEBP.');
  }
  const maxBytes = MAX_UPLOAD_MB * 1024 * 1024;
  if (file.size > maxBytes) {
    throw new Error(`File size exceeds maximum allowed limit of ${MAX_UPLOAD_MB} MB.`);
  }
}

/**
 * Reads a File into an HTMLImageElement safely.
 * @param file - Image file.
 */
export function loadImageElement(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image. The file may be corrupt.'));
    };
    img.src = url;
  });
}

/**
 * Strips EXIF/metadata and returns an ImageData object resized to target dimensions.
 * @param img - Source HTMLImageElement.
 * @param width - Target width.
 * @param height - Target height.
 */
export function drawToCanvasImageData(
  img: HTMLImageElement,
  width: number = IMG_SIZE,
  height: number = IMG_SIZE
): ImageData {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Canvas 2D context not available.');
  ctx.drawImage(img, 0, 0, width, height);
  return ctx.getImageData(0, 0, width, height);
}

/**
 * Generates a base64 thumbnail string for storage.
 * @param img - Source image.
 */
export function generateThumbnailDataUrl(img: HTMLImageElement): string {
  const canvas = document.createElement('canvas');
  canvas.width = THUMB_SIZE;
  canvas.height = THUMB_SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  ctx.drawImage(img, 0, 0, THUMB_SIZE, THUMB_SIZE);
  return canvas.toDataURL('image/jpeg', 0.8);
}

/**
 * Computes contrast std, Laplacian blur variance, and color divergence from ImageData.
 * @param data - ImageData from canvas.
 */
export function computeImageStatistics(data: ImageData): ImageDataStats {
  const pixels = data.data;
  const totalPixels = data.width * data.height;
  const gray = new Float32Array(totalPixels);
  let totalColorDiff = 0;
  let sumLuma = 0;

  for (let i = 0; i < totalPixels; i++) {
    const r = pixels[i * 4];
    const g = pixels[i * 4 + 1];
    const b = pixels[i * 4 + 2];
    totalColorDiff += Math.abs(r - g) + Math.abs(g - b) + Math.abs(b - r);

    // Standard Rec. 601 luma scaled to [0, 1]
    const luma = (0.299 * r + 0.587 * g + 0.114 * b) / 255.0;
    gray[i] = luma;
    sumLuma += luma;
  }

  const meanIntensity = sumLuma / totalPixels;
  let varSum = 0;
  for (let i = 0; i < totalPixels; i++) {
    const diff = gray[i] - meanIntensity;
    varSum += diff * diff;
  }
  const contrastStd = Math.sqrt(varSum / totalPixels);
  const colorDiff = totalColorDiff / totalPixels;

  // Discrete Laplacian 3x3 kernel convolution variance for blur detection
  const blurVariance = computeLaplacianVariance(gray, data.width, data.height);

  return { contrastStd, blurVariance, colorDiff, meanIntensity };
}

/**
 * Computes variance of Laplacian operator over a 2D grayscale float array.
 */
function computeLaplacianVariance(
  gray: Float32Array,
  w: number,
  h: number
): number {
  let lapSum = 0;
  let lapSumSq = 0;
  let count = 0;

  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = y * w + x;
      // Discrete Laplacian: 4 * center - neighbors
      const lap =
        4 * gray[idx] -
        gray[idx - 1] -
        gray[idx + 1] -
        gray[idx - w] -
        gray[idx + w];
      lapSum += lap;
      lapSumSq += lap * lap;
      count += 1;
    }
  }

  if (count === 0) return 0;
  const mean = lapSum / count;
  const variance = lapSumSq / count - mean * mean;
  return variance * 1000.0; // scale for stability
}
