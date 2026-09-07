import { AgentResponse, SupportedLanguage, RouteStatus } from '../types';
import { realtimeHub } from './realtimeHub';
import { MOCK_FACILITIES, MOCK_FOOD, MOCK_PARKING } from './mockData';

export interface SessionContext {
  destination: string;
  arrivalTime: string;
  activeRouteId: string;
  lastQueryType?: 'journey' | 'facility' | 'food' | 'advisory';
  preferredLang: SupportedLanguage;
}

class AgentEngineService {
  private context: SessionContext = {
    destination: 'Ramkund Main Ghat',
    arrivalTime: '4:00 AM',
    activeRouteId: 'R17',
    preferredLang: 'hi'
  };

  public getContext(): SessionContext {
    return { ...this.context };
  }

  public setLanguage(lang: SupportedLanguage) {
    this.context.preferredLang = lang;
  }

  public detectLanguage(text: string): SupportedLanguage {
    const marathiWords = ['आलो', 'वाजता', 'कुठे', 'आहे', 'स्वच्छतागृह', 'जेवण', 'टाळ', 'सांगा', 'कसे', 'पर्यायी', 'वळण', 'सावध', 'हवे'];
    const hindiWords = ['बजे', 'आऊँ', 'कहाँ', 'है', 'खाना', 'भीड़', 'चाहिए', 'सुगम'];

    if (marathiWords.some((w) => text.includes(w))) {
      return 'mr';
    }
    if (hindiWords.some((w) => text.includes(w))) {
      return 'hi';
    }

    const hasDevanagari = /[\u0900-\u097F]/.test(text);
    if (hasDevanagari) {
      return this.context.preferredLang || 'hi';
    }

    if (/[a-zA-Z]/.test(text)) {
      return 'en';
    }

    return this.context.preferredLang || 'hi';
  }

  public processQuery(queryText: string, forcedLang?: SupportedLanguage): AgentResponse {
    const rawQuery = queryText.trim().toLowerCase();
    const lang = forcedLang || this.detectLanguage(rawQuery);
    this.context.preferredLang = lang;

    const routes = realtimeHub.getRoutes();

    // 0. Return to Parking ("Where is my car?", "Way back to my parking lot", "गाडीकडे परत", "वाहनतळ")
    if (
      rawQuery.includes('car') ||
      rawQuery.includes('return') ||
      rawQuery.includes('way back') ||
      rawQuery.includes('गाडी') ||
      rawQuery.includes('वाहन') ||
      rawQuery.includes('परत')
    ) {
      this.context.lastQueryType = 'journey';
      return this.handleReturnToParkingQuery(lang);
    }

    // 0b. Rule 1a Elderly & Family Protection ("elderly", "seniors", "parents", "वरिष्ठ", "आजोबा", "आजी", "वृद्ध", "बच्चे")
    if (
      rawQuery.includes('elder') ||
      rawQuery.includes('senior') ||
      rawQuery.includes('parent') ||
      rawQuery.includes('वरिष्ठ') ||
      rawQuery.includes('आजोबा') ||
      rawQuery.includes('आजी') ||
      rawQuery.includes('वृद्ध') ||
      rawQuery.includes('बच्चे') ||
      rawQuery.includes('child') ||
      rawQuery.includes('wheelchair') ||
      rawQuery.includes('rule 1a') ||
      rawQuery.includes('नियम 1a')
    ) {
      this.context.lastQueryType = 'journey';
      return this.handleRule1aElderQuery(lang, routes);
    }

    // 1. Check for Re-planning ("What if I arrive at 5?", "अगर ५ बजे आऊँ", "५ वाजता आलो तर")
    if (
      rawQuery.includes('5') ||
      rawQuery.includes('५') ||
      rawQuery.includes('5 am') ||
      rawQuery.includes('5 बजे') ||
      rawQuery.includes('५ वाजता') ||
      (rawQuery.includes('what if') && (rawQuery.includes('later') || rawQuery.includes('time')))
    ) {
      this.context.arrivalTime = '5:00 AM';
      this.context.lastQueryType = 'journey';
      return this.handleReplanningQuery(lang, routes);
    }

    // 2. Check for Safety / Road closure advisory ("Anything I should avoid?", "avoid", "caution", "बंद", "टाळावे", "नियम")
    if (
      rawQuery.includes('avoid') ||
      rawQuery.includes('safe') ||
      rawQuery.includes('advisory') ||
      rawQuery.includes('टाळा') ||
      rawQuery.includes('सावधान') ||
      rawQuery.includes('बंद') ||
      rawQuery.includes('danger') ||
      rawQuery.includes('alert')
    ) {
      this.context.lastQueryType = 'advisory';
      return this.handleSafetyAdvisoryQuery(lang, routes);
    }

    // 3. Check for Facility / Toilet / Water
    if (
      rawQuery.includes('toilet') ||
      rawQuery.includes('washroom') ||
      rawQuery.includes('restroom') ||
      rawQuery.includes('शौचालय') ||
      rawQuery.includes('स्वच्छता') ||
      rawQuery.includes('टॉयलेट') ||
      rawQuery.includes('bathroom') ||
      rawQuery.includes('पाणी') ||
      rawQuery.includes('पानी')
    ) {
      this.context.lastQueryType = 'facility';
      return this.handleFacilityQuery(lang, rawQuery);
    }

    // 4. Check for Food / Langar / Fair price
    if (
      rawQuery.includes('food') ||
      rawQuery.includes('eat') ||
      rawQuery.includes('langar') ||
      rawQuery.includes('meal') ||
      rawQuery.includes('खाना') ||
      rawQuery.includes('लंगर') ||
      rawQuery.includes('जेवण') ||
      rawQuery.includes('भोजन') ||
      rawQuery.includes('प्रसाद') ||
      rawQuery.includes('भूक') ||
      rawQuery.includes('swast') ||
      rawQuery.includes('सस्ता')
    ) {
      this.context.lastQueryType = 'food';
      return this.handleFoodQuery(lang);
    }

    // 5. Default / Initial Journey Planning (4 AM)
    this.context.lastQueryType = 'journey';
    this.context.arrivalTime = '4:00 AM';
    return this.handleJourneyPlanningQuery(lang, routes);
  }

