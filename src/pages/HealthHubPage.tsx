/**
 * @file src/pages/HealthHubPage.tsx
 * @description Educational respiratory Health Hub with symptom check triage and emergency callouts.
 */

import React, { useState } from 'react';
import {
  HeartPulse,
  Search,
  AlertOctagon,
  MapPin,
  ChevronDown,
  ChevronUp,
  CheckSquare,
  Square,
  ShieldCheck,
} from 'lucide-react';
import { HEALTH_TOPICS, triage, SymptomQuestions, TriageResult } from '../data/healthContent';

export const HealthHubPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedTopicId, setExpandedTopicId] = useState<string | null>('pneumonia');
  const [symptomAnswers, setSymptomAnswers] = useState<SymptomQuestions>({
    hasSevereBreathlessness: false,
    hasChestPainInhaling: false,
    hasCoughOverTwoWeeks: false,
    hasBloodInSputum: false,
    hasFeverChills: false,
    hasWeightLossNightSweats: false,
  });
  const [triageResult, setTriageResult] = useState<TriageResult | null>(null);

  const [preventionItems, setPreventionItems] = useState<Record<string, boolean>>({
    vaccine: true,
    handHygiene: true,
    ventilation: false,
    noSmoking: true,
    masksCrowds: false,
  });

  const togglePrevention = (key: string) => {
    setPreventionItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleTriageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = triage(symptomAnswers);
    setTriageResult(res);
  };

  const filteredTopics = HEALTH_TOPICS.filter(
    (t) =>
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.whatItIs.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
          <HeartPulse className="w-6 h-6 text-teal-400" />
          Respiratory Health Hub & Guidance
        </h1>
        <p className="text-sm text-slate-400">
          Educational guidance aligned with WHO and Indian Ministry of Health and Family Welfare (ICMR) standards.
        </p>
      </div>

      {/* Emergency & Mandated Disclaimers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-800/50 flex items-start gap-3 text-xs text-rose-200">
          <AlertOctagon className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-rose-300 block mb-0.5">Emergency Assistance</span>
            In an emergency call 112 (India) or go to the nearest hospital.
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 space-y-1">
          <p className="font-semibold text-slate-300">
            General health information for education only. It is not a diagnosis or medical advice. Please consult a qualified doctor.
          </p>
          <p className="text-[11px] text-slate-500">
            Sources: WHO, Ministry of Health and Family Welfare (India), ICMR - please verify with your clinician.
          </p>
        </div>
      </div>

      {/* Interactive Symptom Check with Pure Triage */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
        <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-teal-400" />
          Respiratory Symptom Checker & Clinical Triage
        </h2>
        <p className="text-xs text-slate-400">
          Select any symptoms present. Returns guidance regarding urgency without diagnostic labeling. Responses are never stored.
        </p>

        <form onSubmit={handleTriageSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { key: 'hasSevereBreathlessness', label: 'Severe breathlessness or rapid breathing' },
              { key: 'hasChestPainInhaling', label: 'Sharp chest pain when inhaling or coughing' },
              { key: 'hasBloodInSputum', label: 'Coughing up blood or blood-streaked sputum' },
              { key: 'hasCoughOverTwoWeeks', label: 'Cough lasting more than 2 to 3 weeks' },
              { key: 'hasFeverChills', label: 'Persistent high fever or recurrent chills' },
              { key: 'hasWeightLossNightSweats', label: 'Unexplained weight loss or night sweats' },
            ].map((q) => (
              <label
                key={q.key}
                className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs text-slate-200 cursor-pointer hover:border-slate-600 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={symptomAnswers[q.key as keyof SymptomQuestions]}
                  onChange={(e) =>
                    setSymptomAnswers((prev) => ({
                      ...prev,
                      [q.key]: e.target.checked,
                    }))
                  }
                  className="rounded bg-slate-800 border-slate-700 text-teal-500 focus:ring-0 mt-0.5"
                />
                <span>{q.label}</span>
              </label>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <button
              type="submit"
              className="px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
            >
              Evaluate Triage Urgency
            </button>

            {/* Find Care External Buttons */}
            <div className="flex items-center gap-2">
              <a
                href="https://www.google.com/maps/search/hospital+near+me"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium transition-colors"
              >
                <MapPin className="w-3.5 h-3.5 text-teal-400" />
                Find Hospital Near Me
              </a>
              <a
                href="https://www.google.com/maps/search/chest+clinic+near+me"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium transition-colors"
              >
                <MapPin className="w-3.5 h-3.5 text-teal-400" />
                Find Chest Clinic
              </a>
            </div>
          </div>
        </form>

        {triageResult && (
          <div
            className={`p-4 rounded-xl border text-xs space-y-2 ${
              triageResult.urgency === 'Seek urgent care now'
                ? 'bg-rose-950/40 border-rose-800/60 text-rose-200'
                : triageResult.urgency === 'See a doctor soon'
                ? 'bg-amber-950/40 border-amber-800/60 text-amber-200'
                : 'bg-teal-950/40 border-teal-800/60 text-teal-200'
            }`}
          >
            <div className="font-bold text-sm uppercase tracking-wider">
              {triageResult.urgency}
            </div>
            <ul className="list-disc pl-4 space-y-0.5">
              {triageResult.reasons.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Prevention Checklist Tracker */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
        <h2 className="text-sm font-semibold text-slate-200">
          Personal Respiratory Health & Prevention Tracker
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { id: 'vaccine', label: 'Immunization (Flu / Pneumococcal up-to-date)' },
            { id: 'handHygiene', label: 'Regular soap handwashing & respiratory hygiene' },
            { id: 'ventilation', label: 'Well-ventilated living & cooking spaces' },
            { id: 'noSmoking', label: 'Smoke-free environment (avoiding active & passive smoke)' },
            { id: 'masksCrowds', label: 'Mask usage in crowded or healthcare settings' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => togglePrevention(item.id)}
              className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-left text-xs text-slate-300 hover:border-teal-500/50 transition-colors"
            >
              {preventionItems[item.id] ? (
                <CheckSquare className="w-4 h-4 text-teal-400 flex-shrink-0" />
              ) : (
                <Square className="w-4 h-4 text-slate-500 flex-shrink-0" />
              )}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Searchable Disease Cards */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-slate-100">Clinical Educational Topics</h2>
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search topics (TB, pneumonia...)"
              className="w-full pl-9 pr-3 py-1.5 bg-slate-900 text-slate-100 text-xs border border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>

        <div className="space-y-3">
          {filteredTopics.map((topic) => {
            const isExpanded = expandedTopicId === topic.id;
            return (
              <div
                key={topic.id}
                className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden transition-colors"
              >
                <button
                  onClick={() => setExpandedTopicId(isExpanded ? null : topic.id)}
                  className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-800/40 transition-colors"
                >
                  <div>
                    <h3 className="text-sm font-bold text-slate-200">{topic.title}</h3>
                    <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{topic.whatItIs}</p>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  )}
                </button>

                {isExpanded && (
                  <div className="p-4 pt-0 border-t border-slate-800/80 text-xs text-slate-300 space-y-4">
                    {topic.nationalProgrammeNote && (
                      <div className="p-3 bg-teal-950/30 border border-teal-800/50 rounded-lg text-teal-300">
                        <strong>Public Health Note:</strong> {topic.nationalProgrammeNote}
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="font-semibold text-slate-200 block mb-1">Common Symptoms</span>
                        <ul className="list-disc pl-4 space-y-0.5 text-slate-400">
                          {topic.commonSymptoms.map((s, i) => (
                            <li key={i}>{s}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <span className="font-semibold text-slate-200 block mb-1">Who Is at Higher Risk</span>
                        <ul className="list-disc pl-4 space-y-0.5 text-slate-400">
                          {topic.higherRisk.map((r, i) => (
                            <li key={i}>{r}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="font-semibold text-slate-200 block mb-1">When to See a Doctor</span>
                        <ul className="list-disc pl-4 space-y-0.5 text-rose-300/90">
                          {topic.whenToSeeDoctor.map((w, i) => (
                            <li key={i}>{w}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <span className="font-semibold text-slate-200 block mb-1">What Doctors Usually Do</span>
                        <ul className="list-disc pl-4 space-y-0.5 text-slate-400">
                          {topic.whatDoctorsUsuallyDo.map((d, i) => (
                            <li key={i}>{d}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div>
                      <span className="font-semibold text-slate-200 block mb-1">Myths vs. Facts</span>
                      <div className="space-y-1.5">
                        {topic.mythsVsFacts.map((m, i) => (
                          <div key={i} className="p-2.5 rounded bg-slate-800/50 border border-slate-700/60">
                            <span className="text-rose-400 font-medium">Myth:</span> {m.myth}{' '}
                            <span className="text-teal-400 font-medium ml-2">Fact:</span> {m.fact}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
