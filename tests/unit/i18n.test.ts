import { describe, it, expect } from 'vitest';
import { t, translations } from '../../src/lib/i18n';
import { Language } from '../../src/types';

describe('i18n Multilingual Dictionary Unit Tests', () => {
  const languages: Language[] = ['en', 'te', 'hi'];
  const englishKeys = Object.keys(translations.en);

  it('contains all required keys across en, te, and hi dictionaries', () => {
    for (const lang of languages) {
      const dict = translations[lang];
      for (const key of englishKeys) {
        expect(dict[key]).toBeDefined();
        expect(dict[key].length).toBeGreaterThan(0);
      }
    }
  });

  it('translates correctly for each language and handles unknown keys with fallback', () => {
    expect(t('appName', 'en')).toBe('ScanKavach');
    expect(t('appName', 'te')).toBe('ScanKavach');
    expect(t('appName', 'hi')).toBe('ScanKavach');

    expect(t('verdictNormal', 'en')).toBe('Normal');
    expect(t('verdictNormal', 'te')).toContain('సాధారణం');
    expect(t('verdictNormal', 'hi')).toContain('सामान्य');

    // Unknown key fallback
    expect(t('unknown_key_token', 'en')).toBe('unknown_key_token');
  });

  it('verifies safety disclaimer exists in all three languages', () => {
    for (const lang of languages) {
      const disclaimer = t('safetyDisclaimer', lang);
      expect(disclaimer.length).toBeGreaterThan(10);
    }
  });
});