  // --- QUERY HANDLERS ---

  private handleJourneyPlanningQuery(lang: SupportedLanguage, routes: RouteStatus[]): AgentResponse {
    // R17: Modi Ground -> Ramkund Riverside Road (direct, normal, but gets restricted)
    const primaryRoute = routes.find((r) => r.route_id === 'R17') || routes[0];
    const detourRoute = routes.find((r) => r.route_id === 'R21') || routes[1];
    const parkingP09 = MOCK_PARKING.find((p) => p.id === 'P09') || MOCK_PARKING[0];

    // If primary route is restricted by tactical police order (Tier <= 2)
    if (primaryRoute.tier <= 2 || primaryRoute.is_closed) {
      return this.generateDetourResponse(lang, primaryRoute, detourRoute);
    }

    this.context.activeRouteId = 'R17';

    if (lang === 'mr') {
      return {
        type: 'journey',
        language: 'mr',
        title: 'पहाटे ४:०० — रामकुंड स्नान व दर्शन मार्ग',
        summary: 'मोदी मैदान (P09) येथे वाहन उभे करा (६८% जागा उपलब्ध). थेट नदीकाठ मार्गाने (R17) १४ मिनिटांत रामकुंडावर पोहोचा.',
        speak_text:
          'पहाटे चार वाजता गर्दी कमी असेल. मोदी मैदान वाहनतळ पी शून्य नऊ वापरा आणि नदीकाठ मार्गाने जा. १४ मिनिटे लागतील.',
        primary_metric: '१४ मिनिटे',
        primary_metric_label: 'चालण्याचा वेळ • गर्दी: मध्यम',
        route_data: {
          primary_route: primaryRoute,
          alternative_route: detourRoute,
          parking: parkingP09,
          steps: [
            'मोदी मैदान वाहनतळ (P09) येथे वाहन उभे करा',
            'गोदावरी नदीकाठ पदपथाने (R17) पुढे चला',
            'रामकुंड मुख्य स्नान घाटावर सुरक्षित पोहोचा'
          ],
          is_diverted: false
        },
        timestamp: new Date().toLocaleTimeString()
      };
    }

    if (lang === 'hi') {
      return {
        type: 'journey',
        language: 'hi',
        title: 'प्रातः ४:०० — रामकुंड स्नान एवं दर्शन मार्ग',
        summary: 'मोदी मैदान (P09) में वाहन पार्क करें (६८% खाली)। मुख्य नदी तट मार्ग (R17) से १४ मिनट में सुगम स्नान।',
        speak_text:
          'प्रातः चार बजे भीड़ सामान्य है। मोदी मैदान पार्किंग पी शून्य नौ का उपयोग करें और नदी तट मार्ग से जाएं। केवल १४ मिनट लगेंगे।',
        primary_metric: '१४ मिनट',
        primary_metric_label: 'पैदल समय • भीड़: सामान्य',
        route_data: {
          primary_route: primaryRoute,
          alternative_route: detourRoute,
          parking: parkingP09,
          steps: [
            'मोदी मैदान (P09) में वाहन सुरक्षित लगाएं',
            'गोदावरी नदी तट मार्ग (R17) से पैदल आगे बढ़ें',
            'सीधे रामकुंड मुख्य स्नान घाट पहुंचें'
          ],
          is_diverted: false
        },
        timestamp: new Date().toLocaleTimeString()
      };
    }

    return {
      type: 'journey',
      language: 'en',
      title: '4:00 AM — Ramkund Snan & Darshan Route',
      summary: 'Park at Modi Ground (P09, 68% available). Proceed via direct riverside road (R17, 14 min walk).',
      speak_text:
        'For 4 AM arrival, crowd density is low. Park at Modi Ground P09 and take the riverside road R17. Walk time is 14 minutes.',
      primary_metric: '14 min walk',
      primary_metric_label: 'Crowd: Moderate • P09 68% Free',
      route_data: {
        primary_route: primaryRoute,
        alternative_route: detourRoute,
        parking: parkingP09,
        steps: [
          'Park at Modi Ground Parking (P09)',
          'Follow Godavari Riverside walkway (R17)',
          'Arrive directly at Ramkund Main Snan Ghat'
        ],
        is_diverted: false
      },
      timestamp: new Date().toLocaleTimeString()
    };
  }

