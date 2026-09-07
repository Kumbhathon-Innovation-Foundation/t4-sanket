import { Router, Request, Response } from 'express';
import { db } from '../db.js';

export const agentRouter = Router();

type SupportedLanguage = 'hi' | 'mr' | 'en';

function detectLanguage(text: string, defaultLang: SupportedLanguage = 'hi'): SupportedLanguage {
  const marathiWords = ['आलो', 'वाजता', 'कुठे', 'आहे', 'स्वच्छतागृह', 'जेवण', 'टाळ', 'सांगा', 'कसे', 'पर्यायी', 'वळण', 'सावध', 'हवे'];
  const hindiWords = ['बजे', 'आऊँ', 'कहाँ', 'है', 'खाना', 'भीड़', 'चाहिए', 'सुगम'];

  if (marathiWords.some((w) => text.includes(w))) return 'mr';
  if (hindiWords.some((w) => text.includes(w))) return 'hi';
  if (/[a-zA-Z]/.test(text)) return 'en';
  return defaultLang;
}

agentRouter.post('/query', async (req: Request, res: Response) => {
  try {
    const { query = '', language } = req.body;
    const rawQuery = String(query).trim().toLowerCase();
    const lang: SupportedLanguage = language || detectLanguage(rawQuery);

    const [routes, parking, facilities, food] = await Promise.all([
      db.getRouteStatuses(),
      db.getParking(),
      db.getFacilities(),
      db.getFood()
    ]);

    const r17 = routes.find((r) => r.route_id === 'R17') || routes[0];
    const r21 = routes.find((r) => r.route_id === 'R21') || routes[1];
    const r18 = routes.find((r) => r.route_id === 'R18') || routes[2];

    const parkingP09 = parking[0] || { id: 'P09', availability_pct: 68 };
    const bestFacility = facilities[0] || { id: 'FAC_1', distance_m: 140, queue_min: 3 };
    const bestFood = food[0] || { id: 'FOOD_1', distance_m: 160, reference_price_inr: 0 };

    const isR17Blocked = r17.tier <= 2;
    const detourReason = r17.message_en || 'VIP Procession Movement & Tactical Police Order';

    // 1. Safety Advisory Check
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
      if (isR17Blocked) {
        res.json(generateDetourResponse(lang, r17, r21, detourReason));
        return;
      }

      res.json({
        type: 'advisory',
        language: lang,
        title: lang === 'mr'
          ? 'सुरक्षा सल्लागार: सर्व प्रमुख मार्ग खुले'
          : lang === 'hi'
          ? 'सुरक्षा परामर्श: सभी मार्ग खुले एवं सामान्य'
          : 'Safety Advisory: All Primary Routes Open',
        summary: lang === 'mr'
          ? 'सध्या कोणताही मार्ग बंद नाही. सर्व घाट सुरळीत सुरू आहेत. अधिकृत पोलीस मार्गदर्शक सूचना पाळा.'
          : lang === 'hi'
          ? 'वर्तमान में कोई भी मार्ग प्रतिबंधित नहीं है। सभी घाट सुचारू रूप से संचालित हैं।'
          : 'No active police emergency closures. All riverfront corridors operating under standard Tier 4 conditions.',
        speak_text: lang === 'mr'
          ? 'सध्या सर्व प्रमुख मार्ग सुरक्षित आणि खुले आहेत.'
          : lang === 'hi'
          ? 'वर्तमान में कोई मार्ग बंद नहीं है। सभी स्नान घाट खुले हैं।'
          : 'All primary pilgrimage corridors are currently open and safe under normal Tier 4 operation.',
        primary_metric: 'Tier 4 Normal',
        primary_metric_label: '0 Tactical Closures Active',
        advisories: routes,
        timestamp: new Date().toLocaleTimeString()
      });
      return;
    }

    // 2. Sanitation / Facility Check
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
      res.json({
        type: 'facility',
        language: lang,
        title: lang === 'mr'
          ? 'जवळचे स्वच्छ स्वच्छतागृह'
          : lang === 'hi'
          ? 'निकटतम स्वच्छ शौचालय'
          : 'Nearest Clean Sanitation Facility',
        summary: lang === 'mr'
          ? `रामकुंड ब्लॉक २ स्वच्छतागृह • १४० मीटर अंतरावर • रांग फक्त ३ मिनिटे`
          : lang === 'hi'
          ? `रामकुंड ब्लॉक २ स्वच्छ शौचालय • १४० मीटर दूरी • कतार केवल ३ मिनट`
          : `Ramkund Block 2 Sanitation Complex • 140m away • 3 min queue`,
        speak_text: lang === 'mr'
          ? 'रामकुंड ब्लॉक दोन येथे अतिशय स्वच्छ स्वच्छतागृह उपलब्ध आहे. केवळ १४० मीटर अंतर असून रांगेत ३ मिनिटे लागतील.'
          : lang === 'hi'
          ? 'रामकुंड ब्लॉक दो पर सबसे स्वच्छ शौचालय है। गंगा मंदिर के पीछे १४० मीटर की दूरी पर है और कतार केवल ३ मिनट की है।'
          : 'The cleanest low-queue toilet is at Ramkund Block 2 behind Ganga Temple, 140 meters away.',
        primary_metric: '3 min queue',
        primary_metric_label: '140m away • Clean & Verified',
        facility_data: facilities,
        timestamp: new Date().toLocaleTimeString()
      });
      return;
    }

    // 3. Food / Mahaprasad / Langar Check
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
      rawQuery.includes('swast') ||
      rawQuery.includes('सस्ता')
    ) {
      res.json({
        type: 'food',
        language: lang,
        title: lang === 'mr'
          ? 'स्नानानंतर सात्विक अन्न व लंगर'
          : lang === 'hi'
          ? 'स्नान के पश्चात सात्विक भोजन व लंगर'
          : 'Post-Snan Food & Fair Price Langar',
        summary: lang === 'mr'
          ? 'श्री राम सेवा अखंड लंगर (मोफत, १६० मी) व गोदावरी महाप्रसाद केंद्र (अधिकृत संदर्भ दर: ₹३०, २९० मी).'
          : lang === 'hi'
          ? 'श्री राम सेवा अखंड लंगर (निःशुल्क, १६० मी) एवं गोदावरी महाप्रसाद केंद्र (आधिकारिक संदर्भ दर: ₹३०, २९० मी)।'
          : 'Sri Ram Seva Akhand Langar (Free, 160m) & Godavari Mahaprasad (Official Reference Price: ₹30, 290m).',
        speak_text: lang === 'mr'
          ? 'स्नानानंतर १६० मीटरवर मोफत अखंड लंगर उपलब्ध आहे. तसेच गोदावरी ट्रस्ट येथे ३० रुपये संदर्भ दरात सात्विक थाळी मिळेल.'
          : lang === 'hi'
          ? 'स्नान के बाद १६० मीटर पर श्री राम सेवा अखंड लंगर में निःशुल्क खिचड़ी और चाय उपलब्ध है।'
          : 'For fresh food after snan, Sri Ram Seva Akhand Langar is 160 meters away offering free hot prasad.',
        primary_metric: 'Ref Price: ₹0 - ₹30',
        primary_metric_label: 'Distance: 160m • Queue: 5 min',
        food_data: food,
        timestamp: new Date().toLocaleTimeString()
      });
      return;
    }

    // 4. Re-planning (e.g., 5 AM arrival)
    if (
      rawQuery.includes('5') ||
      rawQuery.includes('५') ||
      rawQuery.includes('5 am') ||
      rawQuery.includes('5 बजे') ||
      rawQuery.includes('५ वाजता') ||
      (rawQuery.includes('what if') && (rawQuery.includes('later') || rawQuery.includes('time')))
    ) {
      if (isR17Blocked) {
        res.json(generateDetourResponse(lang, r17, r21, detourReason));
        return;
      }

      res.json({
        type: 'journey',
        language: lang,
        title: lang === 'mr'
          ? 'पुनर्नियोजन: पहाटे ५:०० आगमन'
          : lang === 'hi'
          ? 'पुनर्नियोजन: प्रातः ५:०० बजे आगमन'
          : 'Re-planning: 5:00 AM Arrival Window',
        summary: lang === 'mr'
          ? '५:०० वाजता गर्दी ३५% वाढते. नदीकाठ मार्गावर २२ मिनिटे लागतील. पंचवटी वळण (R21) अधिक सोयीचे ठरेल.'
          : lang === 'hi'
          ? '५:०० बजे स्नानार्थियों की संख्या में ३५% वृद्धि। मुख्य मार्ग पर २२ मिनट लगेंगे। पंचवटी वळण मार्ग (R21) अधिक सुगम रहेगा।'
          : 'At 5:00 AM, crowd density increases +35%. Recommend Panchavati Ghat diversion (R21).',
        speak_text: lang === 'mr'
          ? 'तुम्ही पाच वाजता आलात तर गर्दी वाढलेली असेल. थेट मार्गाऐवजी पंचवटी वळण मार्ग किंवा तपोवन बायपास निवडणे सुरक्षित ठरेल.'
          : lang === 'hi'
          ? 'पांच बजे आने पर आरती के कारण भीड़ बढ़ेगी। मुख्य मार्ग के बजाय पंचवटी वळण मार्ग लें।'
          : 'If you arrive at 5 AM, morning aarti crowd will add delay. We recommend switching to Panchavati Ghat diversion R21.',
        primary_metric: '+8 min delay',
        primary_metric_label: 'Crowd Surge • Total: 22 min',
        route_data: {
          primary_route: r21,
          alternative_route: r17,
          parking: parkingP09,
          steps: [
            'Expect heavy morning rush between 5:00 - 6:30 AM',
            'Use Panchavati Ghat diversion corridor (R21)',
            'Bypass riverside bottleneck directly to Ramkund'
          ],
          is_diverted: false
        },
        timestamp: new Date().toLocaleTimeString()
      });
      return;
    }

    // 5. Default 4 AM Journey Planning
    if (isR17Blocked) {
      res.json(generateDetourResponse(lang, r17, r21, detourReason));
      return;
    }

    res.json({
      type: 'journey',
      language: lang,
      title: lang === 'mr'
        ? 'पहाटे ४:०० — रामकुंड स्नान व दर्शन मार्ग'
        : lang === 'hi'
        ? 'प्रातः ४:०० — रामकुंड स्नान एवं दर्शन मार्ग'
        : '4:00 AM — Ramkund Snan & Darshan Route',
      summary: lang === 'mr'
        ? 'मोदी मैदान (P09) येथे वाहन उभे करा (६८% जागा उपलब्ध). थेट नदीकाठ मार्गाने (R17) १४ मिनिटांत रामकुंडावर पोहोचा.'
        : lang === 'hi'
        ? 'मोदी मैदान (P09) में वाहन पार्क करें (६८% खाली)। मुख्य नदी तट मार्ग (R17) से १४ मिनट में सुगम स्नान।'
        : 'Park at Modi Ground (P09, 68% available). Proceed via direct riverside road (R17, 14 min walk).',
      speak_text: lang === 'mr'
        ? 'पहाटे चार वाजता गर्दी कमी असेल. मोदी मैदान वाहनतळ पी शून्य नऊ वापरा आणि नदीकाठ मार्गाने जा. १४ मिनिटे लागतील.'
        : lang === 'hi'
        ? 'प्रातः चार बजे भीड़ सामान्य है। मोदी मैदान पार्किंग पी शून्य नौ का उपयोग करें और नदी तट मार्ग से जाएं। केवल १४ मिनट लगेंगे।'
        : 'For 4 AM arrival, crowd density is low. Park at Modi Ground P09 and take the riverside road R17. Walk time is 14 minutes.',
      primary_metric: lang === 'mr' ? '१४ मिनिटे' : lang === 'hi' ? '१४ मिनट' : '14 min walk',
      primary_metric_label: 'Crowd: Moderate • P09 68% Free',
      route_data: {
        primary_route: r17,
        alternative_route: r21,
        parking: parkingP09,
        steps: [
          'Park at Modi Ground Parking (P09)',
          'Follow Godavari Riverside walkway (R17)',
          'Arrive directly at Ramkund Main Snan Ghat'
        ],
        is_diverted: false
      },
      timestamp: new Date().toLocaleTimeString()
    });
  } catch (err) {
    res.status(500).json({ error: 'Agent query processing failed', details: String(err) });
  }
});

