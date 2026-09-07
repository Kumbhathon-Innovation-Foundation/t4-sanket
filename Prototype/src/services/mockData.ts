import { Facility, FoodSpot, LocationPoint, ParkingLot, RouteStatus, HeritagePoi, MultimodalLeg } from '../types';

export const NASHIK_LOCATIONS: Record<string, LocationPoint> = {
  P09: {
    id: 'P09',
    name: 'Modi Ground Parking',
    name_hi: 'मोदी मैदान पार्किंग',
    name_mr: 'मोदी मैदान वाहनतळ',
    lat: 20.0061,
    lng: 73.8102,
    type: 'parking'
  },
  PANJARPOL: {
    id: 'PANJARPOL',
    name: 'Panjarpol Outer Staging Bay (Dhule NH3)',
    name_hi: 'पंजरपोळ बाह्य वाहनतळ (धुळे महामार्ग)',
    name_mr: 'पांजरपोळ बाह्य वाहनतळ (धुळे महामार्ग)',
    lat: 20.0350,
    lng: 73.8320,
    type: 'parking'
  },
  VALDEVI: {
    id: 'VALDEVI',
    name: 'Valdevi Outer Staging Bay (Mumbai NH3)',
    name_hi: 'वालदेवी बाह्य वाहनतळ (मुंबई महामार्ग)',
    name_mr: 'वालदेवी बाह्य वाहनतळ (मुंबई महामार्ग)',
    lat: 19.9210,
    lng: 73.7420,
    type: 'parking'
  },
  SINNAR: {
    id: 'SINNAR',
    name: 'Sinnar Staging Bay (Pune NH50)',
    name_hi: 'सिन्नर बाह्य वाहनतळ (पुणे महामार्ग)',
    name_mr: 'सिन्नर बाह्य वाहनतळ (पुणे महामार्ग)',
    lat: 19.9100,
    lng: 73.8500,
    type: 'parking'
  },
  RAMKUND: {
    id: 'RAMKUND',
    name: 'Ramkund Main Ghat',
    name_hi: 'रामकुंड मुख्य स्नान घाट',
    name_mr: 'रामकुंड मुख्य स्नान घाट',
    lat: 20.0085,
    lng: 73.7925,
    type: 'ghat'
  },
  TALKUTESHWAR: {
    id: 'TALKUTESHWAR',
    name: 'Talkuteshwar Ghat (Rule 1a Elder Friendly)',
    name_hi: 'तालकुटेश्वर घाट (वरिष्ठ व परिवार सुरक्षित)',
    name_mr: 'तालकुटेश्वर घाट (ज्येष्ठ नागरिक सुलभ)',
    lat: 20.0055,
    lng: 73.7918,
    type: 'ghat'
  },
  KALARAM: {
    id: 'KALARAM',
    name: 'Kalaram Sansthan Temple',
    name_hi: 'श्री काळाराम संस्थान मंदिर',
    name_mr: 'श्री काळाराम संस्थान मंदिर',
    lat: 20.0070,
    lng: 73.7952,
    type: 'temple'
  },
  SITA_GUFA: {
    id: 'SITA_GUFA',
    name: 'Sita Gufa',
    name_hi: 'सीता गुफा',
    name_mr: 'सीता गुंफा',
    lat: 20.0075,
    lng: 73.7961,
    type: 'temple'
  },
  R21_end: {
    id: 'R21_end',
    name: 'Panchavati Ghat',
    name_hi: 'पंचवटी घाट',
    name_mr: 'पंचवटी घाट',
    lat: 20.0083,
    lng: 73.7914,
    type: 'ghat'
  },
  R18_end: {
    id: 'R18_end',
    name: 'Tapovan Ghat',
    name_hi: 'तपोवन घाट',
    name_mr: 'तपोवन घाट',
    lat: 20.0000,
    lng: 73.8124,
    type: 'ghat'
  }
};