  private handleReplanningQuery(lang: SupportedLanguage, routes: RouteStatus[]): AgentResponse {
    const primaryRoute = routes.find((r) => r.route_id === 'R17') || routes[0];
    const detourRoute = routes.find((r) => r.route_id === 'R21') || routes[1];
    const bypassRoute = routes.find((r) => r.route_id === 'R18') || routes[2];
    const parkingP09 = MOCK_PARKING.find((p) => p.id === 'P09') || MOCK_PARKING[0];

    if (primaryRoute.tier <= 2 || primaryRoute.is_closed) {
      return this.generateDetourResponse(lang, primaryRoute, detourRoute, '5:00 AM');
    }

    if (lang === 'mr') {
      return {
        type: 'journey',
        language: 'mr',
        title: 'पुनर्नियोजन: पहाटे ५:०० आगमन',
        summary: '५:०० वाजता गर्दी ३५% वाढते. नदीकाठ मार्गावर २२ मिनिटे लागतील. तपोवन घाट बायपास (R18) किंवा पंचवटी वळण (R21) अधिक सोयीचे ठरेल.',
        speak_text:
          'तुम्ही पाच वाजता आलात तर गर्दी वाढलेली असेल. थेट मार्गाऐवजी पंचवटी वळण मार्ग किंवा तपोवन बायपास निवडणे सुरक्षित ठरेल.',
        primary_metric: '+८ मिनिटे',
        primary_metric_label: 'गर्दी वाढ • एकूण वेळ: २२ मिनिटे',
        route_data: {
          primary_route: detourRoute,
          alternative_route: primaryRoute,
          parking: parkingP09,
          steps: [
            'पहाटे ५:०० नंतर आरतीमुळे गर्दी वाढते',
            'पंचवटी घाट वळण मार्ग (R21) वापरा',
            'नदीकाठचा मुख्य अडथळा टाळून सुरक्षित स्नान करा'
          ],
          is_diverted: false
        },
        timestamp: new Date().toLocaleTimeString()
      };
    }

    if (lang === 'hi') {
      return {
        type: 'journey',
        language: 'hi',
        title: 'पुनर्नियोजन: प्रातः ५:०० बजे आगमन',
        summary: '५:०० बजे स्नानार्थियों की संख्या में ३५% वृद्धि। मुख्य मार्ग पर २२ मिनट लगेंगे। पंचवटी वळण मार्ग (R21) अधिक सुगम रहेगा।',
        speak_text:
          'पांच बजे आने पर आरती के कारण भीड़ बढ़ेगी। मुख्य मार्ग के बजाय पंचवटी वळण मार्ग लें, इससे कतार में कम समय लगेगा।',
        primary_metric: '+८ मिनट',
        primary_metric_label: 'भीड़ वृद्धि • कुल समय: २२ मिनट',
        route_data: {
          primary_route: detourRoute,
          alternative_route: primaryRoute,
          parking: parkingP09,
          steps: [
            'प्रातः ५ बजे भीड़ बढ़ने की संभावना, समय से पूर्व प्रस्थान करें',
            'पंचवटी घाट वळण मार्ग (R21) से मुख्य बॉटलनेक से बचें',
            'सुगमता से रामकुंड मुख्य स्नान घाट पहुंचें'
          ],
          is_diverted: false
        },
        timestamp: new Date().toLocaleTimeString()
      };
    }

    return {
      type: 'journey',
      language: 'en',
      title: 'Re-planning: 5:00 AM Arrival Window',
      summary: 'At 5:00 AM, crowd density increases +35%. Direct riverside road queue rises to 22 min. Recommend Panchavati Ghat diversion (R21).',
      speak_text:
        'If you arrive at 5 AM, morning aarti crowd will add 8 minutes. We recommend switching to the Panchavati Ghat diversion R21 to bypass bottlenecks.',
      primary_metric: '+8 min delay',
      primary_metric_label: 'Crowd Surge: High • Walk: 22 min',
      route_data: {
        primary_route: detourRoute,
        alternative_route: primaryRoute,
        parking: parkingP09,
        steps: [
          'Expect heavy morning aarti rush between 5:00 - 6:30 AM',
          'Use Panchavati Ghat diversion corridor (R21)',
          'Bypass the direct riverside bottleneck'
        ],
        is_diverted: false
      },
      timestamp: new Date().toLocaleTimeString()
    };
  }

