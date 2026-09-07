import { SupportedLanguage } from '../types';

export interface RouteInstructionStep {
  arrow: 'straight' | 'left' | 'right' | 'arrive';
  dist: string;
  eta: string;
  crowd: string;
  instruction_en: string;
  instruction_hi: string;
  instruction_mr: string;
}

export interface ComputedNavigationRoute {
  id: string;
  destinationName: string;
  category: 'ghat' | 'facility' | 'parking' | 'medical' | 'transit' | 'custom';
  coordinates: [number, number][];
  totalDistanceMeters: number;
  totalTimeMinutes: number;
  steps: RouteInstructionStep[];
  isDiverted?: boolean;
}

// Generate intermediate smooth walking coordinates between start and end
export function generateWalkingCoordinates(
  start: [number, number],
  end: [number, number],
  divertViaPanchavati: boolean = false
): [number, number][] {
  const [startLat, startLng] = start;
  const [endLat, endLng] = end;

  if (divertViaPanchavati) {
    // Detour point via Panchavati footbridge
    const detour: [number, number] = [20.0098, 73.796];
    return [
      start,
      [startLat + (detour[0] - startLat) * 0.45, startLng + (detour[1] - startLng) * 0.4],
      detour,
      [detour[0] + (endLat - detour[0]) * 0.5, detour[1] + (endLng - detour[1]) * 0.5],
      end
    ];
  }

  // Realistic 5-point path with realistic pedestrian road turns
  const deltaLat = endLat - startLat;
  const deltaLng = endLng - startLng;

  return [
    start,
    [Number((startLat + deltaLat * 0.25).toFixed(6)), Number((startLng + deltaLng * 0.15).toFixed(6))],
    [Number((startLat + deltaLat * 0.5).toFixed(6)), Number((startLng + deltaLng * 0.55).toFixed(6))],
    [Number((startLat + deltaLat * 0.75).toFixed(6)), Number((startLng + deltaLng * 0.85).toFixed(6))],
    end
  ];
}

