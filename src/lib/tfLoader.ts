/**
 * @file src/lib/tfLoader.ts
 * @description Lazy TensorFlow.js initialization and MobileNet feature extractor manager.
 */

import {
  IMG_SIZE,
  MOBILENET_MODEL_URL,
  TARGET_EXTRACTOR_LAYER,
} from '../config';

let tfInstance: typeof import('@tensorflow/tfjs') | null = null;
let featureExtractorModel: import('@tensorflow/tfjs').LayersModel | null = null;
let isInitializing = false;
let initPromise: Promise<typeof import('@tensorflow/tfjs')> | null = null;

/**
 * Lazily loads TensorFlow.js runtime and initializes WebGL with CPU fallback.
 * @returns TensorFlow namespace.
 */
export async function getTf(): Promise<typeof import('@tensorflow/tfjs')> {
  if (tfInstance) return tfInstance;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    isInitializing = true;
    try {
      const tf = await import('@tensorflow/tfjs');
      try {
        await tf.setBackend('webgl');
        await tf.ready();
      } catch {
        await tf.setBackend('cpu');
        await tf.ready();
      }
      tfInstance = tf;
      return tf;
    } finally {
      isInitializing = false;
    }
  })();

  return initPromise;
}

/**
 * Identifies the target layer for 14x14 spatial feature extraction.
 * @param model - Loaded full MobileNet model.
 * @returns Layer name string.
 */
function findExtractorLayer(model: import('@tensorflow/tfjs').LayersModel): string {
  try {
    const direct = model.getLayer(TARGET_EXTRACTOR_LAYER);
    if (direct) return TARGET_EXTRACTOR_LAYER;
  } catch {
    // Search backward for 14x14 output shape
  }

  for (let i = model.layers.length - 1; i >= 0; i--) {
    const layer = model.layers[i];
    const shape = layer.outputShape as (number | null)[];
    if (Array.isArray(shape) && shape.length === 4) {
      if (shape[1] === 14 && shape[2] === 14) {
        return layer.name;
      }
    }
  }

  throw new Error('Could not find layer with 14x14 spatial patch output in model.');
}

/**
 * Loads the frozen MobileNet feature extractor and warms it up with dummy tensor.
 * @param onProgress - Optional loading progress callback.
 * @returns LayersModel instance.
 */
export async function loadFeatureExtractor(
  onProgress?: (fraction: number) => void
): Promise<import('@tensorflow/tfjs').LayersModel> {
  if (featureExtractorModel) return featureExtractorModel;

  const tf = await getTf();
  const baseModel = await tf.loadLayersModel(MOBILENET_MODEL_URL, {
    onProgress: (p) => onProgress?.(p),
  });

  const targetLayerName = findExtractorLayer(baseModel);
  const targetLayer = baseModel.getLayer(targetLayerName);

  const extractor = tf.model({
    inputs: baseModel.inputs,
    outputs: targetLayer.output,
  });

  // Warmup once
  tf.tidy(() => {
    const dummy = tf.zeros([1, IMG_SIZE, IMG_SIZE, 3]);
    extractor.predict(dummy);
  });

  featureExtractorModel = extractor;
  return featureExtractorModel;
}

/**
 * Returns current status of TensorFlow and model in memory.
 */
export function getModelStatus(): {
  isTfLoaded: boolean;
  isModelReady: boolean;
  backend: string;
} {
  return {
    isTfLoaded: tfInstance !== null,
    isModelReady: featureExtractorModel !== null,
    backend: tfInstance ? tfInstance.getBackend() : 'not loaded',
  };
}