  private handleFacilityQuery(lang: SupportedLanguage, rawQuery: string): AgentResponse {
    const isWater = rawQuery.includes('पानी') || rawQuery.includes('पाणी') || rawQuery.includes('water');
    const facilities = isWater
      ? MOCK_FACILITIES.filter((f) => f.type === 'water')
      : MOCK_FACILITIES.filter((f) => f.type === 'toilet' && f.status === 'clean');

    const bestFacility = facilities[0] || MOCK_FACILITIES[0];

    if (lang === 'mr') {
      return {
        type: 'facility',
        language: 'mr',
        title: 'जवळचे स्वच्छ स्वच्छतागृह',
        summary: `${bestFacility.name_mr} • १४० मीटर अंतरावर • रांग फक्त ३ मिनिटे • ४ मिनिटांपूर्वी तपासणी`,
        speak_text:
          'रामकुंड ब्लॉक दोन येथे अतिशय स्वच्छ स्वच्छतागृह उपलब्ध आहे. केवळ १४० मीटर अंतर असून रांगेत ३ मिनिटे लागतील.',
        primary_metric: '३ मिनिटे रांग',
        primary_metric_label: '१४० मी अंतर • स्वच्छता: उत्तम',
        facility_data: MOCK_FACILITIES,
        timestamp: new Date().toLocaleTimeString()
      };
    }

    if (lang === 'hi') {
      return {
        type: 'facility',
        language: 'hi',
        title: 'निकटतम स्वच्छ शौचालय',
        summary: `${bestFacility.name_hi} • १४० मीटर दूरी • कतार केवल ३ मिनट • ४ मिनट पूर्व सत्यापित`,
        speak_text:
          'रामकुंड ब्लॉक दो पर सबसे स्वच्छ शौचालय है। गंगा मंदिर के पीछे १४० मीटर की दूरी पर है और कतार केवल ३ मिनट की है।',
        primary_metric: '३ मिनट कतार',
        primary_metric_label: '१४० मी दूरी • स्वच्छता: उत्कृष्ट',
        facility_data: MOCK_FACILITIES,
        timestamp: new Date().toLocaleTimeString()
      };
    }

    return {
      type: 'facility',
      language: 'en',
      title: 'Nearest Clean Sanitation Facility',
      summary: `${bestFacility.name} • 140m away • 3 min queue • Verified 4 min ago by sanitation team.`,
      speak_text:
        'The cleanest low-queue toilet is at Ramkund Block 2 behind Ganga Temple, 140 meters away. Current wait time is under 3 minutes.',
      primary_metric: '3 min queue',
      primary_metric_label: '140m away • Status: Clean & Verified',
      facility_data: MOCK_FACILITIES,
      timestamp: new Date().toLocaleTimeString()
    };
  }

  private handleFoodQuery(lang: SupportedLanguage): AgentResponse {
    if (lang === 'mr') {
      return {
        type: 'food',
        language: 'mr',
        title: 'स्नानानंतर सात्विक अन्न व लंगर',
        summary: 'श्री राम सेवा अखंड लंगर (मोफत, १६० मी) व गोदावरी महाप्रसाद केंद्र (अधिकृत संदर्भ दर: ₹३०, २९० मी).',
        speak_text:
          'स्नानानंतर १६० मीटरवर मोफत अखंड लंगर उपलब्ध आहे. तसेच गोदावरी ट्रस्ट येथे ३० रुपये संदर्भ दरात सात्विक थाळी मिळेल.',
        primary_metric: 'संदर्भ दर: ₹० - ₹३०',
        primary_metric_label: 'अंतर: १६० मी • रांग: ५ मिनिटे',
        food_data: MOCK_FOOD,
        timestamp: new Date().toLocaleTimeString()
      };
    }

    if (lang === 'hi') {
      return {
        type: 'food',
        language: 'hi',
        title: 'स्नान के पश्चात सात्विक भोजन व लंगर',
        summary: 'श्री राम सेवा अखंड लंगर (निःशुल्क, १६० मी) एवं गोदावरी महाप्रसाद केंद्र (आधिकारिक संदर्भ दर: ₹३०, २९० मी)।',
        speak_text:
          'स्नान के बाद १६० मीटर पर श्री राम सेवा अखंड लंगर में निःशुल्क खिचड़ी और चाय उपलब्ध है। पास में ३० रुपये में सात्विक थाली भी है।',
        primary_metric: 'संदर्भ दर: ₹० - ₹३०',
        primary_metric_label: 'दूरी: १६० मी • कतार: ५ मिनट',
        food_data: MOCK_FOOD,
        timestamp: new Date().toLocaleTimeString()
      };
    }

    return {
      type: 'food',
      language: 'en',
      title: 'Post-Snan Food & Fair Price Langar',
      summary: 'Sri Ram Seva Akhand Langar (Free, 160m) & Godavari Mahaprasad (Official Reference Price: ₹30, 290m).',
      speak_text:
        'For fresh food after snan, Sri Ram Seva Akhand Langar is 160 meters away offering free hot prasad. Godavari Kendra offers a ₹30 reference price thali.',
      primary_metric: 'Ref Price: ₹0 - ₹30',
      primary_metric_label: 'Distance: 160m • Queue: 5 min',
      food_data: MOCK_FOOD,
      timestamp: new Date().toLocaleTimeString()
    };
  }

