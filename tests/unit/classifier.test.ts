import { describe, it, expect } from 'vitest';
import {
  stratifiedSplit,
  computeClassWeights,
  predictProbabilities,
  SerializedClassifier,
  ClassDataItem,
} from '../../src/lib/classifier';

describe('Condition Classifier Unit Tests', () => {
  const mockItems: ClassDataItem[] = [
    { className: 'Normal', embedding: [1, 0, 0] },
    { className: 'Normal', embedding: [0.9, 0.1, 0] },
    { className: 'Normal', embedding: [0.8, 0.2, 0] },
    { className: 'Pneumonia', embedding: [0, 1, 0] },
    { className: 'Pneumonia', embedding: [0.1, 0.9, 0] },
    { className: 'Pneumonia', embedding: [0.2, 0.8, 0] },
  ];

  it('performs stratified train/test split with deterministic seed', () => {
    const { train, test } = stratifiedSplit(mockItems, 0.66, 42);
    expect(train.length).toBeGreaterThan(0);
    expect(test.length).toBeGreaterThan(0);
    expect(train.length + test.length).toBe(mockItems.length);
  });

  it('computes class weights to handle dataset class imbalance', () => {
    const weights = computeClassWeights(mockItems, ['Normal', 'Pneumonia']);
    expect(weights[0]).toBeCloseTo(1.0);
    expect(weights[1]).toBeCloseTo(1.0);
  });

  it('predicts probabilities using softmax weights and temperature scaling', () => {
    const mockModel: SerializedClassifier = {
      classNames: ['Normal', 'Pneumonia'],
      weights: [
        [2.0, -2.0],
        [-2.0, 2.0],
        [0.0, 0.0],
      ],
      biases: [0, 0],
      temperature: 1.0,
      seed: 42,
      createdAt: '2026-01-01',
    };

    const normalProbs = predictProbabilities([1, 0, 0], mockModel);
    expect(normalProbs['Normal']).toBeGreaterThan(normalProbs['Pneumonia']);

    const pneumoniaProbs = predictProbabilities([0, 1, 0], mockModel);
    expect(pneumoniaProbs['Pneumonia']).toBeGreaterThan(pneumoniaProbs['Normal']);
  });
});
