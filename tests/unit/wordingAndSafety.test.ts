import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { translations } from '../../src/lib/i18n';

describe('Safety Wording & Integrity Audit Tests', () => {
  it('ensures no file under src/ contains "NormalScan"', () => {
    function walkDir(dir: string): string[] {
      let files: string[] = [];
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          files = files.concat(walkDir(fullPath));
        } else if (/\.(ts|tsx|js|jsx|json)$/.test(entry.name)) {
          files.push(fullPath);
        }
      }
      return files;
    }

    const srcFiles = walkDir(path.resolve(__dirname, '../../src'));
    expect(srcFiles.length).toBeGreaterThan(10);

    for (const filePath of srcFiles) {
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content).not.toContain('NormalScan');
    }
  });

  it('ensures user-facing string templates do not contain prohibited medical diagnostic claims ("you have", "diagnosed with")', () => {
    for (const lang in translations) {
      const dict = translations[lang as keyof typeof translations];
      for (const key in dict) {
        const text = dict[key].toLowerCase();
        expect(text).not.toContain('you have');
        expect(text).not.toContain('diagnosed with');
      }
    }
  });

  it('verifies exact safety wording required by specification', () => {
    expect(translations.en.safetyDisclaimer).toBe(
      'This flags an unusual pattern for clinician review. It is not a diagnosis.'
    );
    expect(translations.en.decisionSupportDisclaimer).toBe(
      'This is an AI-suggested finding from a research prototype, not a confirmed diagnosis and not a medical device. It must be reviewed and confirmed by a qualified doctor or radiologist.'
    );
  });
});