  private handleSafetyAdvisoryQuery(lang: SupportedLanguage, routes: RouteStatus[]): AgentResponse {
    const closedRoutes = routes.filter((r) => r.tier <= 2 || r.is_closed);
    const detourRoute = routes.find((r) => r.route_id === 'R21') || routes[1];

    if (closedRoutes.length > 0) {
      return this.generateDetourResponse(lang, closedRoutes[0], detourRoute);
    }

    if (lang === 'mr') {
      return {
        type: 'advisory',
        language: 'mr',
        title: 'सुरक्षा सल्लागार: सर्व प्रमुख मार्ग खुले',
        summary: 'सध्या कोणताही मार्ग बंद नाही. सर्व घाट सुरळीत सुरू आहेत. अधिकृत पोलीस मार्गदर्शक सूचना पाळा.',
        speak_text:
          'सध्या सर्व प्रमुख मार्ग सुरक्षित आणि खुले आहेत. पोलिसांनी कोणतीही बंदी घातलेली नाही. कृपया स्वयंसेवकांच्या सूचनांचे पालन करा.',
        primary_metric: 'सर्व मार्ग सुरक्षित',
        primary_metric_label: 'Tier 4: सामान्य स्थिती',
        advisories: routes,
        timestamp: new Date().toLocaleTimeString()
      };
    }

    if (lang === 'hi') {
      return {
        type: 'advisory',
        language: 'hi',
        title: 'सुरक्षा परामर्श: सभी मार्ग खुले एवं सामान्य',
        summary: 'वर्तमान में कोई भी मार्ग प्रतिबंधित नहीं है। सभी घाट सुचारू रूप से संचालित हैं। अधिकृत पुलिस साइनेज का पालन करें।',
        speak_text:
          'वर्तमान में कोई मार्ग बंद नहीं है। सभी स्नान घाट खुले हैं। पुलिस प्रशासन के दिशानिर्देशों का पालन करते रहें।',
        primary_metric: 'सभी मार्ग सुरक्षित',
        primary_metric_label: 'Tier 4: सामान्य प्रवाह',
        advisories: routes,
        timestamp: new Date().toLocaleTimeString()
      };
    }

    return {
      type: 'advisory',
      language: 'en',
      title: 'Safety Advisory: All Primary Routes Open',
      summary: 'No active police emergency closures. All riverfront corridors operating under standard Tier 4 conditions.',
      speak_text:
        'All primary pilgrimage corridors are currently open and safe under normal Tier 4 operation. No police restrictions are in effect.',
      primary_metric: 'All Clear (Tier 4)',
      primary_metric_label: '0 Tactical Closures Active',
      advisories: routes,
      timestamp: new Date().toLocaleTimeString()
    };
  }

  // --- INSTANT RE-ROUTE DETOUR GENERATION (R17 Closed -> R21 Detour) ---