// Realistic walking paths for Nashik pilgrimage corridors
export const PRECOMPUTED_WALKING_PATHS: Record<string, [number, number][]> = {
  // R17: Modi Ground -> Riverside Road -> Ramkund (Direct, crowd-prone, restricted in demo)
  R17: [
    [20.0061, 73.8102],
    [20.0065, 73.8065],
    [20.0072, 73.8015],
    [20.0078, 73.7968],
    [20.0082, 73.7942],
    [20.0085, 73.7925]
  ],
  // R21: Modi Ground -> Panchavati Ghat -> Ramkund (Official diversion after override)
  R21: [
    [20.0061, 73.8102],
    [20.0082, 73.8080],
    [20.0095, 73.8020],
    [20.0098, 73.7950],
    [20.0083, 73.7914],
    [20.0085, 73.7925]
  ],
  // R18: Modi Ground -> Tapovan Ghat (Bypass corridor)
  R18: [
    [20.0061, 73.8102],
    [20.0040, 73.8115],
    [20.0020, 73.8120],
    [20.0000, 73.8124]
  ],
  // R_TALKUTESHWAR: Rule 1a Elder Friendly gentle ramp route
  R_TALKUTESHWAR: [
    [20.0061, 73.8102],
    [20.0058, 73.8040],
    [20.0054, 73.7970],
    [20.0055, 73.7918]
  ]
};

export const INITIAL_ROUTES: RouteStatus[] = [
  {
    route_id: 'R17',
    name: 'Modi Ground to Ramkund via Riverside Road',
    name_hi: 'मोदी मैदान से रामकुंड - मुख्य नदी तट मार्ग (R17)',
    name_mr: 'मोदी मैदान ते रामकुंड - मुख्य नदीकाठ मार्ग (R17)',
    destination: 'Ramkund Main Ghat',
    from_location: 'P09',
    to_location: 'RAMKUND',
    tier: 4,
    crowd: 'moderate',
    message_en: 'Direct riverside road. Normal flow. Estimated walk time: 14 minutes.',
    message_hi: 'सीधा नदी तट मार्ग। सामान्य प्रवाह। अनुमानित चलने का समय: १४ मिनट।',
    message_mr: 'थेट नदीकाठ मार्ग. सामान्य प्रवाह. चालण्याचा अंदाजे वेळ: १४ मिनिटे.',
    updated_by: 'Police Traffic Control HQ',
    updated_at: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    travel_time_min: 14,
    is_closed: false,
    color_code: '#2F7A6B',
    waypoints: PRECOMPUTED_WALKING_PATHS.R17
  },
  {
    route_id: 'R21',
    name: 'Modi Ground via Panchavati Ghat Diversion',
    name_hi: 'पंचवटी घाट वैकल्पिक वळण मार्ग (R21)',
    name_mr: 'पंचवटी घाट पर्यायी वळण मार्ग (R21)',
    destination: 'Ramkund via Panchavati Ghat',
    from_location: 'P09',
    to_location: 'R21_end',
    tier: 4,
    crowd: 'low',
    message_en: 'Designated official police diversion route. Wide pedestrian walkway, clear flow.',
    message_hi: 'आधिकारिक पुलिस डायवर्जन मार्ग। चौड़ा सुरक्षित पैदल पथ।',
    message_mr: 'अधिकृत पोलीस वळण मार्ग. रुंद व सुरक्षित पादचारी मार्ग.',
    updated_by: 'Crowd Safety Division',
    updated_at: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    travel_time_min: 18,
    is_closed: false,
    color_code: '#2F7A6B',
    waypoints: PRECOMPUTED_WALKING_PATHS.R21
  },
  {
    route_id: 'R18',
    name: 'Modi Ground to Tapovan Ghat Bypass Corridor',
    name_hi: 'मोदी मैदान से तपोवन घाट बाईपास (R18)',
    name_mr: 'मोदी मैदान ते तपोवन घाट बायपास (R18)',
    destination: 'Tapovan Ghat',
    from_location: 'P09',
    to_location: 'R18_end',
    tier: 4,
    crowd: 'low',
    message_en: 'Bypass corridor to Tapovan Ghat (~1.4 km). Low crowd density.',
    message_hi: 'तपोवन घाट बाईपास (१.४ किमी)। कम भीड़ वाला सुगम मार्ग।',
    message_mr: 'तपोवन घाट बायपास (१.४ किमी). कमी गर्दीचा सुरक्षित मार्ग.',
    updated_by: 'Tapovan Sector Police',
    updated_at: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    travel_time_min: 16,
    is_closed: false,
    color_code: '#2F7A6B',
    waypoints: PRECOMPUTED_WALKING_PATHS.R18
  },
  {
    route_id: 'R_TALKUTESHWAR',
    name: 'Rule 1a Safe Corridor: Modi Ground to Talkuteshwar Ghat',
    name_hi: 'नियम 1a वरिष्ठ सुगम मार्ग: तालकुटेश्वर घाट (R_TALK)',
    name_mr: 'नियम 1a ज्येष्ठ नागरिक सुगम कॉरिडॉर: तालकुटेश्वर घाट',
    destination: 'Talkuteshwar Ghat',
    from_location: 'P09',
    to_location: 'TALKUTESHWAR',
    tier: 4,
    crowd: 'low',
    message_en: 'Elderly & family safe corridor. Gentle wheelchair ramp, volunteer assistance, low crowd.',
    message_hi: 'वरिष्ठ नागरिकों व परिवारों के लिए सुगम मार्ग। व्हीलचेयर रैंप, स्वयंसेवक सहायता।',
    message_mr: 'ज्येष्ठ नागरिक व कुटुंबीयांसाठी सुलभ मार्ग. सौम्य उतार, स्वयंसेवक मदत.',
    updated_by: 'Special Crowd Care Cell',
    updated_at: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    travel_time_min: 12,
    is_closed: false,
    color_code: '#10B981',
    waypoints: PRECOMPUTED_WALKING_PATHS.R_TALKUTESHWAR
  }
];

