import { describe, it, expect } from 'vitest';
import {
  getSectorName,
  generateExplanationSentence,
  renderHeatmapDataUrl,
} from '../../src/lib/explain';

describe('Explanation & Heatmap Unit Tests', () => {
  it('maps spatial patch index to 3x3 general image sector without anatomical claims', () => {
    // Top-left: index 0
    expect(getSectorName(0)).toBe('top left of the image');
    // Center: row 7, col 7 -> index 7*14 + 7 = 105
    expect(getSectorName(105)).toBe('center of the image');
    // Lower-right: row 13, col 13 -> 195
    expect(getSectorName(195)).toBe('lower right of the image');
  });

  it('generates safety-compliant sentence referencing image sector and area percentage', () => {
    const patchDists = new Array(196).fill(0.1);
    // Patches in lower right exceed threshold 0.5, with peak at 195
    for (let i = 180; i < 196; i++) {
      patchDists[i] = 0.8;
    }
    patchDists[195] = 0.99;

    const sentence = generateExplanationSentence(patchDists, 0.5, false);
    expect(sentence).toContain('lower right of the image');
    expect(sentence).toContain('about 8% of the area');
    expect(sentence).toContain('Not a diagnosis.');
    expect(sentence.toLowerCase()).not.toContain('lung');
  });

  it('returns baseline message when scan is normal or no patch exceeds threshold', () => {
    const normalSentence = generateExplanationSentence([0.1, 0.2], 0.5, true);
    expect(normalSentence).toBe('No region stands out from the healthy reference set.');

    const lowAnomalySentence = generateExplanationSentence([0.1, 0.2], 0.5, false);
    expect(lowAnomalySentence).toBe('No region stands out from the healthy reference set.');
  });

  it('renders heatmap data URL with canvas without throwing', () => {
    const patchDists = new Array(196).fill(0.3);
    const dataUrl = renderHeatmapDataUrl(patchDists, 0, 1);
    expect(dataUrl).toContain('data:image/png;base64');
  });
});
