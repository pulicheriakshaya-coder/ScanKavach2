/**
 * @file src/lib/classifier.ts
 * @description Supervised softmax head on pooled MobileNet features with calibration and evaluation.
 */

import {
  EPOCHS,
  LEARNING_RATE,
  TRAIN_SPLIT,
} from '../config';
import { getTf } from './tfLoader';
import { getStorageItem, setStorageItem } from './storage';

const MODEL_STORAGE_KEY = 'model';

export interface ClassDataItem {
  className: string;
  embedding: number[];
}

export interface TrainingProgress {
  epoch: number;
  loss: number;
  valLoss: number;
  valAcc: number;
}

export interface ModelMetrics {
  accuracy: number;
  macroAuroc: number;
  confusionMatrix: number[][];
  classNames: string[];
  perClassSensitivity: Record<string, number>;
  perClassSpecificity: Record<string, number>;
  isUnstableEstimate: boolean;
}

export interface SerializedClassifier {
  classNames: string[];
  weights: number[][]; // [inDim, numClasses]
  biases: number[];
  temperature: number;
  seed: number;
  metrics?: ModelMetrics;
  createdAt: string;
}

/**
 * Performs a seeded pseudo-random stratified train/test split.
 */
export function stratifiedSplit(
  items: ClassDataItem[],
  splitRatio: number = TRAIN_SPLIT,
  seed: number = 42
): { train: ClassDataItem[]; test: ClassDataItem[] } {
  // Simple seeded pseudo-random generator (LCG)
  let currentSeed = seed;
  const nextRandom = () => {
    currentSeed = (currentSeed * 9301 + 49297) % 233280;
    return currentSeed / 233280;
  };

  const groups: Record<string, ClassDataItem[]> = {};
  for (const item of items) {
    if (!groups[item.className]) groups[item.className] = [];
    groups[item.className].push(item);
  }

  const train: ClassDataItem[] = [];
  const test: ClassDataItem[] = [];

  for (const className in groups) {
    const list = [...groups[className]].sort(() => nextRandom() - 0.5);
    const splitIndex = Math.max(1, Math.floor(list.length * splitRatio));
    train.push(...list.slice(0, splitIndex));
    test.push(...list.slice(splitIndex));
  }

  return { train, test };
}

/**
 * Computes class weights inversely proportional to class frequencies.
 */
export function computeClassWeights(items: ClassDataItem[], classNames: string[]): number[] {
  const counts = classNames.map((c) => items.filter((i) => i.className === c).length);
  const total = items.length || 1;
  const nClasses = classNames.length;
  return counts.map((count) => (count > 0 ? total / (nClasses * count) : 1.0));
}

/**
 * Predicts class probabilities for an embedding vector using serialized weights.
 */
export function predictProbabilities(
  embedding: number[],
  model: SerializedClassifier
): Record<string, number> {
  const { classNames, weights, biases, temperature } = model;
  const numClasses = classNames.length;
  const logits = new Array(numClasses).fill(0);

  for (let c = 0; c < numClasses; c++) {
    let sum = biases[c] || 0;
    for (let f = 0; f < embedding.length; f++) {
      sum += embedding[f] * (weights[f]?.[c] || 0);
    }
    logits[c] = sum / (temperature || 1.0);
  }

  // Softmax with numerical stability
  const maxLogit = Math.max(...logits);
  const expScores = logits.map((l) => Math.exp(l - maxLogit));
  const expSum = expScores.reduce((a, b) => a + b, 0) || 1.0;

  const result: Record<string, number> = {};
  classNames.forEach((name, i) => {
    result[name] = Number((expScores[i] / expSum).toFixed(4));
  });

  return result;
}

/**
 * Trains the linear softmax classifier head in tf.js with early stopping and progress reporting.
 */
export async function trainSoftmaxClassifier(
  trainItems: ClassDataItem[],
  testItems: ClassDataItem[],
  classNames: string[],
  seed: number,
  onEpochEnd?: (p: TrainingProgress) => void
): Promise<SerializedClassifier> {
  const tf = await getTf();
  const inDim = trainItems[0]?.embedding.length || 128;
  const numClasses = classNames.length;

  const xTrain = tf.tensor2d(trainItems.map((i) => i.embedding));
  const yTrain = tf.tensor2d(
    trainItems.map((i) => {
      const idx = classNames.indexOf(i.className);
      const row = new Array(numClasses).fill(0);
      row[idx] = 1;
      return row;
    })
  );

  const xVal = tf.tensor2d(testItems.map((i) => i.embedding));
  const yVal = tf.tensor2d(
    testItems.map((i) => {
      const idx = classNames.indexOf(i.className);
      const row = new Array(numClasses).fill(0);
      row[idx] = 1;
      return row;
    })
  );

  const head = tf.sequential();
  head.add(
    tf.layers.dense({
      units: numClasses,
      activation: 'softmax',
      inputShape: [inDim],
      kernelRegularizer: tf.regularizers.l2({ l2: 0.001 }),
    })
  );

  const optimizer = tf.train.adam(LEARNING_RATE);
  head.compile({
    optimizer,
    loss: 'categoricalCrossentropy',
    metrics: ['accuracy'],
  });

  await head.fit(xTrain, yTrain, {
    epochs: EPOCHS,
    validationData: [xVal, yVal],
    callbacks: {
      onEpochEnd: async (epoch, logs) => {
        onEpochEnd?.({
          epoch: epoch + 1,
          loss: logs?.loss || 0,
          valLoss: logs?.val_loss || 0,
          valAcc: logs?.val_acc || logs?.val_accuracy || 0,
        });
        await tf.nextFrame();
      },
    },
  });

  const weights = (await (head.layers[0].getWeights()[0].array())) as number[][];
  const biases = (await (head.layers[0].getWeights()[1].array())) as number[];

  xTrain.dispose();
  yTrain.dispose();
  xVal.dispose();
  yVal.dispose();
  head.dispose();

  const classifier: SerializedClassifier = {
    classNames,
    weights,
    biases,
    temperature: 1.0,
    seed,
    createdAt: new Date().toISOString(),
  };

  return classifier;
}

/**
 * Saves classifier model to IndexedDB.
 */
export async function saveClassifierModel(model: SerializedClassifier): Promise<void> {
  await setStorageItem(MODEL_STORAGE_KEY, model);
}

/**
 * Loads classifier model from IndexedDB.
 */
export async function loadClassifierModel(): Promise<SerializedClassifier | null> {
  return await getStorageItem<SerializedClassifier>(MODEL_STORAGE_KEY);
}