export const MOCK_PARKING: ParkingLot[] = [
  {
    id: 'P09',
    name: 'Modi Ground Inner Parking (P09)',
    name_hi: 'मोदी मैदान वाहनतळ (P09)',
    name_mr: 'मोदी मैदान वाहनतळ (P09)',
    lat: 20.0061,
    lng: 73.8102,
    availability_pct: 68,
    distance_to_ghat_m: 1350,
    recommended_for: ['R17', 'R21', 'R18'],
    status: 'available'
  },
  {
    id: 'PANJARPOL',
    name: 'Panjarpol Outer Staging Bay (Dhule Highway NH3)',
    name_hi: 'पंजरपोळ बाह्य वाहनतळ (धुळे महामार्ग)',
    name_mr: 'पांजरपोळ बाह्य वाहनतळ (धुळे महामार्ग)',
    lat: 20.0350,
    lng: 73.8320,
    availability_pct: 82,
    distance_to_ghat_m: 7800,
    recommended_for: ['SHUTTLE_PANJARPOL'],
    status: 'available'
  },
  {
    id: 'VALDEVI',
    name: 'Valdevi Outer Staging Bay (Mumbai Highway NH3)',
    name_hi: 'वालदेवी बाह्य वाहनतळ (मुंबई महामार्ग)',
    name_mr: 'वालदेवी बाह्य वाहनतळ (मुंबई महामार्ग)',
    lat: 19.9210,
    lng: 73.7420,
    availability_pct: 74,
    distance_to_ghat_m: 11200,
    recommended_for: ['SHUTTLE_VALDEVI'],
    status: 'available'
  },
  {
    id: 'SINNAR',
    name: 'Sinnar Outer Staging Bay (Pune Highway NH50)',
    name_hi: 'सिन्नर बाह्य वाहनतळ (पुणे महामार्ग)',
    name_mr: 'सिन्नर बाह्य वाहनतळ (पुणे महामार्ग)',
    lat: 19.9100,
    lng: 73.8500,
    availability_pct: 90,
    distance_to_ghat_m: 14500,
    recommended_for: ['SHUTTLE_SINNAR'],
    status: 'available'
  }
];

