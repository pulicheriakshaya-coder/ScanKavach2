/**
 * @file src/data/healthContent.ts
 * @description Educational, conservative health information aligned with WHO, ICMR, and MoHFW India guidelines.
 */

export interface HealthTopic {
  id: string;
  title: string;
  whatItIs: string;
  commonSymptoms: string[];
  higherRisk: string[];
  reduceRisk: string[];
  whenToSeeDoctor: string[];
  whatDoctorsUsuallyDo: string[];
  mythsVsFacts: { myth: string; fact: string }[];
  nationalProgrammeNote?: string;
}

export const HEALTH_TOPICS: HealthTopic[] = [
  {
    id: 'pneumonia',
    title: 'Pneumonia',
    whatItIs:
      'An acute infection of the lung tissue where the air sacs (alveoli) may fill with fluid or inflammatory material.',
    commonSymptoms: [
      'Persistent cough which may produce phlegm',
      'Fever, sweating, or chills',
      'Shortness of breath or rapid shallow breathing',
      'Sharp chest discomfort aggravated by deep breathing or coughing',
    ],
    higherRisk: [
      'Infants under 2 years and adults aged 65 and older',
      'Individuals with chronic respiratory conditions, heart conditions, or diabetes',
      'People exposed to indoor air pollution or tobacco smoke',
      'Individuals with weakened immune function',
    ],
    reduceRisk: [
      'Keeping up to date with routine pneumococcal and influenza immunizations',
      'Practicing frequent hand hygiene and respiratory etiquette',
      'Minimizing exposure to indoor biomass smoke and tobacco smoke',
      'Maintaining balanced nutrition and adequate hydration',
    ],
    whenToSeeDoctor: [
      'Difficulty breathing, persistent rapid breathing, or blue-tinged lips/fingertips',
      'High persistent fever not settling over several days',
      'Chest pain especially when inhaling',
      'New confusion or decreased alertness, particularly in elderly individuals',
    ],
    whatDoctorsUsuallyDo: [
      'Conduct a physical examination including lung auscultation with a stethoscope',
      'Check vital signs (oxygen saturation, respiratory rate, temperature)',
      'Evaluate chest X-rays or blood tests to identify the nature and severity of infection',
      'Determine appropriate evidence-based clinical management',
    ],
    mythsVsFacts: [
      {
        myth: 'Cold weather or drinking cold water causes pneumonia.',
        fact: 'Pneumonia is caused by infectious microorganisms (viruses, bacteria, fungi), not temperature alone.',
      },
      {
        myth: 'All coughs automatically require strong antibiotics.',
        fact: 'Antibiotics only treat bacterial infections; viral pneumonia requires supportive care directed by a clinician.',
      },
    ],
  },
  {
    id: 'tuberculosis',
    title: 'Tuberculosis (TB)',
    whatItIs:
      'A preventable and curable infectious condition primarily affecting the lungs caused by Mycobacterium tuberculosis bacteria.',
    nationalProgrammeNote:
      'In India, free testing (NAAT/CBNAAT, chest X-rays) and full courses of treatment are provided under the National Tuberculosis Elimination Programme (NTEP) across government primary health centers and district hospitals.',
    commonSymptoms: [
      'Cough lasting more than 2 to 3 weeks',
      'Unexplained fever, especially low-grade fever with night sweats',
      'Unintentional weight loss and loss of appetite',
      'Coughing up blood or blood-streaked sputum',
      'Persistent fatigue and chest pain',
    ],
    higherRisk: [
      'Close household contacts of individuals with active pulmonary TB',
      'People with diabetes, undernutrition, or HIV',
      'Tobacco smokers and people with chronic alcohol use',
      'People living or working in crowded or poorly ventilated environments',
    ],
    reduceRisk: [
      'Early testing for any cough lasting more than 2 weeks',
      'Ensuring good room ventilation and sunlight in living spaces',
      'Completing preventative therapy if recommended by public health authorities',
      'Practicing proper cough etiquette and wearing masks when symptomatic',
    ],
    whenToSeeDoctor: [
      'Any cough lasting for more than 2 weeks that is not improving',
      'Any presence of blood in sputum, even in small amounts',
      'Significant unexplained weight loss coupled with evening fevers',
      'Known close contact with someone diagnosed with active TB',
    ],
    whatDoctorsUsuallyDo: [
      'Perform rapid molecular sputum testing (such as Truenat or CBNAAT) and smear microscopy',
      'Review chest radiography for characteristic upper-lobe or cavitary patterns',
      'Enroll eligible patients in public health registries (e.g. Ni-kshay in India) for free supervised treatment',
      'Monitor treatment completion systematically',
    ],
    mythsVsFacts: [
      {
        myth: 'Tuberculosis is hereditary and passes down through generations.',
        fact: 'TB is an airborne bacterial infection and is never inherited genetically.',
      },
      {
        myth: 'TB is untreatable or a lifelong stigma.',
        fact: 'Standard drug-susceptible TB is completely curable with the full prescribed course of treatment.',
      },
    ],
  },
  {
    id: 'respiratory-infections',
    title: 'COVID-19 & Other Viral Respiratory Infections',
    whatItIs:
      'Viral infections affecting the upper and lower respiratory tracts, including SARS-CoV-2, influenza, and RSV.',
    commonSymptoms: [
      'Sore throat, runny nose, or nasal congestion',
      'Dry or productive cough',
      'Body aches, headache, and generalized fatigue',
      'Loss of taste or smell, or sudden fever',
    ],
    higherRisk: [
      'Older adults and individuals with pre-existing cardiopulmonary illnesses',
      'Immunocompromised individuals',
      'Individuals who have not received recommended vaccine booster doses',
    ],
    reduceRisk: [
      'Timely vaccination according to public health advisories',
      'Wearing masks in crowded or poorly ventilated indoor clinical settings',
      'Regular hand washing with soap or alcohol-based sanitizer',
      'Staying home and resting when exhibiting acute viral symptoms',
    ],
    whenToSeeDoctor: [
      'Oxygen saturation (SpO2) reading below 94% at rest',
      'Difficulty breathing or persistent chest heaviness',
      'Inability to drink fluids or keep medications down',
      'Symptoms worsening significantly after initial improvement',
    ],
    whatDoctorsUsuallyDo: [
      'Perform rapid antigen or RT-PCR diagnostic tests',
      'Assess oxygenation levels and cardiovascular vitals',
      'Advise symptomatic supportive care, hydration, and danger sign monitoring',
    ],
    mythsVsFacts: [
      {
        myth: 'Taking large doses of vitamins guarantees prevention.',
        fact: 'While good nutrition supports immunity, vaccination and hygiene remain the primary evidence-based defenses.',
      },
    ],
  },
  {
    id: 'asthma-copd',
    title: 'Asthma & Chronic Obstructive Pulmonary Disease (COPD)',
    whatItIs:
      'Long-term chronic airway conditions characterized by airway inflammation, hyperresponsiveness, or airflow limitation.',
    commonSymptoms: [
      'Wheezing or whistling sound when exhaling',
      'Breathlessness especially during exertion or at night',
      'Chronic morning cough with sputum (frequent in COPD)',
      'Chest tightness or feeling unable to breathe deeply',
    ],
    higherRisk: [
      'History of active cigarette or bidi smoking, or secondhand smoke exposure',
      'Long-term exposure to biomass fuel cookstoves or industrial dusts',
      'Family history of asthma or allergic rhinitis',
    ],
    reduceRisk: [
      'Avoiding active and passive tobacco smoke exposure completely',
      'Using improved clean cooking ventilation or LPG cookstoves',
      'Identifying and minimizing personal allergens (dust mites, pollen, mold)',
      'Using prescribed maintenance inhalers strictly as directed by a pulmonologist',
    ],
    whenToSeeDoctor: [
      'Acute flare-up where quick-relief inhaler is not providing expected relief',
      'Severe breathlessness speaking only in broken words',
      'Persistent blue discoloration around lips or fingernails',
    ],
    whatDoctorsUsuallyDo: [
      'Conduct spirometry / pulmonary function testing (PFT) to measure airflow',
      'Review inhaler technique and trigger management',
      'Formulate an individualized Asthma/COPD Action Plan',
    ],
    mythsVsFacts: [
      {
        myth: 'Inhalers are habit-forming and should only be used as a last resort.',
        fact: 'Inhaled therapies deliver tiny, safe doses directly to the lungs with minimal systemic side effects.',
      },
    ],
  },
  {
    id: 'lung-nodules-risk',
    title: 'Lung Nodules & Health Vigilance',
    whatItIs:
      'A lung nodule is a small, round spot on a scan. The majority of small lung nodules are benign (caused by past infections or healed scars).',
    commonSymptoms: [
      'Small nodules typically cause zero symptoms and are discovered incidentally',
      'Unexplained hoarseness or persistent voice changes',
      'Unexplained chest or shoulder ache not related to movement',
      'Persistent change in a long-standing smoker’s cough',
    ],
    higherRisk: [
      'History of substantial cigarette or tobacco smoking',
      'Occupational exposure to asbestos, radon, silica, or arsenic',
      'Older age and previous personal cancer history',
    ],
    reduceRisk: [
      'Tobacco cessation is the single most impactful risk reduction step',
      'Workplace safety precautions and respiratory protective equipment',
      'Adhering to recommended radiological surveillance intervals',
    ],
    whenToSeeDoctor: [
      'Unexplained hemoptysis (coughing up blood)',
      'Unintended significant weight loss over a few weeks or months',
      'A scan report indicating a nodule with irregular borders or growth',
    ],
    whatDoctorsUsuallyDo: [
      'Compare current imaging with any historical chest X-rays or CT scans',
      'Calculate clinical risk based on age, smoking history, and nodule size',
      'Recommend either watchful low-dose CT follow-up or specialized pulmonary consultation',
    ],
    mythsVsFacts: [
      {
        myth: 'Every shadow or nodule on a chest scan indicates malignancy.',
        fact: 'Most small nodules are benign scars from previous resolved respiratory infections.',
      },
    ],
  },
];

