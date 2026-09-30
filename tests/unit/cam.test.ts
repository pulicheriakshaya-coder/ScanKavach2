import { describe, it, expect } from 'vitest';
import { computeClassActivationMap, renderCamOverlayUrl } from '../../src/lib/cam';
import { SerializedClassifier } from '../../src/lib/classifier';

describe('Class Activation Map (CAM) Unit Tests', () => {
  const mockClassifier: SerializedClassifier = {
    classNames: ['Normal', 'Pneumonia'],
    weights: [
      [1.0, -1.0],
      [-1.0, 1.0],
    ],
    biases: [0, 0],
    temperature: 1.0,
    seed: 42,
    createdAt: '2026-01-01',
  };

  it('computes 14x14 normalized activation map for specified class', () => {
    const patches = Array.from({ length: 196 }, (_, i) => [i / 196, (196 - i) / 196]);
    const cam = computeClassActivationMap(patches, 1, mockClassifier);

    expect(cam.length).toBe(14);
    expect(cam[0].length).toBe(14);
    expect(cam[0][0]).toBeGreaterThanOrEqual(0);
    expect(cam[0][0]).toBeLessThanOrEqual(1);
  });

  it('renders CAM overlay data URL with canvas without throwing', () => {
    const grid = Array.from({ length: 14 }, () => new Array(14).fill(0.5));
    const url = renderCamOverlayUrl(grid);
    expect(url).toContain('data:image/png;base64');
  });

  it('handles empty patches gracefully', () => {
    const cam = computeClassActivationMap([], 0, mockClassifier);
    expect(cam.length).toBe(14);
    expect(cam[0][0]).toBe(0);
  });
});