export const MOCK_FACILITIES: Facility[] = [
  {
    id: 'FAC_1',
    name: 'Ramkund Ghat Block 2 Sanitation Complex',
    name_hi: 'रामकुंड ब्लॉक २ स्वच्छ शौचालय',
    name_mr: 'रामकुंड ब्लॉक २ स्वच्छतागृह',
    lat: 20.0084,
    lng: 73.7928,
    type: 'toilet',
    status: 'clean',
    distance_m: 140,
    queue_min: 3,
    last_verified_min_ago: 4,
    location_detail: 'Behind Ganga Mandir steps',
    location_detail_hi: 'गंगा मंदिर सीढ़ियों के पीछे',
    location_detail_mr: 'गंगा मंदिराच्या पायऱ्यांमागे',
    accessible: true
  },
  {
    id: 'FAC_2',
    name: 'Panchavati Ghat Mobile Sanitation Unit',
    name_hi: 'पंचवटी घाट जनसुविधा',
    name_mr: 'पंचवटी घाट जनसुविधा',
    lat: 20.0082,
    lng: 73.7918,
    type: 'toilet',
    status: 'clean',
    distance_m: 210,
    queue_min: 2,
    last_verified_min_ago: 5,
    location_detail: 'Near Panchavati Footbridge',
    location_detail_hi: 'पंचवटी फुटब्रिज के पास',
    location_detail_mr: 'पंचवटी पादचारी पुलाजवळ',
    accessible: true
  },
  {
    id: 'MED_1',
    name: 'Godavari Emergency Medical Camp & Triage',
    name_hi: 'गोदावरी आपातकालीन चिकित्सा छावनी',
    name_mr: 'गोदावरी आणीबाणी वैद्यकीय मदत केंद्र',
    lat: 20.0076,
    lng: 73.7948,
    type: 'medical',
    status: 'clean',
    distance_m: 180,
    queue_min: 1,
    last_verified_min_ago: 2,
    location_detail: 'Next to Red Cross Post',
    location_detail_hi: 'रेड क्रॉस पोस्ट के समीप',
    location_detail_mr: 'रेड क्रॉस पोस्टजवळ',
    accessible: true
  },
  {
    id: 'WATER_1',
    name: '4-Stage RO Chilled Drinking Water Booth',
    name_hi: '४-चरणीय आरओ शीतल पेयजल बूथ',
    name_mr: '४-टप्प्यांचे आरओ थंड पिण्याचे पाणी केंद्र',
    lat: 20.0080,
    lng: 73.7938,
    type: 'water',
    status: 'clean',
    distance_m: 90,
    queue_min: 1,
    last_verified_min_ago: 1,
    location_detail: 'Riverside promenade pole #14',
    location_detail_hi: 'नदी तट पोल क्रमांक १४',
    location_detail_mr: 'नदीकाठ खांब क्रमांक १४',
    accessible: true
  }
];

export const MOCK_FOOD: FoodSpot[] = [
  {
    id: 'FOOD_1',
    name: 'Sri Ram Seva Akhand Langar (Free Kitchen)',
    name_hi: 'श्री राम सेवा अखंड लंगर (निःशुल्क)',
    name_mr: 'श्री राम सेवा अखंड लंगर (मोफत)',
    lat: 20.0078,
    lng: 73.7940,
    type: 'free_langar',
    distance_m: 160,
    queue_min: 5,
    reference_price_inr: 0,
    items_en: 'Moong Khichdi, Kadhi, Sheera & Warm Tea (24x7)',
    items_hi: 'मूंग खिचड़ी, कढ़ी, शीरा एवं चाय (२४ घंटे)',
    items_mr: 'मूग खिचडी, कढी, शिरा आणि चहा (२४ तास)',
    last_verified_min_ago: 5
  },
  {
    id: 'FOOD_2',
    name: 'Godavari Trust Mahaprasad Kendra',
    name_hi: 'गोदावरी ट्रस्ट महाप्रसाद केंद्र',
    name_mr: 'गोदावरी ट्रस्ट महाप्रसाद केंद्र',
    lat: 20.0086,
    lng: 73.7935,
    type: 'subsidized_thali',
    distance_m: 290,
    queue_min: 4,
    reference_price_inr: 30,
    items_en: 'Satvik Thali: 4 Chapatis, Dal Tadka, Sabzi, Rice',
    items_hi: 'सात्विक थाली: ४ रोटी, दाल, सब्जी, चावल',
    items_mr: 'सात्विक थाळी: ४ पोळ्या, डाळ, भाजी, भात',
    last_verified_min_ago: 8
  }
];

// Heritage radar POIs with proactive voice cues
export const HERITAGE_POIS: HeritagePoi[] = [
  {
    id: 'KALARAM',
    name: 'Kalaram Sansthan Temple',
    name_hi: 'श्री काळाराम संस्थान मंदिर',
    name_mr: 'श्री काळाराम संस्थान मंदिर',
    distance_m: 55,
    lat: 20.0070,
    lng: 73.7952,
    audio_announcement: {
      en: 'Kalaram Temple is on your left, 55 meters away. Built in 1782 from black stone. Tap to visit.',
      hi: 'श्री काळाराम मंदिर आपके बाईं ओर ५५ मीटर की दूरी पर है। काले पत्थरों से निर्मित ऐतिहासिक मंदिर।',
      mr: 'काळाराम मंदिर आपल्या डाव्या बाजूला ५५ मीटर अंतरावर आहे. १७८२ मधील काळ्या पाषाणातील भव्य मंदिर.'
    },
    description: 'Ancient black-stone temple dedicated to Lord Rama, Lakshmana, and Sita.'
  },
  {
    id: 'SITA_GUFA',
    name: 'Sita Gufa (Caves)',
    name_hi: 'सीता गुफा',
    name_mr: 'सीता गुंफा',
    distance_m: 60,
    lat: 20.0075,
    lng: 73.7961,
    audio_announcement: {
      en: 'Sita Gufa is 60 meters ahead. Historical cave where Goddess Sita took shelter during exile.',
      hi: 'सीता गुफा ६० मीटर आगे है। वनवास काल की पवित्र गुफा।',
      mr: 'सीता गुंफा ६० मीटर पुढे आहे. वनवासातील माता सीतेचे पवित्र विश्रामस्थान.'
    },
    description: 'Sacred underground chamber venerated by pilgrims for thousands of years.'
  }
];