  public generateDetourResponse(
    lang: SupportedLanguage,
    closedRoute: RouteStatus,
    openDetourRoute: RouteStatus,
    targetTime?: string
  ): AgentResponse {
    this.context.activeRouteId = openDetourRoute.route_id;
    const detourReason = closedRoute.closure_reason || closedRoute.message_en || 'VIP Procession & Severe Crowd Surge';

    if (lang === 'mr') {
      return {
        type: 'reroute',
        language: 'mr',
        title: 'पोलीस आदेश: तात्काळ वळण मार्ग (R21)',
        summary: `पोलीस नियंत्रण कक्षाने ${closedRoute.name_mr} बंद केला आहे (${detourReason}). त्वरित पंचवटी घाट वळण मार्ग (R21) वापरा.`,
        speak_text: `सावधान! पोलीस नियंत्रण कक्षाने थेट नदीकाठ मार्ग बंद केला आहे. कृपया तात्काळ पंचवटी घाट वळण मार्ग वापरा. तो सुरक्षित आणि खुला आहे.`,
        primary_metric: 'नवीन मार्ग: १८ मिनिटे',
        primary_metric_label: 'थेट मार्ग बंद • पंचवटी वळण खुला',
        route_data: {
          primary_route: openDetourRoute,
          alternative_route: closedRoute,
          steps: [
            '⛔ थेट नदीकाठ मार्ग (R17) पोलीस सुरक्षेसाठी पूर्णपणे बंद आहे',
            '➡️ लगेच उजवीकडे वळा आणि पंचवटी घाट मार्गाचे (R21) अनुसरण करा',
            '✅ पंचवटी घाट पादचारी पुलावरून सुरक्षितपणे रामकुंड घाटावर पोहोचा'
          ],
          is_diverted: true,
          detour_reason: detourReason
        },
        timestamp: new Date().toLocaleTimeString()
      };
    }

    if (lang === 'hi') {
      return {
        type: 'reroute',
        language: 'hi',
        title: 'पुलिस आदेश: तत्काल डायवर्जन मार्ग (R21)',
        summary: `पुलिस नियंत्रण कक्ष द्वारा ${closedRoute.name_hi} बंद कर दिया गया है (${detourReason})। कृपया पंचवटी घाट डायवर्जन (R21) लें।`,
        speak_text: `सावधान! पुलिस नियंत्रण कक्ष ने मुख्य नदी तट मार्ग बंद कर दिया है। कृपया तत्काल पंचवटी घाट डायवर्जन मार्ग लें। यह मार्ग पूर्णतः सुरक्षित और खुला है।`,
        primary_metric: 'नया मार्ग: १८ मिनट',
        primary_metric_label: 'मुख्य मार्ग बंद • पंचवटी डायवर्जन खुला',
        route_data: {
          primary_route: openDetourRoute,
          alternative_route: closedRoute,
          steps: [
            '⛔ मुख्य नदी तट मार्ग (R17) पुलिस आदेश द्वारा पूर्णतः बंद है',
            '➡️ तुरंत दाईं ओर मुड़ें और पंचवटी घाट मार्ग (R21) का अनुसरण करें',
            '✅ पंचवटी घाट होते हुए सुरक्षित रामकुंड स्नान घाट पहुंचें'
          ],
          is_diverted: true,
          detour_reason: detourReason
        },
        timestamp: new Date().toLocaleTimeString()
      };
    }

    return {
      type: 'reroute',
      language: 'en',
      title: 'Police Override: Live Route Detour Active (R21)',
      summary: `Police Command has closed ${closedRoute.name} (${detourReason}). Diverted to Panchavati Ghat Route (R21).`,
      speak_text: `Attention! Police have force-closed the direct riverside route. You are being re-routed via Panchavati Ghat diversion R21.`,
      primary_metric: 'New Route: 18 min',
      primary_metric_label: 'R17 Blocked • R21 Detour Clear',
      route_data: {
        primary_route: openDetourRoute,
        alternative_route: closedRoute,
        steps: [
          '⛔ Direct riverside road (R17) is blocked by Police Tactical Order',
          '➡️ Turn right immediately following Panchavati Ghat diversion signage',
          '✅ Reach Ramkund via clear pedestrian walkway'
        ],
        is_diverted: true,
        detour_reason: detourReason
      },
      timestamp: new Date().toLocaleTimeString()
    };
  }

