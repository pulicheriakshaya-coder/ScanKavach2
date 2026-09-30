import { describe, it, expect } from 'vitest';
import {
  checkSafetyFilter,
  generateLocalAssistantResponse,
  getAssistantResponse,
} from '../../src/lib/assistant';

describe('AI Assistant Safety Filter & Local Logic Unit Tests', () => {
  it('refuses "do I have" diagnostic inquiries in English, Telugu, and Hindi', () => {
    const queryEn = 'Do I have pneumonia?';
    expect(checkSafetyFilter(queryEn, 'en')).toContain('ScanKavach cannot diagnose conditions');

    const queryTe = 'Do I have pneumonia?';
    expect(checkSafetyFilter(queryTe, 'te')).toContain('స్కాన్‌కవచ్');

    const queryHi = 'Do I have pneumonia?';
    expect(checkSafetyFilter(queryHi, 'hi')).toContain('स्कैनकवच');
  });

  it('refuses medication and dosage requests strictly', () => {
    expect(checkSafetyFilter('What medicine should I take?', 'en')).not.toBeNull();
    expect(checkSafetyFilter('What is the dosage for antibiotic pills?', 'en')).not.toBeNull();
    expect(checkSafetyFilter('Home cure for cough and fever', 'en')).not.toBeNull();
    expect(checkSafetyFilter('How to treat my lung infection', 'en')).not.toBeNull();
  });

  it('answers verdict queries safely with context information', () => {
    const res = generateLocalAssistantResponse('What does my verdict mean?', {
      verdict: 'Review',
      score: 0.42,
      isBorderline: true,
    });
    expect(res).toContain('Review');
    expect(res).toContain('borderline');
    expect(res).toContain('It is not a diagnosis');
  });

  it('answers gate queries with contextual explanation', () => {
    const res = generateLocalAssistantResponse('Why did the gate stop my scan?', {
      gateReason: 'This is a colour photo. Expected a grayscale medical scan.',
    });
    expect(res).toContain('colour photo');
  });

  it('answers educational health queries referencing health content', () => {
    const res = generateLocalAssistantResponse('Tell me about tuberculosis in India');
    expect(res).toContain('Tuberculosis');
    expect(res).toContain('National Tuberculosis Elimination Programme');
  });

  it('falls back to local mode in getAssistantResponse when no API key is configured', async () => {
    const res = await getAssistantResponse('What is a borderline score?');
    expect(res).toContain('0.05');
  });
});
