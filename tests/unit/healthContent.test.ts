import { describe, it, expect } from 'vitest';
import { triage, HEALTH_TOPICS } from '../../src/data/healthContent';

describe('Health Content & Clinical Triage Unit Tests', () => {
  it('returns "Seek urgent care now" when red flag symptoms are present', () => {
    const resBreath = triage({
      hasSevereBreathlessness: true,
      hasChestPainInhaling: false,
      hasCoughOverTwoWeeks: false,
      hasBloodInSputum: false,
      hasFeverChills: false,
      hasWeightLossNightSweats: false,
    });
    expect(resBreath.urgency).toBe('Seek urgent care now');
    expect(resBreath.reasons[0]).toContain('breathlessness');

    const resBlood = triage({
      hasSevereBreathlessness: false,
      hasChestPainInhaling: false,
      hasCoughOverTwoWeeks: false,
      hasBloodInSputum: true,
      hasFeverChills: false,
      hasWeightLossNightSweats: false,
    });
    expect(resBlood.urgency).toBe('Seek urgent care now');
    expect(resBlood.reasons[0]).toContain('blood');
  });

  it('returns "See a doctor soon" when subacute symptoms are present without red flags', () => {
    const res = triage({
      hasSevereBreathlessness: false,
      hasChestPainInhaling: false,
      hasCoughOverTwoWeeks: true,
      hasBloodInSputum: false,
      hasFeverChills: true,
      hasWeightLossNightSweats: false,
    });
    expect(res.urgency).toBe('See a doctor soon');
    expect(res.reasons.length).toBeGreaterThanOrEqual(1);
  });

  it('returns "Routine - maintain healthy habits" when no symptoms are checked', () => {
    const res = triage({
      hasSevereBreathlessness: false,
      hasChestPainInhaling: false,
      hasCoughOverTwoWeeks: false,
      hasBloodInSputum: false,
      hasFeverChills: false,
      hasWeightLossNightSweats: false,
    });
    expect(res.urgency).toBe('Routine - maintain healthy habits');
  });

  it('contains comprehensive topics with no medication names or dosages', () => {
    expect(HEALTH_TOPICS.length).toBeGreaterThanOrEqual(5);
    for (const topic of HEALTH_TOPICS) {
      expect(topic.whatItIs.length).toBeGreaterThan(10);
      expect(topic.commonSymptoms.length).toBeGreaterThan(0);
      expect(topic.higherRisk.length).toBeGreaterThan(0);
      expect(topic.reduceRisk.length).toBeGreaterThan(0);
      expect(topic.whenToSeeDoctor.length).toBeGreaterThan(0);
      expect(topic.mythsVsFacts.length).toBeGreaterThan(0);

      // Verify no prescription doses
      for (const d of topic.whatDoctorsUsuallyDo) {
        expect(d.toLowerCase()).not.toContain('mg');
        expect(d.toLowerCase()).not.toContain('tablet');
      }
    }
  });
});
