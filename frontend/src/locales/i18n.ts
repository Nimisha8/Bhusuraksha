export type LanguageKey = "en" | "hi" | "as" | "bn" | "mzo";

export interface Translations {
  appTitle: string;
  subTitle: string;
  navDashboard: string;
  navMap: string;
  navEmergency: string;
  navReport: string;
  navSensors: string;
  statusOnline: string;
  statusOffline: string;
  activeAlerts: string;
  criticalZones: string;
  severedRoads: string;
  sensorStations: string;
  priorityDispatch: string;
  submitReport: string;
  cameraCapture: string;
  offlineQueueNotice: string;
  safeDetour: string;
  explainableAi: string;
  viewFactors: string;
}

export const DICTIONARY: Record<LanguageKey, Translations> = {
  en: {
    appTitle: "GeoSurge-NER",
    subTitle: "AI Landslide Early Warning & Risk Intelligence",
    navDashboard: "Command Center",
    navMap: "GIS Risk Map",
    navEmergency: "Emergency Triage",
    navReport: "Citizen Report",
    navSensors: "IoT Sensors",
    statusOnline: "LIVE NETWORK",
    statusOffline: "OFFLINE MODE (QUEUED)",
    activeAlerts: "Active Warnings",
    criticalZones: "Critical Slope Zones",
    severedRoads: "Blocked Corridors",
    sensorStations: "Active In-Situ Sensors",
    priorityDispatch: "Emergency Mobilization",
    submitReport: "Submit Geo-Tagged Hazard",
    cameraCapture: "Take / Upload Photo",
    offlineQueueNotice: "No network? Reports will automatically queue and sync on connection.",
    safeDetour: "Safe Mountain Bypass",
    explainableAi: "AI Factor Attribution",
    viewFactors: "Explain Risk Drivers"
  },
  hi: {
    appTitle: "जियोसर्ज-एनईआर",
    subTitle: "एआई भूस्खलन पूर्व चेतावनी और जोखिम मंच",
    navDashboard: "कमांड सेंटर",
    navMap: "जीआईएस मानचित्र",
    navEmergency: "आपातकालीन प्रतिक्रिया",
    navReport: "नागरिक रिपोर्ट",
    navSensors: "सेंसर निगरानी",
    statusOnline: "लाइव नेटवर्क",
    statusOffline: "ऑफलाइन मोड (कतारबद्ध)",
    activeAlerts: "सक्रिय चेतावनियां",
    criticalZones: "अति संवेदनशील ढलान",
    severedRoads: "अवरुद्ध राजमार्ग",
    sensorStations: "सक्रिय भूतकनीकी सेंसर",
    priorityDispatch: "आपातकालीन लामबंदी",
    submitReport: "खतरे की रिपोर्ट भेजें",
    cameraCapture: "फोटो खींचें / अपलोड करें",
    offlineQueueNotice: "नेटवर्क नहीं है? रिपोर्ट स्थानीय रूप से सुरक्षित होकर पुनः जुड़ने पर सिंक होगी।",
    safeDetour: "सुरक्षित वैकल्पिक मार्ग",
    explainableAi: "एआई कारण विश्लेषण",
    viewFactors: "जोखिम कारक देखें"
  },
  as: {
    appTitle: "জিয়’চাৰ্জ-এনইআৰ",
    subTitle: "এআই ভূমিস্খলন প্ৰাৰম্ভিক সতৰ্কবাৰ্তা আৰু ব্যৱস্থাপনা",
    navDashboard: "নিয়ন্ত্ৰণ কক্ষ",
    navMap: "জিআইএছ মেপ",
    navEmergency: "জৰুৰীকালীন ব্যৱস্থা",
    navReport: "ৰাইজৰ প্ৰতিবেদন",
    navSensors: "ছেন্সৰ নিৰীক্ষণ",
    statusOnline: "লাইভ নেটৱৰ্ক",
    statusOffline: "অফলাইন ম’ড (ৰখা হৈছে)",
    activeAlerts: "সক্ৰিয় সতৰ্কবাৰ্তা",
    criticalZones: "বিপদসংকুল অঞ্চল",
    severedRoads: "বন্ধ হোৱা পথ",
    sensorStations: "সক্ৰিয় ভূ-ছেন্সৰ",
    priorityDispatch: "জৰুৰী প্ৰেৰণ",
    submitReport: "বিপদৰ তথ্য প্ৰেৰণ কৰক",
    cameraCapture: "ছবি তোলক / আপল’ড কৰক",
    offlineQueueNotice: "ইন্টাৰনেট নাইনেকি? প্ৰতিবেদনবোৰ সংৰক্ষিত হ'ব আৰু নেট পালে আপোনা-আপুনি যাব।",
    safeDetour: "সুৰক্ষিত বিকল্প পথ",
    explainableAi: "এআই কাৰণ নিৰ্ণয়",
    viewFactors: "কাৰণসমূহ চাওক"
  },
  bn: {
    appTitle: "জিওসার্জ-এনইআর",
    subTitle: "এআই ভূমিধস আগাম সতর্কতা ও দুর্যোগ ব্যবস্থাপনা",
    navDashboard: "কমান্ড সেন্টার",
    navMap: "জিআইএস মানচিত্র",
    navEmergency: "জরুরি প্রতিক্রিয়া",
    navReport: "নাগরিক রিপোর্ট",
    navSensors: "সেন্সর মনিটর",
    statusOnline: "সরাসরি নেটওয়ার্ক",
    statusOffline: "অফলাইন মোড (সংরক্ষিত)",
    activeAlerts: "সক্রিয় সতর্কতা",
    criticalZones: "ঝুঁকিপূর্ণ ঢাল অঞ্চল",
    severedRoads: "অবরুদ্ধ মহাসড়ক",
    sensorStations: "সক্রিয় ভূ-সেন্সর",
    priorityDispatch: "জরুরি মোতায়েন",
    submitReport: "বিপদের তথ্য জমা দিন",
    cameraCapture: "ছবি তুলুন / আপলোড করুন",
    offlineQueueNotice: "ইন্টারনেট নেই? রিপোর্ট সংরক্ষিত থাকবে এবং নেটওয়ার্ক পেলে নিজে থেকেই যাবে।",
    safeDetour: "নিরাপদ বিকল্প পথ",
    explainableAi: "এআই কারণ বিশ্লেষণ",
    viewFactors: "ঝুঁকির কারণ দেখুন"
  },
  mzo: {
    appTitle: "GeoSurge-NER",
    subTitle: "AI hmanga leimin hriattirna leh enkawlna",
    navDashboard: "Thununna Hmun",
    navMap: "GIS Map",
    navEmergency: "Chhiatrupna Rang",
    navReport: "Mipui Thlenna",
    navSensors: "Sensor Enkawlna",
    statusOnline: "NETWORK THA",
    statusOffline: "OFFLINE AWM MEK",
    activeAlerts: "Hriattirna Awm Mek",
    criticalZones: "Hmun Hlauhawm Zual",
    severedRoads: "Kawng Ping",
    sensorStations: "Sensor Hman Mek",
    priorityDispatch: "Rang Taka Chetpui",
    submitReport: "Thil Hlauhawm Thlen Rawh",
    cameraCapture: "Thlalak / Thawnna",
    offlineQueueNotice: "Network a awm loh pawhin a inkhawl ang a, network neih veleh a kal ang.",
    safeDetour: "Kawng Him Zawk",
    explainableAi: "AI Chhan Hrilhfiahna",
    viewFactors: "Hlauhawmna Chhan En Rawh"
  }
};