export interface SymptomQuestions {
  hasSevereBreathlessness: boolean;
  hasChestPainInhaling: boolean;
  hasCoughOverTwoWeeks: boolean;
  hasBloodInSputum: boolean;
  hasFeverChills: boolean;
  hasWeightLossNightSweats: boolean;
}

export type TriageUrgency =
  | 'Seek urgent care now'
  | 'See a doctor soon'
  | 'Routine - maintain healthy habits';

export interface TriageResult {
  urgency: TriageUrgency;
  reasons: string[];
}

/**
 * Pure triage logic returning conservative urgency guidance without giving disease names.
 */
export function triage(answers: SymptomQuestions): TriageResult {
  const reasons: string[] = [];

  // Red flags -> Urgent care
  if (answers.hasSevereBreathlessness) {
    reasons.push('Severe breathlessness or respiratory distress requires immediate medical assessment.');
  }
  if (answers.hasBloodInSputum) {
    reasons.push('Coughing up blood warrants urgent clinical evaluation.');
  }
  if (answers.hasChestPainInhaling) {
    reasons.push('Acute chest pain aggravated by breathing requires prompt medical evaluation.');
  }

  if (reasons.length > 0) {
    return {
      urgency: 'Seek urgent care now',
      reasons,
    };
  }

  // Amber flags -> See a doctor soon
  if (answers.hasCoughOverTwoWeeks) {
    reasons.push('A cough lasting more than 2 weeks should be evaluated by a healthcare professional.');
  }
  if (answers.hasWeightLossNightSweats) {
    reasons.push('Unexplained weight loss or recurrent night sweats should be clinically investigated.');
  }
  if (answers.hasFeverChills) {
    reasons.push('Persistent fever or chills not resolving with rest warrants medical review.');
  }

  if (reasons.length > 0) {
    return {
      urgency: 'See a doctor soon',
      reasons,
    };
  }

  return {
    urgency: 'Routine - maintain healthy habits',
    reasons: ['No acute or persistent alarm symptoms selected. Continue healthy respiratory precautions.'],
  };
}