  // --- RULE 1A: ELDERLY & FAMILY PROTECTION ENGINE ---
  private handleRule1aElderQuery(lang: SupportedLanguage, routes: RouteStatus[]): AgentResponse {
    const talkuteshwarRoute = routes.find((r) => r.route_id === 'R_TALKUTESHWAR') || {
      route_id: 'R_TALKUTESHWAR',
      name: 'Rule 1a Safe Corridor: Modi Ground to Talkuteshwar Ghat',
      name_hi: 'नियम 1a वरिष्ठ सुगम मार्ग: तालकुटेश्वर घाट',
      name_mr: 'नियम 1a ज्येष्ठ नागरिक सुगम कॉरिडॉर: तालकुटेश्वर घाट',
      destination: 'Talkuteshwar Ghat',
      from_location: 'P09',
      to_location: 'TALKUTESHWAR',
      tier: 4 as const,
      crowd: 'low' as const,
      message_en: 'Elderly safe corridor: gentle wheelchair ramp, volunteer escort, safe water flow.',
      message_hi: 'वरिष्ठ नागरिकों व बच्चों के लिए सुगम मार्ग। मंद ढलान, स्वयंसेवक सहायता।',
      message_mr: 'ज्येष्ठ नागरिक व कुटुंबीयांसाठी सुलभ मार्ग. सौम्य उतार, स्वयंसेवक मदत.',
      updated_by: 'Special Crowd Care Cell',
      updated_at: new Date().toLocaleTimeString(),
      travel_time_min: 12,
      is_closed: false,
      color_code: '#10B981'
    };

    const ramkundRoute = routes.find((r) => r.route_id === 'R17') || routes[0];

    if (lang === 'mr') {
      return {
        type: 'journey',
        language: 'mr',
        title: 'नियम 1a सक्रिय: ज्येष्ठ नागरिक व कुटुंब सुरक्षित स्नान',
        summary: 'रामकुंडावर आरतीमुळे ४५ मिनिटांची गर्दी आहे. ज्येष्ठांसाठी तालकुटेश्वर घाट (१२ मिनिटे, सौम्य रॅम्प, स्वयंसेवक मदत) सर्वात सुरक्षित आहे.',
        speak_text: 'आपल्यासोबत ज्येष्ठ नागरिक किंवा लहान मुले असल्याने नियम १-ए नुसार तालकुटेश्वर घाट सुचवला आहे. येथे पायऱ्यांऐवजी सौम्य रॅम्प आणि स्वयंसेवक मदत उपलब्ध आहे.',
        primary_metric: '१२ मिनिटे • सौम्य रॅम्प',
        primary_metric_label: 'नियम 1a सुरक्षा सक्रिय • गर्दी: अतिशय कमी',
        route_data: {
          primary_route: talkuteshwarRoute,
          alternative_route: ramkundRoute,
          steps: [
            '🛡️ नियम 1a सक्रिय: ज्येष्ठ नागरिक व लहान मुलांसाठी सुरक्षित मार्ग',
            '♿ सौम्य रॅम्प पदपथ वापरा (पायऱ्या टाळल्या आहेत)',
            '🚩 तालकुटेश्वर घाटावर स्वयंसेवक सहायता केंद्र उपलब्ध आहे'
          ],
          is_diverted: true,
          detour_reason: 'Rule 1a: Elderly & Family Crowd-Protection Directive'
        },
        timestamp: new Date().toLocaleTimeString()
      };
    }

    if (lang === 'hi') {
      return {
        type: 'journey',
        language: 'hi',
        title: 'नियम 1a सक्रिय: वरिष्ठ नागरिक एवं परिवार सुगम स्नान',
        summary: 'रामकुंड पर अत्यधिक भीड़ (४५ मिनट कतार) है। वरिष्ठों के लिए तालकुटेश्वर घाट (१२ मिनट, मंद रैंप, स्वयंसेवक सहायता) सर्वश्रेष्ठ विकल्प है।',
        speak_text: 'आपके साथ वरिष्ठ नागरिक या बच्चे होने के कारण नियम १-ए के तहत तालकुटेश्वर घाट अनुशंसित है। यहाँ सीढ़ियों के बजाय सुगम रैंप और स्वयंसेवक सहायता है।',
        primary_metric: '१२ मिनट • सुगम रैंप',
        primary_metric_label: 'नियम 1a सुरक्षा सक्रिय • भीड़: कम',
        route_data: {
          primary_route: talkuteshwarRoute,
          alternative_route: ramkundRoute,
          steps: [
            '🛡️ नियम 1a सक्रिय: वरिष्ठों व बच्चों के लिए सुरक्षित कॉरिडोर',
            '♿ व्हीलचेयर एवं मंद ढलान रैंप पथ का उपयोग करें',
            '🚩 तालकुटेश्वर घाट पर समर्पित स्वयंसेवक सहायता उपलब्ध'
          ],
          is_diverted: true,
          detour_reason: 'Rule 1a: Elderly & Family Crowd-Protection Directive'
        },
        timestamp: new Date().toLocaleTimeString()
      };
    }

    return {
      type: 'journey',
      language: 'en',
      title: 'Rule 1a Active: Elderly & Family Protected Route',
      summary: 'Ramkund queue is 45+ mins. Rule 1a recommends Talkuteshwar Ghat (12 min walk, gentle wheelchair ramp, dedicated volunteer escort).',
      speak_text: 'Because you are traveling with seniors or children, Rule 1a recommends Talkuteshwar Ghat. It has gentle ramp access, low crowd density, and volunteer assistance.',
      primary_metric: '12 min walk',
      primary_metric_label: 'Rule 1a Protection • Gentle Ramp Access',
      route_data: {
        primary_route: talkuteshwarRoute,
        alternative_route: ramkundRoute,
        steps: [
          '🛡️ Rule 1a Activated: Elderly & Child Crowd Hazard Protection',
          '♿ Follow dedicated ramp corridor (bypasses slippery stairs)',
          '🚩 Arrive at Talkuteshwar Ghat with dedicated volunteer assistance'
        ],
        is_diverted: true,
        detour_reason: 'Rule 1a: Elderly & Family Crowd-Protection Directive'
      },
      timestamp: new Date().toLocaleTimeString()
    };
  }