function generateDetourResponse(
  lang: SupportedLanguage,
  closedRoute: any,
  detourRoute: any,
  reason: string
) {
  return {
    type: 'reroute',
    language: lang,
    title: lang === 'mr'
      ? 'पोलीस आदेश: तात्काळ वळण मार्ग (R21)'
      : lang === 'hi'
      ? 'पुलिस आदेश: तत्काल डायवर्जन मार्ग (R21)'
      : 'Police Override: Live Route Detour Active (R21)',
    summary: lang === 'mr'
      ? `पोलीस नियंत्रण कक्षाने मुख्य नदीकाठ मार्ग बंद केला आहे (${reason}). त्वरित पंचवटी घाट वळण मार्ग (R21) वापरा.`
      : lang === 'hi'
      ? `पुलिस नियंत्रण कक्ष द्वारा मुख्य नदी तट मार्ग बंद कर दिया गया है (${reason})। कृपया पंचवटी घाट डायवर्जन (R21) लें।`
      : `Police Command has closed ${closedRoute.route_id} (${reason}). Diverted to Panchavati Ghat Route (R21).`,
    speak_text: lang === 'mr'
      ? 'सावधान! पोलीस नियंत्रण कक्षाने थेट नदीकाठ मार्ग बंद केला आहे. कृपया तात्काळ पंचवटी घाट वळण मार्ग वापरा.'
      : lang === 'hi'
      ? 'सावधान! पुलिस नियंत्रण कक्ष ने मुख्य नदी तट मार्ग बंद कर दिया है। कृपया तत्काल पंचवटी घाट डायवर्जन मार्ग लें।'
      : 'Attention! Police have force-closed the direct riverside route. You are being re-routed via Panchavati Ghat diversion R21.',
    primary_metric: lang === 'mr' ? 'नवीन मार्ग: १८ मिनिटे' : lang === 'hi' ? 'नया मार्ग: १८ मिनट' : 'New Route: 18 min',
    primary_metric_label: 'R17 Blocked • R21 Detour Clear',
    route_data: {
      primary_route: detourRoute,
      alternative_route: closedRoute,
      steps: [
        '⛔ Direct riverside road (R17) is blocked by Police Tactical Order',
        '➡️ Turn right immediately following Panchavati Ghat diversion signage',
        '✅ Reach Ramkund via clear pedestrian walkway'
      ],
      is_diverted: true,
      detour_reason: reason
    },
    timestamp: new Date().toLocaleTimeString()
  };
}
