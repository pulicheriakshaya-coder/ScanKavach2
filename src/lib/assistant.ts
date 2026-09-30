/**
 * @file src/lib/assistant.ts
 * @description Decision support assistant with conservative safety filtering and local fallback.
 */

import { Language } from '../types';
import { HEALTH_TOPICS } from '../data/healthContent';

export interface AssistantContext {
  verdict?: string;
  isBorderline?: boolean;
  score?: number;
  percentile?: number;
  explanation?: string;
  suggestedFinding?: string;
  gateReason?: string;
}

const SAFETY_PROHIBITED_REGEX =
  /(do i have|am i sick|diagnose me|what medicine|which medicine|what pill|what dose|dosage|home cure|home remedy|treat my|cure my)/i;

/**
 * Validates a user query against clinical safety boundaries.
 * @param query - Input user question.
 * @returns Refusal message if violated, or null if query passes safety filters.
 */
export function checkSafetyFilter(query: string, lang: Language = 'en'): string | null {
  if (SAFETY_PROHIBITED_REGEX.test(query)) {
    if (lang === 'te') {
      return 'క్షమించండి, స్కాన్‌కవచ్ మందులు, మోతాదులు లేదా రోగ నిర్ధారణను అందించదు. దయచేసి అర్హతగల వైద్యుడిని సంప్రదించండి.';
    }
    if (lang === 'hi') {
      return 'क्षमा करें, स्कैनकवच दवाइयां, खुराक या प्रत्यक्ष निदान प्रदान नहीं करता है। कृपया योग्य डॉक्टर से परामर्श लें।';
    }
    return 'ScanKavach cannot diagnose conditions or recommend medications, doses, or treatment cures. Please consult a qualified doctor for medical evaluation.';
  }
  return null;
}

/**
 * Generates an accurate, safe local response using contextual template matching and Health Hub data.
 */
export function generateLocalAssistantResponse(
  query: string,
  context?: AssistantContext,
  lang: Language = 'en'
): string {
  const safetyRefusal = checkSafetyFilter(query, lang);
  if (safetyRefusal) return safetyRefusal;

  const q = query.toLowerCase();

  // 1. Borderline questions
  if (q.includes('borderline')) {
    return 'A borderline result occurs when the anomaly score lands within 0.05 of a calibration threshold. It indicates uncertainty and strictly requires qualified human clinician review.';
  }

  // 2. Result summary / verdict questions
  if (q.includes('verdict') || q.includes('score') || q.includes('result') || q.includes('mean')) {
    if (context?.verdict) {
      const blText = context.isBorderline ? ' This score is borderline, meaning human review is essential.' : '';
      return `The scan received a verdict of ${context.verdict} with an anomaly score of ${context.score?.toFixed(3) ?? 'N/A'}.${blText} Remember, this flags an unusual pattern for clinician review. It is not a diagnosis.`;
    }
    return 'ScanKavach compares scans against healthy reference baselines. Verdicts are Normal, Review, or Refer, designed to flag unusual patterns for clinician review.';
  }

  // 3. Quality / Gate questions
  if (q.includes('gate') || q.includes('blurry') || q.includes('contrast') || q.includes('colour') || q.includes('photo')) {
    if (context?.gateReason) {
      return `The safety gate stopped processing: "${context.gateReason}". The scan must be a clear, high-contrast, grayscale medical image to ensure safety.`;
    }
    return 'The safety gate checks for colour photos, blur, low contrast, and out-of-distribution modalities before scoring. If any check fails, no verdict or suggestion is issued.';
  }

  // 4. Threshold questions
  if (q.includes('threshold') || q.includes('percentile')) {
    return 'Thresholds are statistically calibrated using a healthy validation set. The 95th percentile marks Review, and the 99th percentile marks Refer. About 5% of healthy scans land in Review by design.';
  }

  // 5. Tuberculosis / Pneumonia / Conditions
  for (const topic of HEALTH_TOPICS) {
    if (q.includes(topic.id) || q.includes(topic.title.toLowerCase())) {
      const symptoms = topic.commonSymptoms.slice(0, 2).join(', ');
      const prog = topic.nationalProgrammeNote ? ` ${topic.nationalProgrammeNote}` : '';
      return `${topic.title}: ${topic.whatItIs} Common signs include ${symptoms}. When in doubt, seek prompt clinical evaluation.${prog}`;
    }
  }

  // 6. Doctor / emergency
  if (q.includes('doctor') || q.includes('hospital') || q.includes('emergency')) {
    return 'If experiencing difficulty breathing, chest pain, or coughing blood, seek urgent medical care immediately or call 112 in India. For routine questions, schedule an evaluation with a qualified physician.';
  }

  // Default conservative overview
  return 'ScanKavach is a decision support tool for medical images. All findings flag unusual patterns for clinician review and are not a diagnosis. Consult a qualified doctor for medical advice.';
}

/**
 * Handles assistant queries with Gemini fallback if available, otherwise returning local mode.
 */
export async function getAssistantResponse(
  query: string,
  context?: AssistantContext,
  lang: Language = 'en'
): Promise<string> {
  const safetyRefusal = checkSafetyFilter(query, lang);
  if (safetyRefusal) return safetyRefusal;

  // Check if Gemini key is available in environment
  const apiKey =
    typeof process !== 'undefined' && process.env
      ? process.env.GEMINI_API_KEY
      : null;

  if (!apiKey) {
    return generateLocalAssistantResponse(query, context, lang);
  }

  try {
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
    });

    const systemInstruction =
      "You are ScanKavach Assistant. Explain screening results, suggested findings, thresholds, borderline scores, image-quality issues, general prevention and when to see a doctor, in plain language, in the language selected by the user. You are not a doctor. Never diagnose a person, never say a person has a disease, never recommend medicines, doses, home cures or treatment plans; refuse politely and advise consulting a qualified clinician. Base answers only on the provided result summary, the app's documented behaviour and the provided Health Hub content. Keep answers under 120 words.";

    const contextText = context
      ? `Result summary: Verdict=${context.verdict || 'None'}, Score=${context.score ?? 'N/A'}, Borderline=${context.isBorderline ? 'Yes' : 'No'}, Finding=${context.suggestedFinding || 'None'}, GateReason=${context.gateReason || 'None'}. Language=${lang}.`
      : `Language=${lang}.`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `${contextText}\nUser question: ${query}`,
      config: { systemInstruction },
    });

    clearTimeout(timeout);
    return response.text || generateLocalAssistantResponse(query, context, lang);
  } catch {
    return generateLocalAssistantResponse(query, context, lang);
  }
}