  // --- "WAY BACK TO YOUR PARKING" RETURN NAVIGATION ---
  private handleReturnToParkingQuery(lang: SupportedLanguage): AgentResponse {
    const returnRoute: RouteStatus = {
      route_id: 'RETURN_PARKING',
      name: 'Way Back to My Parking Lot (Panjarpol Bay #4B)',
      name_hi: 'वापसी मार्ग: पांजरपोळ बाह्य वाहनतळ (बे ४-बी)',
      name_mr: 'परतीचा मार्ग: पांजरपोळ बाह्य वाहनतळ (बे ४-बी)',
      destination: 'Panjarpol Outer Lot Bay 4B',
      from_location: 'RAMKUND',
      to_location: 'PANJARPOL',
      tier: 4,
      crowd: 'low',
      message_en: 'Inverted return route via Panchavati Electric Feeder Shuttle Bay 2 to your parked car.',
      message_hi: 'पंचवटी शटल टर्मिनल से फीडर बस द्वारा पांजरपोळ वाहनतळ वापसी मार्ग।',
      message_mr: 'पंचवटी शटल टर्मिनलवरून फीडर बसने पांजरपोळ वाहनतळाकडे परतीचा मार्ग.',
      updated_by: 'Parking Return Assistant',
      updated_at: new Date().toLocaleTimeString(),
      travel_time_min: 24,
      is_closed: false,
      color_code: '#E8871E'
    };

    if (lang === 'mr') {
      return {
        type: 'journey',
        language: 'mr',
        title: 'परतीचा मार्ग: माझ्या गाडीकडे (पांजरपोळ बे ४-बी)',
        summary: 'रामकुंडावरून पंचवटी शटल बस स्थानकावर या (६ मिनिटे). तेथून फीडर बसने पांजरपोळ वाहनतळ बे ४-बी वर पोहोचा (₹१५, दर ५ मिनिटांनी बस).',
        speak_text: 'आपल्या गाडीकडे परत जाण्यासाठी पंचवटी शटल बस स्थानकावर जा. तेथून दर पाच मिनिटांनी पांजरपोळ वाहनतळासाठी शासकीय बस उपलब्ध आहे.',
        primary_metric: '२४ मिनिटे वापसी',
        primary_metric_label: 'फीडर शटल • पांजरपोळ बे ४-बी',
        route_data: {
          primary_route: returnRoute,
          steps: [
            '🚶 रामकुंड घाटावरून ५०० मीटर अंतरावरील पंचवटी शटल टर्मिनलवर या',
            '🚌 पांजरपोळ शटल बस क्रमांक १२ मध्ये चढा (तिकीट: ₹१५)',
            '🅿️ पांजरपोळ बाह्य वाहनतळ बे ४-बी येथे आपली गाडी सुरक्षित शोधा'
          ],
          is_diverted: false
        },
        timestamp: new Date().toLocaleTimeString()
      };
    }

    if (lang === 'hi') {
      return {
        type: 'journey',
        language: 'hi',
        title: 'वापसी मार्ग: मेरी कार तक (पांजरपोळ बे ४-बी)',
        summary: 'रामकुंड से पंचवटी शटल बस स्टैंड आएं (६ मिनट)। वहां से फीडर बस से पांजरपोळ पार्किंग बे ४-बी पहुंचें (₹१५, हर ५ मिनट पर बस)।',
        speak_text: 'अपनी कार तक वापस जाने के लिए पंचवटी शटल टर्मिनल पर जाएं। वहाँ से हर ५ मिनट पर पांजरपोळ पार्किंग के लिए सीधी बस है।',
        primary_metric: '२४ मिनट वापसी',
        primary_metric_label: 'फीडर शटल • पांजरपोळ बे ४-बी',
        route_data: {
          primary_route: returnRoute,
          steps: [
            '🚶 रामकुंड से ५०० मीटर चलकर पंचवटी शटल टर्मिनल पहुंचें',
            '🚌 पांजरपोळ शटल बस में बैठें (किराया: ₹१५)',
            '🅿️ पांजरपोळ आउटर पार्किंग बे ४-बी में अपनी गाड़ी पाएं'
          ],
          is_diverted: false
        },
        timestamp: new Date().toLocaleTimeString()
      };
    }

    return {
      type: 'journey',
      language: 'en',
      title: 'Way Back to Your Parking Lot (Panjarpol Bay 4B)',
      summary: 'Walk to Panchavati Shuttle Terminal (6 min). Take government electric feeder shuttle back to Panjarpol Outer Lot (₹15, 5-min frequency).',
      speak_text: 'To return to your parked car, walk 500 meters to Panchavati Shuttle Terminal. Feeder buses depart every 5 minutes to Panjarpol Outer Lot.',
      primary_metric: '24 min return',
      primary_metric_label: 'Feeder Shuttle • Panjarpol Bay 4B',
      route_data: {
        primary_route: returnRoute,
        steps: [
          '🚶 Walk 500m from Ramkund to Panchavati Feeder Bus Terminal',
          '🚌 Board Electric Feeder Shuttle Route #12 (₹15 ticket)',
          '🅿️ Arrive directly at Panjarpol Outer Lot Bay #4B to retrieve car'
        ],
        is_diverted: false
      },
      timestamp: new Date().toLocaleTimeString()
    };
  }
}

export const agentEngine = new AgentEngineService();