// 24-hour Ghat Crowd Forecast for Plan branch
export const HOURLY_CROWD_FORECAST = [
  { hour: '3:00 AM', crowd_pct: 22, level: 'low', label: 'Very Low (अति सुगम)' },
  { hour: '4:00 AM', crowd_pct: 35, level: 'low', label: 'Optimal Window (उत्तम स्नान वेळ)' },
  { hour: '5:00 AM', crowd_pct: 78, level: 'surge', label: 'Morning Aarti Rush (आरती गर्दी)' },
  { hour: '6:00 AM', crowd_pct: 92, level: 'surge', label: 'Peak Congestion (कमाल गर्दी)' },
  { hour: '7:00 AM', crowd_pct: 85, level: 'high', label: 'Heavy Queue (लांब रांगा)' },
  { hour: '8:00 AM', crowd_pct: 60, level: 'moderate', label: 'Moderate Flow (मध्यम प्रवाह)' },
  { hour: '9:00 AM', crowd_pct: 45, level: 'moderate', label: 'Steady (संतुलित)' },
  { hour: '10:00 AM', crowd_pct: 40, level: 'low', label: 'Clear Flow (सुगम)' }
];

// 4-Leg Multimodal Pilgrimage Lifecycle for ANUBHAV
export const INITIAL_MULTIMODAL_LEGS: MultimodalLeg[] = [
  {
    id: 'leg_1',
    leg_type: 'parking',
    title: 'Leg 1: Highway to Outer Parking Staging Bay',
    title_hi: 'चरण १: महामार्ग से पांजरपोळ बाह्य वाहनतळ',
    title_mr: 'टप्पा १: महामार्ग ते पांजरपोळ बाह्य वाहनतळ',
    subtitle: 'Dhule Highway NH3 • Panjarpol Bay #4B • 82% Free • ₹20 parking slip',
    duration_min: 25,
    cost_inr: 20,
    is_active: false,
    is_completed: true,
    badge: 'PARKED (गाडी उभी केली)'
  },
  {
    id: 'leg_2',
    leg_type: 'transit_shuttle',
    title: 'Leg 2: Feeder Electric Shuttle Bus',
    title_hi: 'चरण २: शासन इलेक्ट्रिक फीडर शटल बस',
    title_mr: 'टप्पा २: शासकीय इलेक्ट्रिक फीडर शटल बस',
    subtitle: 'Panjarpol Bay 4 ➔ Panchavati Inner Drop Point • Departs every 5 mins',
    duration_min: 18,
    cost_inr: 15,
    is_active: false,
    is_completed: true,
    badge: 'SHUTTLE TAKEN (बस प्रवास पूर्ण)'
  },
  {
    id: 'leg_3',
    leg_type: 'walk',
    title: 'Leg 3: Crowd-Aware Pedestrian Corridor',
    title_hi: 'चरण ३: गर्दी-मुक्त सुरक्षित पैदल पथ',
    title_mr: 'टप्पा ३: सुरक्षित पादचारी कॉरिडॉर',
    subtitle: 'Riverside Walkway R17 ➔ Direct Ramkund Snan Ghat • 14 min walk',
    duration_min: 14,
    cost_inr: 0,
    is_active: true,
    is_completed: false,
    badge: 'ACTIVE WALK (सध्या पायी सुरू)'
  },
  {
    id: 'leg_4',
    leg_type: 'visit',
    title: 'Leg 4: Sacred Snan & Kalaram Darshan',
    title_hi: 'चरण ४: पवित्र स्नान एवं काळाराम दर्शन',
    title_mr: 'टप्पा ४: पवित्र स्नान व काळाराम दर्शन',
    subtitle: 'Ramkund Main Ghat • Expected queue: 10 mins • Clean water depth: 4.2 ft',
    duration_min: 30,
    cost_inr: 0,
    is_active: false,
    is_completed: false,
    badge: 'DESTINATION (पवित्र स्नान घाट)'
  }
];
