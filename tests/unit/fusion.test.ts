import { describe, it, expect } from 'vitest';
import { fuse } from '../../src/lib/fusion';

describe('Decision Fusion Engine Unit Tests (All Branches)', () => {
  it('returns Consistent-normal when anomaly is Normal and classifier agrees Normal', () => {
    const res = fuse('Normal', false, { Normal: 0.92, Pneumonia: 0.05, Tuberculosis: 0.03 });
    expect(res.fusionVerdict).toBe('Consistent-normal');
    expect(res.message).toContain('Consistent with healthy reference');
  });

  it('returns Suggested-condition when anomaly flags Review and classifier has high non-normal confidence', () => {
    const res = fuse('Review', false, { Normal: 0.1, Pneumonia: 0.85, Tuberculosis: 0.05 });
    expect(res.fusionVerdict).toBe('Suggested-condition');
    expect(res.isHighConfidence).toBe(true);
    expect(res.message).toContain('Pneumonia');
    expect(res.message).toContain('85% model confidence');
  });

  it('returns Suggested-condition on Borderline score when top non-normal confidence is above threshold', () => {
    const res = fuse('Normal', true, { Normal: 0.2, Tuberculosis: 0.75, Pneumonia: 0.05 });
    expect(res.fusionVerdict).toBe('Suggested-condition');
    expect(res.message).toContain('Tuberculosis');
  });

  it('returns Conflict when anomaly is Normal but classifier strongly indicates pathology', () => {
    const res = fuse('Normal', false, { Normal: 0.15, Pneumonia: 0.82, Tuberculosis: 0.03 });
    expect(res.fusionVerdict).toBe('Conflict');
    expect(res.message).toContain('Signals disagree');
  });

  it('returns Conflict when anomaly is Refer but classifier strongly indicates Normal', () => {
    const res = fuse('Refer', false, { Normal: 0.95, Pneumonia: 0.03, Tuberculosis: 0.02 });
    expect(res.fusionVerdict).toBe('Conflict');
    expect(res.message).toContain('Signals disagree');
  });

  it('returns Inconclusive when anomaly is Review but classifier confidence is low', () => {
    const res = fuse('Review', false, { Normal: 0.4, Pneumonia: 0.35, Tuberculosis: 0.25 });
    expect(res.fusionVerdict).toBe('Inconclusive');
    expect(res.message).toContain('The model is not confident');
  });

  it('always includes standard research decision support disclaimer', () => {
    const res = fuse('Review', false, { Pneumonia: 0.9 });
    expect(res.disclaimer).toContain('research prototype');
    expect(res.disclaimer).toContain('not a confirmed diagnosis');
  });
});
