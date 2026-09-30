/**
 * @file src/lib/i18n.ts
 * @description Pure static multilingual dictionary for ScanKavach (en, te, hi).
 */

import { Language } from '../types';

export const translations: Record<Language, Record<string, string>> = {
  en: {
    appName: 'ScanKavach',
    appSlogan: 'Your shield for safer medical image screening',
    safetyDisclaimer:
      'This flags an unusual pattern for clinician review. It is not a diagnosis.',
    decisionSupportDisclaimer:
      'This is an AI-suggested finding from a research prototype, not a confirmed diagnosis and not a medical device. It must be reviewed and confirmed by a qualified doctor or radiologist.',
    healthHubDisclaimer:
      'General health information for education only. It is not a diagnosis or medical advice. Please consult a qualified doctor.',
    emergencyNotice:
      'In an emergency call 112 (India) or go to the nearest hospital.',
    sourceNotice:
      'WHO, Ministry of Health and Family Welfare (India), ICMR - please verify with your clinician.',
    shiftWarningNotice:
      'This scan may come from a different scanner or protocol. The score may reflect the device, not disease.',
    borderlineNotice: 'Borderline: needs human review',
    reviewPercentileNote: 'Note: About 5% of healthy scans land in Review by design.',
    gateColorPhoto: 'This is a colour photo. Expected a grayscale medical scan.',
    gateLowContrast: 'The image has too little contrast to assess.',
    gateBlurry: 'The image is too blurry to assess reliably.',
    gateWrongType:
      'This does not look like the type of scan the reference set was built from (for example, not a chest X-ray).',
    verdictNormal: 'Normal',
    verdictReview: 'Review',
    verdictRefer: 'Refer',
    fusionConsistentNormal: 'Consistent with healthy reference patterns.',
    fusionSuggestedCondition: 'AI-suggested finding (decision support)',
    fusionConflict: 'Signals disagree. A clinician review is strongly recommended.',
    fusionInconclusive: 'The model is not confident. Unusual pattern present but condition unclear.',
    nextStepsGeneral: 'Recommended clinical actions',
    nextStepsStep1: 'Correlate with patient clinical history, auscultation, and vitals.',
    nextStepsStep2: 'Review high-anomaly localized regions highlighted on the heatmap.',
    nextStepsStep3: 'Repeat imaging if position, motion artifact or technical quality was compromised.',
    navDashboard: 'Dashboard',
    navBuildBank: 'Build Bank',
    navAnalyze: 'Analyze',
    navBatch: 'Batch',
    navEvaluation: 'Evaluation',
    navOptimizationLab: 'Optimization Lab',
    navConditionModel: 'Condition Model',
    navHealthHub: 'Health Hub',
    navAssistant: 'AI Assistant',
    navModelCard: 'Model Card',
    navAbout: 'About',
    signOut: 'Sign out',
  },
  te: {
    appName: 'ScanKavach',
    appSlogan: 'వైద్య చిత్రాల సురక్షిత స్క్రీనింగ్ కోసం మీ కవచం',
    safetyDisclaimer:
      'ఇది వైద్యుల సమీక్ష కోసం అసాధారణ నమూనాను సూచిస్తుంది. ఇది నిర్ధారణ కాదు.',
    decisionSupportDisclaimer:
      'ఇది ఒక పరిశోధనా నమూనా నుండి వచ్చిన AI-సూచించిన సమాచారం మాత్రమే, నిర్ధారించబడిన రోగ నిర్ధారణ కాదు. అర్హతగల వైద్యుడు లేదా రేడియాలజిస్ట్ తప్పక సమీక్షించాలి.',
    healthHubDisclaimer:
      'సాధారణ ఆరోగ్య సమాచారం విద్య కొరకు మాత్రమే. ఇది నిర్ధారణ లేదా వైద్య సలహా కాదు. దయచేసి అర్హతగల వైద్యుడిని సంప్రదించండి.',
    emergencyNotice:
      'అత్యవసర పరిస్థితుల్లో 112 కు కాల్ చేయండి లేదా సమీప ఆసుపత్రికి వెళ్ళండి.',
    sourceNotice:
      'WHO, ఆరోగ్య మరియు కుటుంబ సంక్షేమ మంత్రిత్వ శాఖ (భారతదేశం), ICMR - దయచేసి వైద్యుడితో సరిచూడండి.',
    shiftWarningNotice:
      'ఈ స్కాన్ వేరే స్కానర్ లేదా ప్రోటోకాల్ నుండి వచ్చినట్లు కనిపిస్తోంది. స్కోరు పరికరాన్ని ప్రతిబింబించవచ్చు.',
    borderlineNotice: 'సరిహద్దు స్కోరు: మానవ సమీక్ష అవసరం',
    reviewPercentileNote: 'గమనిక: దాదాపు 5% సాధారణ స్కాన్లు రివ్యూ వర్గంలోకి రావచ్చు.',
    gateColorPhoto: 'ఇది రంగుల ఫోటో. గ్రేస్కేల్ వైద్య స్కాన్ ఆశించబడింది.',
    gateLowContrast: 'చిత్రంలో తగినంత కాంట్రాస్ట్ లేదు.',
    gateBlurry: 'చిత్రం చాలా మసకగా ఉంది.',
    gateWrongType: 'ఇది సూచన సెట్ రూపొందించబడిన స్కాన్ రకంలా కనిపించడం లేదు.',
    verdictNormal: 'సాధారణం (Normal)',
    verdictReview: 'సమీక్ష (Review)',
    verdictRefer: 'సిఫార్సు (Refer)',
    fusionConsistentNormal: 'ఆరోగ్యకరమైన సూచన నమూనాలతో సరిపోలుతోంది.',
    fusionSuggestedCondition: 'AI-సూచించిన పరిశీలన (నిర్ణయ మద్దతు)',
    fusionConflict: 'సంకేతాలు భిన్నంగా ఉన్నాయి. వైద్యుల సమీక్ష బలంగా సిఫార్సు చేయబడింది.',
    fusionInconclusive: 'ఖచ్చితత్వం సరిపోలేదు. అసాధారణ నమూనా ఉంది కానీ నిర్దిష్టత అస్పష్టంగా ఉంది.',
    nextStepsGeneral: 'సిఫార్సు చేయబడిన వైద్య చర్యలు',
    nextStepsStep1: 'రోగి యొక్క వైద్య చరిత్ర మరియు ప్రాథమిక లక్షణాలతో సరిచూడండి.',
    nextStepsStep2: 'హీట్‌మ్యాప్‌లో సూచించిన ప్రాంతాలను జాగ్రత్తగా పరిశీలించండి.',
    nextStepsStep3: 'అవసరమైతే సాంకేతిక నాణ్యతతో పునరావృత స్కాన్ తీయండి.',
    navDashboard: 'డ్యాష్‌బోర్డ్',
    navBuildBank: 'బ్యాంక్ నిర్మించండి',
    navAnalyze: 'విశ్లేషణ',
    navBatch: 'బ్యాచ్',
    navEvaluation: 'మూల్యాంకనం',
    navOptimizationLab: 'ఆప్టిమైజేషన్ ల్యాబ్',
    navConditionModel: 'పరిస్థితి మోడల్',
    navHealthHub: 'హెల్త్ హబ్',
    navAssistant: 'AI సహాయకుడు',
    navModelCard: 'మోడల్ కార్డ్',
    navAbout: 'గురించి',
    signOut: 'లాగ్ అవుట్',
  },
  hi: {
    appName: 'ScanKavach',
    appSlogan: 'चिकित्सा छवि स्क्रीनिंग के लिए आपकी ढाल',
    safetyDisclaimer:
      'यह चिकित्सक की समीक्षा के लिए एक असामान्य पैटर्न को चिह्नित करता है। यह कोई निदान नहीं है।',
    decisionSupportDisclaimer:
      'यह एक शोध प्रोटोटाइप से एआई-सुझाया गया निष्कर्ष है, पुष्ट निदान नहीं है। एक योग्य डॉक्टर या रेडियोलॉजिस्ट द्वारा इसकी समीक्षा अनिवार्य है।',
    healthHubDisclaimer:
      'सामान्य स्वास्थ्य जानकारी केवल शिक्षा के लिए है। यह कोई निदान या सलाह नहीं है। कृपया योग्य डॉक्टर से परामर्श लें।',
    emergencyNotice:
      'आपातकालीन स्थिति में 112 (भारत) पर कॉल करें या नजदीकी अस्पताल जाएं।',
    sourceNotice:
      'डब्ल्यूएचओ, स्वास्थ्य और परिवार कल्याण मंत्रालय (भारत), आईसीएमआर - कृपया चिकित्सक से सत्यापित करें।',
    shiftWarningNotice:
      'यह स्कैन किसी भिन्न स्कैनर या प्रोटोकॉल से हो सकता है। यह स्कोर उपकरण को दर्शा सकता है।',
    borderlineNotice: 'सीमा रेखा: मानवीय समीक्षा की आवश्यकता है',
    reviewPercentileNote: 'ध्यान दें: लगभग 5% स्वस्थ स्कैन स्वाभाविक रूप से समीक्षा में आते हैं।',
    gateColorPhoto: 'यह रंगीन फोटो है। ग्रेस्केल मेडिकल स्कैन अपेक्षित था।',
    gateLowContrast: 'छवि में मूल्यांकन के लिए बहुत कम कंट्रास्ट है।',
    gateBlurry: 'छवि स्पष्ट रूप से देखने के लिए बहुत धुंधली है।',
    gateWrongType: 'यह संदर्भ सेट वाले स्कैन के प्रकार से मेल नहीं खाता (उदा. चेस्ट एक्स-रे नहीं)।',
    verdictNormal: 'सामान्य (Normal)',
    verdictReview: 'समीक्षा (Review)',
    verdictRefer: 'परामर्श (Refer)',
    fusionConsistentNormal: 'स्वस्थ संदर्भ पैटर्न के अनुरूप।',
    fusionSuggestedCondition: 'एआई-सुझाया गया निष्कर्ष (निर्णय समर्थन)',
    fusionConflict: 'संकेत असहमत हैं। चिकित्सक समीक्षा की पुरजोर सिफारिश की जाती है।',
    fusionInconclusive: 'मॉडल आश्वस्त नहीं है। असामान्य पैटर्न मौजूद है पर स्थिति अस्पष्ट है।',
    nextStepsGeneral: 'अनुशंसित नैदानिक कदम',
    nextStepsStep1: 'रोगी के नैदानिक इतिहास और लक्षणों के साथ सहसंबंध स्थापित करें।',
    nextStepsStep2: 'हीटमैप में चिह्नित असामान्य क्षेत्रों की जांच करें।',
    nextStepsStep3: 'यदि छवि में कोई त्रुटि थी तो पुनः स्कैन करने पर विचार करें।',
    navDashboard: 'डैशबोर्ड',
    navBuildBank: 'बैंक बनाएं',
    navAnalyze: 'विश्लेषण',
    navBatch: 'बैच',
    navEvaluation: 'मूल्यांकन',
    navOptimizationLab: 'ऑप्टिमाइज़ेशन लैब',
    navConditionModel: 'कंडीशन मॉडल',
    navHealthHub: 'हेल्थ हब',
    navAssistant: 'एआई सहायक',
    navModelCard: 'मॉडल कार्ड',
    navAbout: 'के बारे में',
    signOut: 'साइन आउट',
  },
};

/**
 * Translates a key for the given language, falling back to English.
 * @param key - Translation token key.
 * @param lang - Target language ('en' | 'te' | 'hi').
 * @returns Translated string.
 */
export function t(key: string, lang: Language = 'en'): string {
  const dict = translations[lang] || translations.en;
  return dict[key] || translations.en[key] || key;
}