// Generate tailored navigation steps for any destination
export function createNavigationSteps(
  destName: string,
  category: string,
  coordsCount: number,
  distMeters: number
): RouteInstructionStep[] {
  const etaMin = Math.max(2, Math.round(distMeters / 80));

  if (category === 'facility' || destName.toLowerCase().includes('toilet') || destName.toLowerCase().includes('water')) {
    const isToilet = destName.toLowerCase().includes('toilet') || destName.toLowerCase().includes('sanitation');
    return [
      {
        arrow: 'straight',
        dist: `${distMeters} m`,
        eta: `${etaMin} min`,
        crowd: 'Low (1.2 p/m²)',
        instruction_en: `Head toward ${destName}. Follow marked civic amenity signage.`,
        instruction_hi: `${destName} की ओर बढ़ें। नागरिक सुविधा साइनेज का पालन करें।`,
        instruction_mr: `${destName} कडे पुढे जा. चिन्हांकित नागरिक सुविधा फलकांचे अनुसरण करा.`
      },
      {
        arrow: 'right',
        dist: `${Math.round(distMeters * 0.6)} m`,
        eta: `${Math.max(1, Math.round(etaMin * 0.6))} min`,
        crowd: 'Low',
        instruction_en: isToilet
          ? 'Turn right past volunteer helpdesk towards Sanitation Complex 04.'
          : 'Turn right at the shaded canopy towards Chilled RO Water Station.',
        instruction_hi: isToilet
          ? 'स्वयंसेवक सहायता केंद्र के पास से दाहिने मुड़ें।'
          : 'शीतल पेय जल बूथ की ओर दाहिने मुड़ें।',
        instruction_mr: isToilet
          ? 'स्वयंसेवक मदत केंद्राजवळून स्वच्छता संकुलाकडे उजवीकडे वळा.'
          : 'थंड पिण्याच्या पाण्याच्या बूथकडे उजवीकडे वळा.'
      },
      {
        arrow: 'arrive',
        dist: '0 m',
        eta: 'Arrived',
        crowd: 'Clean',
        instruction_en: `Arrived at ${destName}. 0 min wait queue, fully operational.`,
        instruction_hi: `${destName} पर पहुँच गए। प्रतीक्षा समय ० मिनट, पूर्णतः सुलभ।`,
        instruction_mr: `${destName} येथे पोहोचला आहात. प्रतीक्षा वेळ ० मिनिटे, पूर्णपणे कार्यरत.`
      }
    ];
  }

  if (category === 'medical' || destName.toLowerCase().includes('medical') || destName.toLowerCase().includes('hospital')) {
    return [
      {
        arrow: 'straight',
        dist: `${distMeters} m`,
        eta: `${etaMin} min`,
        crowd: 'Priority Corridor',
        instruction_en: `Priority medical path to ${destName}. Proceed with paramedic corridor.`,
        instruction_hi: `${destName} की ओर प्राथमिकता चिकित्सा मार्ग। सुरक्षित आगे बढ़ें।`,
        instruction_mr: `${destName} कडे प्राधान्य वैद्यकीय मार्ग. पॅरामेडिक कॉरिडॉरने पुढे जा.`
      },
      {
        arrow: 'left',
        dist: `${Math.round(distMeters * 0.4)} m`,
        eta: '2 min',
        crowd: 'Clear',
        instruction_en: 'Bear left into Red Cross Emergency triage area.',
        instruction_hi: 'रेड क्रॉस आपातकालीन उपचार केंद्र की ओर बाएं मुड़ें।',
        instruction_mr: 'रेड क्रॉस आणीबाणी उपचार क्षेत्राकडे डावीकडे वळा.'
      },
      {
        arrow: 'arrive',
        dist: '0 m',
        eta: 'Arrived',
        crowd: 'Staff Ready',
        instruction_en: `Arrived at ${destName}. Doctors and stretchers available.`,
        instruction_hi: `${destName} पर पहुँच गए। चिकित्सक एवं एम्बुलेंस उपलब्ध।`,
        instruction_mr: `${destName} येथे पोहोचला आहात. डॉक्टर व रुग्णवाहिका उपलब्ध.`
      }
    ];
  }

  if (category === 'parking' || destName.toLowerCase().includes('parking') || destName.toLowerCase().includes('car')) {
    return [
      {
        arrow: 'straight',
        dist: `${distMeters} m`,
        eta: `${etaMin} min`,
        crowd: 'Exit Corridor',
        instruction_en: `Egress route to ${destName}. Follow blue parking return signs.`,
        instruction_hi: `${destName} की ओर वापसी मार्ग। नीले पार्किंग साइनेज का पालन करें।`,
        instruction_mr: `${destName} कडे परतीचा मार्ग. निळ्या पार्किंग चिन्हांचे अनुसरण करा.`
      },
      {
        arrow: 'right',
        dist: `${Math.round(distMeters * 0.5)} m`,
        eta: `${Math.round(etaMin * 0.5)} min`,
        crowd: 'Moderate',
        instruction_en: 'Turn right at Outer Ring Road shuttle transit bay.',
        instruction_hi: 'आउटर रिंग रोड शटल बस स्टैंड पर दाहिने मुड़ें।',
        instruction_mr: 'आउटर रिंग रोड शटल बस स्थानकावर उजवीकडे वळा.'
      },
      {
        arrow: 'arrive',
        dist: '0 m',
        eta: 'Arrived',
        crowd: 'Spaces Available',
        instruction_en: `Arrived at ${destName}. Fast exit gates open.`,
        instruction_hi: `${destName} पर पहुँच गए। निकास द्वार खुले हैं।`,
        instruction_mr: `${destName} येथे पोहोचला आहात. बाहेर पडण्याचे दरवाजे खुले आहेत.`
      }
    ];
  }

  // Default Sacred Ghat / Corridor navigation
  return [
    {
      arrow: 'straight',
      dist: `${distMeters} m`,
      eta: `${etaMin} min`,
      crowd: '2.1 p/m²',
      instruction_en: `Departing toward ${destName}. Follow illuminated pedestrian corridor.`,
      instruction_hi: `${destName} की ओर प्रस्थान। सुरक्षित पैदल पथ का पालन करें।`,
      instruction_mr: `${destName} कडे प्रस्थान. प्रकाशित पादचारी कॉरिडॉरने पुढे चला.`
    },
    {
      arrow: 'left',
      dist: `${Math.round(distMeters * 0.7)} m`,
      eta: `${Math.round(etaMin * 0.7)} min`,
      crowd: '2.3 p/m²',
      instruction_en: 'Turn left onto riverside pedestrian bridge, avoiding high crowd density.',
      instruction_hi: 'नदी किनारे पैदल पुल पर बाएं मुड़ें, अत्यधिक भीड़ से बचें।',
      instruction_mr: 'नदीकाठच्या पादचारी पुलावर डावीकडे वळा, गर्दीचा भाग टाळा.'
    },
    {
      arrow: 'right',
      dist: `${Math.round(distMeters * 0.35)} m`,
      eta: `${Math.round(etaMin * 0.35)} min`,
      crowd: '2.6 p/m²',
      instruction_en: 'Turn right along marshaled security corridor towards holding buffer.',
      instruction_hi: 'सुरक्षा बैरिकेड के साथ दाहिने मुड़ें, होल्डिंग क्षेत्र की ओर बढ़ें।',
      instruction_mr: 'सुरक्षा बॅरिकेड्ससह उजवीकडे वळा, होल्डिंग क्षेत्राकडे जा.'
    },
    {
      arrow: 'arrive',
      dist: '0 m',
      eta: 'Arrived',
      crowd: 'Controlled',
      instruction_en: `Arrived at ${destName}! Proceed to designated holy queue.`,
      instruction_hi: `${destName} पर सुरक्षित पहुँच गए! निर्धारित कतार में आगे बढ़ें।`,
      instruction_mr: `${destName} येथे सुरक्षित पोहोचला आहात! नियुक्त रांगेत पुढे चला.`
    }
  ];
}
