import React, { useState, useEffect, useRef } from 'react';
import { OpenFreeMapCanvas } from './OpenFreeMapCanvas';
import { realtimeHub } from '../services/realtimeHub';
import { agentEngine } from '../services/agentEngine';
import { speechService } from '../services/speechService';
import { audioAlert } from '../services/audioAlert';
import { SupportedLanguage, AgentResponse } from '../types';
import { DASHBOARD_TRANSLATIONS } from '../services/dashboardI18n';
import { PRECOMPUTED_WALKING_PATHS } from '../services/mockData';
import { NashikPOI } from '../services/nashikGisData';
import {
  ShieldAlert,
  Radio,
  CheckCircle2,
  AlertTriangle,
  Users,
  Footprints,
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  Sparkles,
  Bath,
  Droplets,
  HeartPulse,
  Mic,
  MicOff,
  Send,
  Navigation,
  ArrowRight,
  Clock,
  MapPin,
  ChevronRight,
  Compass,
  Check,
  Globe,
  Volume2,
  VolumeX,
  CornerUpRight,
  CornerUpLeft,
  MoveUp,
  Flag
} from 'lucide-react';

import {
  generateWalkingCoordinates,
  createNavigationSteps,
  RouteInstructionStep
} from '../services/routeCalculator';

export const UnifiedShowcase: React.FC = () => {
  const [activeScenario, setActiveScenario] = useState<number>(3); // Default to Scenario 3 (VIP Movement as in reference image)
  const [language, setLanguage] = useState<SupportedLanguage>('en');
  const [showCrowdDensity, setShowCrowdDensity] = useState<boolean>(true);
  const [showFacilities, setShowFacilities] = useState<boolean>(true);
  const [isApproved, setIsApproved] = useState<boolean>(true);
  const [phoneNavMode, setPhoneNavMode] = useState<boolean>(false);
  const [phoneQuery, setPhoneQuery] = useState<string>('');
  const [syncFlash, setSyncFlash] = useState<boolean>(false);

  // Dynamic Origin and Destination
  const [originName, setOriginName] = useState<string>('Panjarpol Outer Parking (Zone P01)');
  const [destinationName, setDestinationName] = useState<string>('Ramkund Sacred Ghat (Main Snan)');
  const [activePoiId, setActivePoiId] = useState<string | null>(null);

  // Active walking path coordinates (dynamically updated for any destination!)
  const [activeCoordinates, setActiveCoordinates] = useState<[number, number][]>(PRECOMPUTED_WALKING_PATHS.R21);
  const [currentSteps, setCurrentSteps] = useState<RouteInstructionStep[]>([]);
  const [autoRerouteAlert, setAutoRerouteAlert] = useState<string | null>(null);

  // AI Agent Query & Voice states
  const [isAgentThinking, setIsAgentThinking] = useState<boolean>(false);
  const [agentResponse, setAgentResponse] = useState<AgentResponse | null>(null);
  const [isVoiceListening, setIsVoiceListening] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [broadcastAlertToast, setBroadcastAlertToast] = useState<string | null>(null);

  // Walking simulation for live navigation
  const [simStep, setSimStep] = useState<number>(0);
  const [isSimPlaying, setIsSimPlaying] = useState<boolean>(false);

  const t = DASHBOARD_TRANSLATIONS[language] || DASHBOARD_TRANSLATIONS.en;

  // Default navigation steps
  const defaultNavigationSteps: RouteInstructionStep[] = [
    {
      arrow: 'straight',
      dist: '1.4 km',
      eta: '18 min',
      crowd: '2.0 p/m²',
      instruction_en: 'Depart Panjarpol Outer Parking. Head south toward Godavari River corridor.',
      instruction_hi: 'पंजरपोल आउटर पार्किंग से प्रस्थान करें। गोदावरी नदी गलियारे की ओर दक्षिण बढ़ें।',
      instruction_mr: 'पांजरपोळ आउटर पार्किंग येथून प्रस्थान करा. गोदावरी नदी कॉरिडॉरकडे दक्षिणेस जा.'
    },
    {
      arrow: 'left',
      dist: '1.1 km',
      eta: '14 min',
      crowd: '2.4 p/m²',
      instruction_en: 'Turn left at Panchavati Karanja Transit Hub. Avoid R17 VIP diversion.',
      instruction_hi: 'पंचवटी कारंजा पर बाएं मुड़ें। वीआईपी काफिले के कारण R17 मार्ग से बचें।',
      instruction_mr: 'पंचवटी कारंजा येथे डावीकडे वळा. व्हीआयपी हालचालीमुळे R17 थेट रस्ता टाळा.'
    },
    {
      arrow: 'right',
      dist: '750 m',
      eta: '9 min',
      crowd: '2.1 p/m²',
      instruction_en: 'Bear right past Drinking Water booth & Medical First Aid post 02.',
      instruction_hi: 'पेयजल बूथ और प्राथमिक चिकित्सा केंद्र ०२ के पास से दाहिने मुड़ें।',
      instruction_mr: 'पिण्याचे पाणी बूथ आणि प्रथमोपचार केंद्र ०२ जवळून उजवीकडे वळा.'
    },
    {
      arrow: 'straight',
      dist: '400 m',
      eta: '5 min',
      crowd: '2.7 p/m²',
      instruction_en: 'Cross pedestrian footbridge onto safe Panchavati Riverway corridor R21.',
      instruction_hi: 'पैदल पुल पार करके सुरक्षित पंचवटी नदी तट गलियारे R21 पर आगे बढ़ें।',
      instruction_mr: 'पादचारी पूल ओलांडून सुरक्षित पंचवटी नदीकाठ कॉरिडॉर R21 वर पुढे चला.'
    },
    {
      arrow: 'straight',
      dist: '150 m',
      eta: '2 min',
      crowd: '3.1 p/m²',
      instruction_en: 'Follow marshaled holding barricades toward Ramkund Sacred Ghat.',
      instruction_hi: 'रामकुंड पवित्र घाट की ओर पुलिस बैरिकेड्स व होल्डिंग कतार का पालन करें।',
      instruction_mr: 'रामकुंड पवित्र घाटाकडे पोलीस बॅरिकेड्स व होल्डिंग रांगेचे पालन करा.'
    },
    {
      arrow: 'arrive',
      dist: '0 m',
      eta: 'Arrived',
      crowd: 'Safe',
      instruction_en: 'Arrived at Ramkund Ghat! Proceed to designated holy snan queue safely.',
      instruction_hi: 'रामकुंड घाट पर पहुँच गए! पवित्र स्नान हेतु निर्धारित कतार में सुरक्षित आगे बढ़ें।',
      instruction_mr: 'रामकुंड घाटावर पोहोचला आहात! पवित्र स्नानासाठी नियुक्त रांगेत सुरक्षित पुढे जा.'
    }
  ];

  // Active path coordinates and steps
  const activePath = activeCoordinates;
  const activeSteps = currentSteps.length > 0 ? currentSteps : defaultNavigationSteps;
  const currentSimCoord: [number, number] | null =
    isSimPlaying || phoneNavMode ? activePath[simStep] || activePath[0] : null;
  const currentNavStep = activeSteps[simStep] || activeSteps[0] || defaultNavigationSteps[0];

  // Listen to speech status
  useEffect(() => {
    speechService.onSpeakingStatus((speaking) => {
      setIsSpeaking(speaking);
    });
  }, []);

  // Walking simulation timer
  useEffect(() => {
    let timer: any = null;
    if (isSimPlaying) {
      timer = setInterval(() => {
        setSimStep((prev) => {
          if (prev + 1 >= activePath.length) {
            clearInterval(timer);
            setIsSimPlaying(false);

            // Announce arrival
            const arriveText =
              language === 'mr'
                ? `अभिनंदन! आपण ${destinationName} येथे सुरक्षित पोहोचला आहात.`
                : language === 'hi'
                ? `बधाई! आप ${destinationName} पर सुरक्षित पहुँच गए हैं।`
                : `Arrived safely at ${destinationName}. Har Har Gange!`;
            speechService.speak(arriveText, language);

            return activePath.length - 1;
          }

          const nextStep = prev + 1;

          // Voice announce turn at key waypoints
          const stepData = activeSteps[nextStep];
          if (stepData) {
            const prompt =
              language === 'mr'
                ? stepData.instruction_mr
                : language === 'hi'
                ? stepData.instruction_hi
                : stepData.instruction_en;
            speechService.speak(prompt, language);
          }

          return nextStep;
        });
      }, 2500); // 2.5s per step for clear demo visualization
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isSimPlaying, activePath.length, activeSteps, destinationName, language]);

  // Flash sync animation when actions occur
  const triggerSyncFlash = () => {
    setSyncFlash(true);
    setTimeout(() => setSyncFlash(false), 1200);
  };

  // Automatic Reroute Handler (When VIP movement or route closure occurs)
  const triggerAutoReroute = () => {
    setIsApproved(true);
    triggerSyncFlash();
    audioAlert.playBroadcastChime();

    const alertMsg =
      language === 'mr'
        ? '🚨 स्वयंचलित वळण मार्ग लागू: व्हीआयपी हालचालीमुळे थेट मार्ग बंद. पंचवटी R21 मार्गावर वळवले आहे (-८ मिनिटे बचत).'
        : language === 'hi'
        ? '🚨 स्वचालित डायवर्जन लागू: वीआईपी काफिले हेतु सीधा मार्ग बंद। पंचवटी R21 डायवर्जन से पुनः मार्ग निर्धारित (-८ मिनट बचत)।'
        : '🚨 AUTOMATIC REROUTE APPLIED: Direct riverside road closed by police order (VIP movement). Diverted via Panchavati R21 (-8 min delay avoided).';

    setAutoRerouteAlert(alertMsg);
    setBroadcastAlertToast(alertMsg);

    // Apply official bypass corridor
    setActiveCoordinates(PRECOMPUTED_WALKING_PATHS.R21);

    const divertedSteps: RouteInstructionStep[] = [
      {
        arrow: 'left',
        dist: '1.2 km',
        eta: '16 min',
        crowd: '2.2 p/m²',
        instruction_en: 'Reroute active: Turn left at Panchavati Karanja to bypass R17 VIP closure.',
        instruction_hi: 'डायवर्जन सक्रिय: वीआईपी प्रतिबंध के कारण पंचवटी कारंजा पर बाएं मुड़ें।',
        instruction_mr: 'वळण मार्ग सक्रिय: R17 व्हीआयपी बंद असल्यामुळे पंचवटी कारंजा येथे डावीकडे वळा.'
      },
      {
        arrow: 'straight',
        dist: '700 m',
        eta: '9 min',
        crowd: '2.4 p/m²',
        instruction_en: 'Cross pedestrian footbridge along protected Panchavati corridor R21.',
        instruction_hi: 'सुरक्षित पंचवटी कॉरिडोर R21 के पैदल पुल से आगे बढ़ें।',
        instruction_mr: 'संरक्षित पंचवटी कॉरिडॉर R21 च्या पादचारी पुलाने पुढे चला.'
      },
      {
        arrow: 'right',
        dist: '250 m',
        eta: '3 min',
        crowd: 'Safe',
        instruction_en: 'Approaching Ramkund Sacred Ghat via low-density holding buffer.',
        instruction_hi: 'कम भीड़ वाले होल्डिंग क्षेत्र से रामकुंड पवित्र घाट की ओर बढ़ें।',
        instruction_mr: 'कमी गर्दीच्या होल्डिंग भागातून रामकुंड पवित्र घाटाकडे जा.'
      },
      {
        arrow: 'arrive',
        dist: '0 m',
        eta: 'Arrived',
        crowd: 'Arrived',
        instruction_en: 'Arrived safely at Ramkund Ghat via diversion. 8 minutes delay avoided!',
        instruction_hi: 'डायवर्जन द्वारा रामकुंड घाट पर सुरक्षित पहुँच गए। ८ मिनट का विलंब बचा!',
        instruction_mr: 'वळण मार्गाने रामकुंड घाटावर सुरक्षित पोहोचला आहात. ८ मिनिटे वेळ वाचली!'
      }
    ];

    setCurrentSteps(divertedSteps);
    setSimStep(0);

    const voicePrompt =
      language === 'mr'
        ? 'सावधान! थेट नदीकाठ मार्ग व्हीआयपी हालचालीमुळे बंद करण्यात आला आहे. आपला मार्ग स्वयंचलितपणे पंचवटी वळण मार्गावर वळवला आहे.'
        : language === 'hi'
        ? 'सावधान! वीआईपी काफिले के कारण मुख्य नदी मार्ग बंद है। आपका मार्ग स्वचालित रूप से पंचवटी डायवर्जन पर बदल दिया गया है।'
        : 'Attention: Riverside road closed due to VIP movement. Route automatically diverted via Panchavati corridor.';

    speechService.speak(voicePrompt, language);

    setTimeout(() => {
      setAutoRerouteAlert(null);
    }, 10000);
  };

  // Scenario Switcher
  const handleScenarioChange = (scenarioId: number) => {
    setActiveScenario(scenarioId);
    triggerSyncFlash();
    audioAlert.playPing();

    if (scenarioId === 1) {
      // Normal Flow
      realtimeHub.resetAllToNormal();
      setIsApproved(false);
      setPhoneNavMode(false);
      setBroadcastAlertToast(null);
      setAutoRerouteAlert(null);
      setActiveCoordinates(PRECOMPUTED_WALKING_PATHS.R17);
      setCurrentSteps(defaultNavigationSteps);
    } else if (scenarioId === 2) {
      // Peak Crowd
      realtimeHub.updateRouteStatus(
        'R17',
        3,
        'surge',
        {
          en: 'Heavy crowd surge at Ramkund Ghat (+35% delay)',
          hi: 'रामकुंड घाट पर अत्यधिक भीड़ दर्ज (+३५% विलंब)',
          mr: 'रामकुंड घाटावर मोठी गर्दी (+३५% विलंब)'
        },
        'PRAVAH Police Control Command'
      );
      setIsApproved(true);
    } else if (scenarioId === 3) {
      // VIP Movement -> Trigger Immediate Automatic Reroute!
      realtimeHub.updateRouteStatus(
        'R17',
        1,
        'surge',
        {
          en: 'VIP Movement: Riverside road (R17) closed by police order',
          hi: 'वीआईपी काफिला: मुख्य नदी तट मार्ग (R17) पुलिस आदेश द्वारा बंद',
          mr: 'मुख्य नदीकाठ मार्ग (R17) व्हीआयपी मिरवणूक व गर्दीमुळे बंद'
        },
        'PRAVAH Police Control Command'
      );
      triggerAutoReroute();
    } else if (scenarioId === 4) {
      // Complete Route Closure -> Trigger Immediate Automatic Reroute!
      realtimeHub.updateRouteStatus(
        'R17',
        1,
        'surge',
        {
          en: 'Emergency Barricade: R17 completely closed for safety',
          hi: 'आपातकालीन बैरिकेड: सुरक्षा कारणों से R17 पूर्णतः बंद',
          mr: 'आणीबाणी बॅरिकेड: सुरक्षेसाठी R17 पूर्णपणे बंद'
        },
        'PRAVAH Joint Police Command HQ'
      );
      triggerAutoReroute();
    }
  };

  // Operator Action: Approve & Broadcast
  const handleApproveBroadcast = () => {
    realtimeHub.updateRouteStatus(
      'R17',
      1,
      'surge',
      {
        en: 'VIP Movement: Riverside road (R17) closed by police order',
        hi: 'वीआईपी काफिला: मुख्य मार्ग बंद, R21 डायवर्जन लें',
        mr: 'व्हीआयपी मिरवणूक: R17 बंद, पंचवटी R21 वळण मार्ग वापरा'
      },
      'PRAVAH Joint Police Command HQ'
    );
    triggerAutoReroute();
  };

  // Start Live Journey in Phone
  const handleStartJourney = () => {
    setPhoneNavMode(true);
    setIsSimPlaying(true);
    setSimStep(0);
    triggerSyncFlash();
    audioAlert.playPing();

    const startPrompt =
      language === 'mr'
        ? `प्रवास सुरू झाला. ${currentNavStep.instruction_mr}`
        : language === 'hi'
        ? `यात्रा प्रारंभ हुई। ${currentNavStep.instruction_hi}`
        : `Navigation started. ${currentNavStep.instruction_en}`;

    speechService.speak(startPrompt, language);
  };

  // Toggle Play / Pause Simulation
  const handleToggleSimulation = () => {
    setIsSimPlaying(!isSimPlaying);
  };

  // Skip to next step
  const handleNextStep = () => {
    if (simStep + 1 < activePath.length) {
      setSimStep(simStep + 1);
      const step = activeSteps[simStep + 1];
      if (step) {
        const prompt =
          language === 'mr'
            ? step.instruction_mr
            : language === 'hi'
            ? step.instruction_hi
            : step.instruction_en;
        speechService.speak(prompt, language);
      }
    }
  };

  // Reset Simulation
  const handleResetSimulation = () => {
    setIsSimPlaying(false);
    setSimStep(0);
    setPhoneNavMode(false);
  };

  // Process Phone Query through Agent Engine
  const executeQuery = (queryText: string) => {
    if (!queryText.trim()) return;
    setIsAgentThinking(true);
    triggerSyncFlash();
    audioAlert.playPing();

    const q = queryText.toLowerCase();

    // 1. Detect target category & destination
    let newDest = destinationName;
    let targetCoord: [number, number] = [20.00738, 73.79253]; // default Ramkund
    let cat = 'ghat';
    let dist = 1400;

    if (q.includes('toilet') || q.includes('washroom') || q.includes('sanitation') || q.includes('स्वच्छता') || q.includes('शौचालय')) {
      newDest = language === 'mr' ? 'स्वच्छतागृह संकुल ०४ (पंचवटी घाट)' : language === 'hi' ? 'स्वच्छता परिसर ०४ (पंचवटी घाट)' : 'Clean Sanitation & Toilet Complex 04';
      targetCoord = [20.0078, 73.7925];
      cat = 'facility';
      dist = 250;
    } else if (q.includes('water') || q.includes('पाणी') || q.includes('पानी') || q.includes('जल')) {
      newDest = language === 'mr' ? 'पिण्याचे पाणी केंद्र ०२ (आर.ओ.)' : language === 'hi' ? 'शीतल पेयजल बूथ ०२ (आर.ओ.)' : 'Chilled RO Drinking Water Station 02';
      targetCoord = [20.0088, 73.7945];
      cat = 'facility';
      dist = 180;
    } else if (q.includes('medical') || q.includes('doctor') || q.includes('hospital') || q.includes('वैद्यकीय') || q.includes('चिकित्सा') || q.includes('औषध')) {
      newDest = language === 'mr' ? 'आपत्कालीन प्रथमोपचार व रुग्णालय केंद्र' : language === 'hi' ? 'आपातकालीन चिकित्सा केंद्र ०१' : 'Emergency Trauma Care & Medical Aid Post 01';
      targetCoord = [20.0062, 73.7950];
      cat = 'medical';
      dist = 450;
    } else if (q.includes('car') || q.includes('parking') || q.includes('panjarpol') || q.includes('गाडी') || q.includes('वाहन')) {
      newDest = language === 'mr' ? 'पांजरपोळ आउटर पार्किंग (वाहनतळ P01)' : language === 'hi' ? 'पंजरपोल आउटर पार्किंग (वाहन स्टैंड P01)' : 'Panjarpol Outer Parking (Zone P01)';
      targetCoord = [20.0490, 73.8046];
      cat = 'parking';
      dist = 1600;
    } else if (q.includes('elder') || q.includes('senior') || q.includes('wheelchair') || q.includes('rule 1a') || q.includes('वरिष्ठ') || q.includes('ज्येष्ठ')) {
      newDest = language === 'mr' ? 'तालकुटेश्वर घाट (ज्येष्ठ नागरिक सुलभ रॅम्प)' : language === 'hi' ? 'तालकुटेश्वर घाट (वरिष्ठ नागरिक सुगम रैम्प)' : 'Talkuteshwar Ghat (Rule 1a Elder Friendly Ramp)';
      targetCoord = [20.0028, 73.7971];
      cat = 'ghat';
      dist = 900;
    }

    setDestinationName(newDest);

    // Compute tailored path coordinates from current location to target destination
    const startPoint: [number, number] = currentSimCoord || [20.0061, 73.8102];
    const newPath = generateWalkingCoordinates(startPoint, targetCoord, activeScenario === 3 || activeScenario === 4);
    setActiveCoordinates(newPath);

    // Create tailored turn-by-turn guidance steps
    const newSteps = createNavigationSteps(newDest, cat, newPath.length, dist);
    setCurrentSteps(newSteps);
    setSimStep(0);

    setTimeout(() => {
      const response = agentEngine.processQuery(queryText, language);
      setAgentResponse(response);
      setIsAgentThinking(false);

      if (response && response.speak_text) {
        speechService.speak(response.speak_text, language);
      }
    }, 450);
  };

  // Handle Query Submission
  const handlePhoneQuery = () => {
    if (!phoneQuery.trim()) return;
    executeQuery(phoneQuery);
  };

  // Voice Mic Toggle
  const handleToggleMic = () => {
    if (isVoiceListening) {
      speechService.stopListening();
      setIsVoiceListening(false);
    } else {
      const started = speechService.startListening(
        language,
        (transcript, isFinal) => {
          setPhoneQuery(transcript);
          if (isFinal) {
            setIsVoiceListening(false);
            executeQuery(transcript);
          }
        },
        (listening) => {
          setIsVoiceListening(listening);
        }
      );
      if (!started) {
        // Fallback demo voice prompt
        const sampleQuery =
          language === 'mr'
            ? 'रामकुंड स्नानाचा सुरक्षित मार्ग कोणता?'
            : language === 'hi'
            ? 'रामकुंड स्नान का सुरक्षित मार्ग कौन सा है?'
            : 'What is the safest route to Ramkund snan?';
        setPhoneQuery(sampleQuery);
        executeQuery(sampleQuery);
      }
    }
  };

  // Handle Map POI Selection
  const handleSelectPoi = (poi: NashikPOI) => {
    setActivePoiId(poi.id);
    triggerSyncFlash();
    audioAlert.playPing();

    if (poi.category === 'parking') {
      setOriginName(`${poi.name} (Parking)`);
    } else {
      setDestinationName(`${poi.name}`);
    }

    // Auto-query agent for route to this POI
    executeQuery(`Route to ${poi.name}`);
  };

  // Quick Query Chips
  const queryChips = [
    {
      icon: '🛕',
      label_en: 'Ramkund Snan route',
      label_hi: 'रामकुंड स्नान मार्ग',
      label_mr: 'रामकुंड स्नान मार्ग',
      query: 'Ramkund holy snan route'
    },
    {
      icon: '🅿️',
      label_en: 'My Car at Panjarpol',
      label_hi: 'पंजरपोल में मेरी गाड़ी',
      label_mr: 'पांजरपोळ येथे माझी गाडी',
      query: 'Where is my car parked at Panjarpol outer parking?'
    },
    {
      icon: '💧',
      label_en: 'Nearest Water & First Aid',
      label_hi: 'नजदीकी पानी व फर्स्ट एड',
      label_mr: 'जवळचे पाणी व प्रथमोपचार',
      query: 'Where is the nearest drinking water and medical booth?'
    },
    {
      icon: '👵',
      label_en: 'Elderly safe ramp path',
      label_hi: 'बुजुर्गों हेतु सुगम रैम्प',
      label_mr: 'ज्येष्ठ नागरिकांसाठी मार्ग',
      query: 'Safe route for elderly parents with wheelchairs Rule 1a'
    }
  ];

  return (
    <div
      style={{
        width: '100%',
        maxWidth: '1540px',
        margin: '0 auto',
        backgroundColor: '#070C1A',
        color: '#F8FAFC',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        borderRadius: '20px',
        border: '1px solid rgba(56, 189, 248, 0.2)',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <style>{`
        @keyframes pulseGlow {
          0% { box-shadow: 0 0 0 0 rgba(56, 189, 248, 0.5); }
          70% { box-shadow: 0 0 0 10px rgba(56, 189, 248, 0); }
          100% { box-shadow: 0 0 0 0 rgba(56, 189, 248, 0); }
        }
        @keyframes syncArrows {
          0%, 100% { transform: translateX(0); opacity: 0.6; }
          50% { transform: translateX(5px); opacity: 1; color: #38BDF8; }
        }
        @keyframes soundWave {
          0%, 100% { height: 4px; }
          50% { height: 16px; }
        }
      `}</style>

      {/* ============================================================ */}
      {/* 1. TOP HEADER BAR                                            */}
      {/* ============================================================ */}
      <header
        style={{
          padding: '14px 24px',
          backgroundColor: '#0B132B',
          borderBottom: '1px solid rgba(56, 189, 248, 0.18)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        {/* Left: Brand Identity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              boxShadow: '0 4px 14px rgba(245, 158, 11, 0.4)'
            }}
          >
            🪷
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  margin: 0,
                  letterSpacing: '0.04em',
                  color: '#FFFFFF'
                }}
              >
                {t.header.title}
              </h1>
              <span
                style={{
                  fontSize: '10px',
                  backgroundColor: 'rgba(56,189,248,0.15)',
                  color: '#38BDF8',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  border: '1px solid rgba(56,189,248,0.3)',
                  fontWeight: 700
                }}
              >
                Tower 4 • Kumbhathon
              </span>
            </div>
            <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 500 }}>
              {t.header.subtitle}
            </div>
          </div>
        </div>

        {/* Center: Live Simulation Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              backgroundColor: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '30px',
              padding: '6px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '11px',
              color: '#34D399',
              fontWeight: 600
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#10B981',
                display: 'inline-block',
                boxShadow: '0 0 8px #10B981'
              }}
            />
            <span>{t.header.demoMode}</span>
            <span style={{ opacity: 0.6, margin: '0 2px' }}>|</span>
            <span style={{ color: '#E2E8F0', fontSize: '10.5px' }}>{t.header.subflow}</span>
          </div>

          <div
            style={{
              backgroundColor: 'rgba(56, 189, 248, 0.12)',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              borderRadius: '30px',
              padding: '6px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11px',
              color: '#38BDF8',
              fontWeight: 600
            }}
          >
            <Radio size={13} style={{ color: '#38BDF8' }} />
            <span>{t.header.liveSync}</span>
          </div>

          {/* Voice Indicator if Speaking */}
          {isSpeaking && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                backgroundColor: 'rgba(234, 88, 12, 0.2)',
                border: '1px solid #EA580C',
                borderRadius: '20px',
                padding: '4px 10px',
                color: '#FB923C',
                fontSize: '10.5px',
                fontWeight: 700
              }}
            >
              <Volume2 size={13} />
              <span>Voice Live</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '2px', marginLeft: '4px' }}>
                <span style={{ width: '2px', height: '10px', backgroundColor: '#FB923C', animation: 'soundWave 0.5s infinite ease-in-out' }} />
                <span style={{ width: '2px', height: '14px', backgroundColor: '#FB923C', animation: 'soundWave 0.7s infinite ease-in-out' }} />
                <span style={{ width: '2px', height: '8px', backgroundColor: '#FB923C', animation: 'soundWave 0.4s infinite ease-in-out' }} />
              </div>
            </div>
          )}
        </div>

        {/* Right: Date, Time & Trilingual Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ textAlign: 'right', fontSize: '11px', color: '#94A3B8' }}>
            <div style={{ fontWeight: 600, color: '#E2E8F0' }}>15 Feb 2026</div>
            <div style={{ fontFamily: 'monospace', fontSize: '11.5px', color: '#38BDF8' }}>11:58:24 IST</div>
          </div>

          {/* Trilingual Toggle */}
          <div
            style={{
              display: 'flex',
              backgroundColor: 'rgba(15, 23, 42, 0.8)',
              padding: '3px',
              borderRadius: '10px',
              border: '1px solid rgba(255, 255, 255, 0.15)'
            }}
          >
            {(['en', 'hi', 'mr'] as SupportedLanguage[]).map((lang) => (
              <button
                key={lang}
                onClick={() => {
                  setLanguage(lang);
                  audioAlert.playPing();
                }}
                style={{
                  backgroundColor: language === lang ? '#2563EB' : 'transparent',
                  color: language === lang ? '#FFFFFF' : '#94A3B8',
                  border: 'none',
                  borderRadius: '7px',
                  padding: '4px 10px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {lang === 'en' ? 'EN' : lang === 'hi' ? 'हिन्दी' : 'मराठी'}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ============================================================ */}
      {/* 2. SCENARIO SWITCHER BAR                                     */}
      {/* ============================================================ */}
      <div
        style={{
          padding: '10px 24px',
          backgroundColor: '#0F172A',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '11px', fontWeight: 800, color: '#94A3B8', letterSpacing: '0.05em' }}>
            DEMO SCENARIOS:
          </span>

          {[
            { id: 1, label: t.scenarios.s1 },
            { id: 2, label: t.scenarios.s2 },
            { id: 3, label: t.scenarios.s3, activeBadge: true },
            { id: 4, label: t.scenarios.s4 }
          ].map((sc) => {
            const isCurrent = activeScenario === sc.id;
            return (
              <button
                key={sc.id}
                onClick={() => handleScenarioChange(sc.id)}
                style={{
                  backgroundColor: isCurrent ? '#2563EB' : 'rgba(30, 41, 59, 0.7)',
                  color: isCurrent ? '#FFFFFF' : '#94A3B8',
                  border: isCurrent ? '1px solid #60A5FA' : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '20px',
                  padding: '5px 14px',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: isCurrent ? '0 0 14px rgba(37, 99, 235, 0.6)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                <span>{sc.label}</span>
                {sc.activeBadge && isCurrent && (
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: '#60A5FA',
                      display: 'inline-block'
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Reset Demo Button */}
        <button
          onClick={() => handleScenarioChange(1)}
          style={{
            backgroundColor: 'transparent',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: '#CBD5E1',
            borderRadius: '20px',
            padding: '4px 12px',
            fontSize: '11px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <RotateCcw size={12} />
          <span>{t.scenarios.reset}</span>
        </button>
      </div>

      {/* ============================================================ */}
      {/* 3. MAIN 2-PANE PRESENTATION LAYOUT                           */}
      {/* ============================================================ */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(650px, 1fr) 48px 380px',
          padding: '16px 20px 24px 20px',
          gap: '12px',
          alignItems: 'start'
        }}
      >
        {/* ========================================================== */}
        {/* LEFT PANE: PRAVAH OPERATOR COMMAND & LIVE GEOJSON MAP     */}
        {/* ========================================================== */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Top PRAVAH Cards Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1.2fr 1.3fr 1.2fr',
              gap: '12px'
            }}
          >
            {/* 1. LIVE INCIDENT CARD */}
            <div
              style={{
                backgroundColor: 'rgba(15, 23, 42, 0.85)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                borderRadius: '12px',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(15, 23, 42, 0.85) 100%)'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '10px', fontWeight: 800, color: '#94A3B8', letterSpacing: '0.04em' }}>
                    {t.pravah.liveIncident}
                  </span>
                  <span
                    style={{
                      fontSize: '9.5px',
                      fontWeight: 800,
                      backgroundColor: '#EF4444',
                      color: '#FFFFFF',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      letterSpacing: '0.05em'
                    }}
                  >
                    {t.pravah.critical}
                  </span>
                </div>

                <div style={{ fontSize: '13px', fontWeight: 800, color: '#F8FAFC', marginBottom: '4px' }}>
                  {activeScenario === 1
                    ? 'Normal Pilgrim Flow'
                    : activeScenario === 2
                    ? 'Ramkund Density Surge'
                    : activeScenario === 4
                    ? 'Barricade Route Closure'
                    : t.pravah.r17Restriction}
                </div>

                <div style={{ fontSize: '11px', color: '#CBD5E1', lineHeight: 1.4 }}>
                  {activeScenario === 1
                    ? 'All corridors open. Smooth throughput at Godavari Ghats.'
                    : activeScenario === 2
                    ? 'Crowd density approaching 4.2 p/m² at Ramkund steps.'
                    : activeScenario === 4
                    ? 'Complete pedestrian barrier deployed at R17 junction.'
                    : t.pravah.reasonValue}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px', fontSize: '10.5px', color: '#94A3B8' }}>
                <Clock size={12} />
                <span>Detected: 11:58 IST</span>
              </div>
            </div>

            {/* 2. AI RECOMMENDATION CARD */}
            <div
              style={{
                backgroundColor: 'rgba(15, 23, 42, 0.85)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                borderRadius: '12px',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.12) 0%, rgba(15, 23, 42, 0.85) 100%)'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '10px', fontWeight: 800, color: '#94A3B8', letterSpacing: '0.04em' }}>
                    {t.pravah.aiRecTitle}
                  </span>
                  <span
                    style={{
                      fontSize: '9.5px',
                      fontWeight: 800,
                      backgroundColor: 'rgba(16, 185, 129, 0.2)',
                      border: '1px solid #10B981',
                      color: '#34D399',
                      padding: '2px 8px',
                      borderRadius: '4px'
                    }}
                  >
                    {t.pravah.confidence}
                  </span>
                </div>

                <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#38BDF8', marginBottom: '4px' }}>
                  {activeScenario === 1 ? 'Maintain Balanced Standard Flow' : 'Divert via Panchavati R21'}
                </div>

                <div style={{ fontSize: '11px', color: '#CBD5E1', lineHeight: 1.4 }}>
                  {t.pravah.aiRecText}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10.5px', color: '#34D399', marginTop: '10px' }}>
                <Check size={13} />
                <span>Balanced corridor load &lt; 3.0 p/m²</span>
              </div>
            </div>

            {/* 3. OPERATOR ACTION: APPROVE & BROADCAST */}
            <div
              style={{
                backgroundColor: 'rgba(15, 23, 42, 0.85)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <div style={{ fontSize: '10px', fontWeight: 800, color: '#94A3B8', marginBottom: '6px', letterSpacing: '0.04em' }}>
                  {t.pravah.operatorAction}
                </div>

                <div style={{ fontSize: '11px', color: '#94A3B8', marginBottom: '12px' }}>
                  Clicking authorizes real-time push to all pilgrim apps and kiosks in Nashik.
                </div>
              </div>

              <button
                onClick={handleApproveBroadcast}
                style={{
                  backgroundColor: isApproved ? '#10B981' : '#2563EB',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  fontSize: '11.5px',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  boxShadow: isApproved ? '0 4px 14px rgba(16, 185, 129, 0.5)' : '0 4px 14px rgba(37, 99, 235, 0.4)',
                  transition: 'all 0.2s ease'
                }}
              >
                <CheckCircle2 size={15} />
                <span>{isApproved ? 'Broadcast Active ✓' : t.pravah.approveBroadcast}</span>
              </button>
            </div>
          </div>

          {/* Pilgrim Impact Metrics 4-Box Row */}
          <div
            style={{
              backgroundColor: 'rgba(15, 23, 42, 0.85)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              padding: '10px 14px'
            }}
          >
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#94A3B8', marginBottom: '6px' }}>
              {t.pravah.pilgrimImpact}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', textAlign: 'center' }}>
              <div style={{ backgroundColor: 'rgba(0,0,0,0.3)', padding: '6px 2px', borderRadius: '6px' }}>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#38BDF8' }}>1,284</div>
                <div style={{ fontSize: '9px', color: '#94A3B8' }}>{t.pravah.notified}</div>
              </div>

              <div style={{ backgroundColor: 'rgba(0,0,0,0.3)', padding: '6px 2px', borderRadius: '6px' }}>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#60A5FA' }}>12</div>
                <div style={{ fontSize: '9px', color: '#94A3B8' }}>{t.pravah.volunteers}</div>
              </div>

              <div style={{ backgroundColor: 'rgba(0,0,0,0.3)', padding: '6px 2px', borderRadius: '6px' }}>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#34D399' }}>93</div>
                <div style={{ fontSize: '9px', color: '#94A3B8' }}>Nashik GIS POIs</div>
              </div>

              <div style={{ backgroundColor: 'rgba(0,0,0,0.3)', padding: '6px 2px', borderRadius: '6px' }}>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#10B981' }}>-8 min</div>
                <div style={{ fontSize: '9px', color: '#94A3B8' }}>{t.pravah.expectedDelay}</div>
              </div>
            </div>
          </div>

          {/* THE LIVE OPENFREEMAP & NASHIK GEOJSON CANVAS */}
          <OpenFreeMapCanvas
            routes={realtimeHub.getRoutes()}
            activeRouteId="R21"
            isDiverted={isApproved || activeScenario === 3 || activeScenario === 4}
            language={language}
            showCrowdDensity={showCrowdDensity}
            showFacilities={showFacilities}
            simulatedPosition={currentSimCoord}
            activePoiId={activePoiId}
            activePolyline={activeCoordinates}
            targetDestinationName={destinationName}
            onSelectPoi={handleSelectPoi}
            onToggleCrowdDensity={() => setShowCrowdDensity(!showCrowdDensity)}
            onToggleFacilities={() => setShowFacilities(!showFacilities)}
          />

          {/* LOWER SECTION: TIMELINE + SYSTEM BANNER */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1.2fr 1fr',
              gap: '12px',
              alignItems: 'stretch'
            }}
          >
            {/* LIVE INCIDENT TIMELINE */}
            <div
              style={{
                backgroundColor: 'rgba(15, 23, 42, 0.85)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                padding: '12px 16px'
              }}
            >
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#94A3B8', marginBottom: '8px', letterSpacing: '0.04em' }}>
                {t.pravah.timelineTitle}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '10.5px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#F97316', fontWeight: 700, width: '38px' }}>11:56</span>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#F97316' }} />
                  <span style={{ color: '#CBD5E1' }}>{t.pravah.t1}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#F97316', fontWeight: 700, width: '38px' }}>11:57</span>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#F97316' }} />
                  <span style={{ color: '#CBD5E1' }}>{t.pravah.t2}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#EF4444', fontWeight: 700, width: '38px' }}>11:58</span>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#EF4444' }} />
                  <span style={{ color: '#F87171', fontWeight: 600 }}>{t.pravah.t3}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#10B981', fontWeight: 700, width: '38px' }}>11:59</span>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10B981' }} />
                  <span style={{ color: '#CBD5E1' }}>{t.pravah.t4}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#38BDF8', fontWeight: 700, width: '38px' }}>12:00</span>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#38BDF8' }} />
                  <span style={{ color: '#CBD5E1' }}>{t.pravah.t5}</span>
                </div>
              </div>
            </div>

            {/* AI + HUMAN + SYSTEM BANNER */}
            <div
              style={{
                backgroundColor: 'rgba(15, 23, 42, 0.85)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.3) 0%, rgba(15, 23, 42, 0.85) 100%)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '10px', backgroundColor: '#1E3A8A', border: '1px solid #3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60A5FA' }}>
                  <Compass size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#FFFFFF' }}>
                    {t.pravah.systemBannerTitle}
                  </div>
                  <div style={{ fontSize: '10.5px', color: '#94A3B8' }}>
                    {t.pravah.systemBannerSubtitle}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', color: '#34D399', backgroundColor: 'rgba(16, 185, 129, 0.12)', padding: '6px 10px', borderRadius: '8px', border: '1px solid rgba(16,185,129,0.3)', marginTop: '10px' }}>
                <CheckCircle2 size={12} />
                <span>Sub-second tactile synchronicity verified</span>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================== */}
        {/* CENTER DIVIDER: LIVE SYNC ARROWS                          */}
        {/* ========================================================== */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            height: '100%',
            minHeight: '700px',
            color: syncFlash ? '#38BDF8' : '#64748B',
            fontWeight: 800,
            fontSize: '11px',
            letterSpacing: '0.1em'
          }}
        >
          <div style={{ animation: 'syncArrows 1.5s infinite', fontSize: '16px' }}>&gt;&gt;</div>
          <div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', textTransform: 'uppercase' }}>
            LIVE SYNC
          </div>
          <div style={{ animation: 'syncArrows 1.5s infinite', fontSize: '16px' }}>&lt;&lt;</div>
        </div>

        {/* ========================================================== */}
        {/* RIGHT COLUMN: ANUBHAV PILGRIM SMARTPHONE (iPhone Bezel)    */}
        {/* ========================================================== */}
        <div
          style={{
            width: '380px',
            minHeight: '800px',
            backgroundColor: '#0F172A',
            borderRadius: '44px',
            border: '8px solid #334155',
            boxShadow: '0 25px 60px rgba(0,0,0,0.8), inset 0 0 0 2px rgba(255,255,255,0.1)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative'
          }}
        >
          {/* Dynamic Island / Speaker Notch */}
          <div style={{ height: '32px', backgroundColor: '#0B132B', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px', fontSize: '11px', color: '#94A3B8' }}>
            <span style={{ fontWeight: 700, color: '#fff' }}>11:58</span>
            <div style={{ width: '80px', height: '18px', backgroundColor: '#000000', borderRadius: '12px' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span>5G</span>
              <span>🔋</span>
            </div>
          </div>

          {/* Smartphone Header with Temple Banner */}
          <div
            style={{
              padding: '12px 16px',
              background: 'linear-gradient(180deg, #1E293B 0%, #0F172A 100%)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontSize: '14px' }}>
                🪷
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#FFFFFF' }}>
                  {t.mobile.title}
                </div>
                <div style={{ fontSize: '9.5px', color: '#94A3B8' }}>
                  {t.mobile.subtitle}
                </div>
              </div>
            </div>

            {/* Language Switcher Badge on Phone */}
            <button
              onClick={() => {
                const nextLang: SupportedLanguage = language === 'en' ? 'hi' : language === 'hi' ? 'mr' : 'en';
                setLanguage(nextLang);
                audioAlert.playPing();
              }}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '16px',
                padding: '3px 8px',
                color: '#FFFFFF',
                fontSize: '10px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                cursor: 'pointer'
              }}
            >
              <Globe size={11} />
              <span>{language.toUpperCase()}</span>
            </button>
          </div>

          {/* Incoming Police Broadcast Toast if Active */}
          {broadcastAlertToast && (
            <div
              style={{
                margin: '8px 12px 0 12px',
                backgroundColor: '#DC2626',
                color: '#FFFFFF',
                borderRadius: '10px',
                padding: '8px 12px',
                fontSize: '10.5px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(220, 38, 38, 0.5)',
                animation: 'pulseGlow 1.5s infinite'
              }}
            >
              <Radio size={14} />
              <span>{broadcastAlertToast}</span>
            </div>
          )}

          {/* Smartphone Body Content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Automatic Reroute Alert Banner (Flashing when VIP broadcast triggers) */}
            {autoRerouteAlert && (
              <div
                style={{
                  backgroundColor: '#FEF2F2',
                  border: '1.5px solid #EF4444',
                  borderRadius: '12px',
                  padding: '10px 12px',
                  display: 'flex',
                  gap: '8px',
                  alignItems: 'center',
                  boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)',
                  animation: 'pulseGlow 1.4s infinite'
                }}
              >
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: '#EF4444',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: '12px',
                    flexShrink: 0
                  }}
                >
                  🚨
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#991B1B' }}>
                    AUTOMATIC REROUTE ACTIVE
                  </div>
                  <div style={{ fontSize: '9.5px', color: '#B91C1C', marginTop: '2px', lineHeight: 1.3 }}>
                    {autoRerouteAlert}
                  </div>
                </div>
              </div>
            )}

            {/* 1. ALERT NOTIFICATION BANNER */}
            <div
              style={{
                backgroundColor: activeScenario === 1 ? '#ECFDF5' : '#FEF2F2',
                border: activeScenario === 1 ? '1px solid #A7F3D0' : '1px solid #FECACA',
                borderRadius: '12px',
                padding: '10px 12px',
                display: 'flex',
                gap: '10px',
                alignItems: 'flex-start'
              }}
            >
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: activeScenario === 1 ? '#10B981' : '#EF4444',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: '12px',
                  flexShrink: 0
                }}
              >
                {activeScenario === 1 ? '✓' : '⚠️'}
              </div>
              <div>
                <div
                  style={{
                    fontSize: '12px',
                    fontWeight: 800,
                    color: activeScenario === 1 ? '#065F46' : '#991B1B'
                  }}
                >
                  {activeScenario === 1 ? 'All Corridors Clear' : t.mobile.alertTitle}
                </div>
                <div
                  style={{
                    fontSize: '10px',
                    color: activeScenario === 1 ? '#047857' : '#B91C1C',
                    marginTop: '2px',
                    lineHeight: 1.35
                  }}
                >
                  {activeScenario === 1 ? 'Normal movement to Ramkund and Tapovan.' : t.mobile.alertText}
                </div>
              </div>
            </div>

            {/* 2. ROUTE PLANNING & START JOURNEY CARD */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '14px',
                padding: '12px 14px',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
                color: '#0F172A'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '22px', height: '22px', borderRadius: '6px', backgroundColor: '#E0F2FE', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284C7', fontSize: '12px' }}>
                    🗺️
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: '#0284C7' }}>
                    {t.mobile.newRouteTitle}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 700, color: '#0F172A', backgroundColor: '#F1F5F9', padding: '3px 6px', borderRadius: '6px' }}>
                  <Footprints size={12} />
                  <span>{currentNavStep.eta} ({currentNavStep.dist})</span>
                </div>
              </div>

              <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#334155', margin: '4px 0 2px 0' }}>
                📍 {originName}
              </div>
              <div style={{ color: '#64748B', fontSize: '10px', margin: '0 0 2px 0' }}>↓</div>
              <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#2563EB', marginBottom: '12px' }}>
                🛕 {destinationName}
              </div>

              {/* Start Journey or Live Navigation Controls */}
              {!phoneNavMode ? (
                <button
                  onClick={handleStartJourney}
                  style={{
                    width: '100%',
                    backgroundColor: '#2563EB',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '10px',
                    fontSize: '12.5px',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)'
                  }}
                >
                  <Play size={14} fill="#fff" />
                  <span>{t.mobile.startJourney}</span>
                </button>
              ) : (
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={handleToggleSimulation}
                    style={{
                      flex: 1,
                      backgroundColor: isSimPlaying ? '#EA580C' : '#10B981',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px',
                      fontSize: '11.5px',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    {isSimPlaying ? <Pause size={13} fill="#fff" /> : <Play size={13} fill="#fff" />}
                    <span>{isSimPlaying ? 'Pause' : 'Resume'}</span>
                  </button>

                  <button
                    onClick={handleNextStep}
                    title="Skip to next waypoint"
                    style={{
                      backgroundColor: '#F1F5F9',
                      color: '#0F172A',
                      border: '1px solid #CBD5E1',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <SkipForward size={13} />
                    <span>Next</span>
                  </button>

                  <button
                    onClick={handleResetSimulation}
                    title="Reset Journey"
                    style={{
                      backgroundColor: '#F1F5F9',
                      color: '#64748B',
                      border: '1px solid #CBD5E1',
                      borderRadius: '8px',
                      padding: '8px 10px',
                      fontSize: '11px',
                      cursor: 'pointer'
                    }}
                  >
                    <RotateCcw size={13} />
                  </button>
                </div>
              )}
            </div>

            {/* 3. ACTIVE TURN-BY-TURN GUIDANCE HUD (When Navigating) */}
            {phoneNavMode && (
              <div
                style={{
                  backgroundColor: '#1E293B',
                  border: '1.5px solid #38BDF8',
                  borderRadius: '14px',
                  padding: '12px',
                  boxShadow: '0 4px 16px rgba(56, 189, 248, 0.25)',
                  animation: 'fadeIn 0.3s'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '13px' }}>
                      {currentNavStep.arrow === 'left' ? <CornerUpLeft size={14} /> : currentNavStep.arrow === 'right' ? <CornerUpRight size={14} /> : currentNavStep.arrow === 'arrive' ? <Flag size={14} /> : <MoveUp size={14} />}
                    </div>
                    <span style={{ fontSize: '10px', fontWeight: 800, color: '#38BDF8', letterSpacing: '0.04em' }}>
                      LIVE GPS STEP {simStep + 1}/{activePath.length}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      const prompt =
                        language === 'mr'
                          ? currentNavStep.instruction_mr
                          : language === 'hi'
                          ? currentNavStep.instruction_hi
                          : currentNavStep.instruction_en;
                      speechService.speak(prompt, language);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#38BDF8',
                      cursor: 'pointer',
                      padding: '2px'
                    }}
                    title="Repeat voice instruction"
                  >
                    <Volume2 size={16} />
                  </button>
                </div>

                <div style={{ fontSize: '12px', fontWeight: 700, color: '#FFFFFF', lineHeight: 1.4, marginBottom: '8px' }}>
                  {language === 'mr'
                    ? currentNavStep.instruction_mr
                    : language === 'hi'
                    ? currentNavStep.instruction_hi
                    : currentNavStep.instruction_en}
                </div>

                {/* Progress bar */}
                <div style={{ width: '100%', height: '5px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden', marginBottom: '8px' }}>
                  <div
                    style={{
                      width: `${Math.round(100 * (simStep / (activePath.length - 1)))}%`,
                      height: '100%',
                      backgroundColor: '#38BDF8',
                      transition: 'width 0.4s ease'
                    }}
                  />
                </div>

                {/* Live Speed & Crowd Density meter */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9.5px', color: '#94A3B8' }}>
                  <span>Speed: <strong>4.2 km/h</strong></span>
                  <span>Crowd: <strong style={{ color: '#34D399' }}>{currentNavStep.crowd} (Safe)</strong></span>
                  <span>Remaining: <strong style={{ color: '#38BDF8' }}>{currentNavStep.dist}</strong></span>
                </div>
              </div>
            )}

            {/* 4. AI QUERY SUGGESTION CHIPS */}
            <div>
              <div style={{ fontSize: '10.5px', fontWeight: 800, color: '#94A3B8', marginBottom: '6px' }}>
                💡 SUGGESTED DEMO QUERIES:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {queryChips.map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setPhoneQuery(chip.query);
                      executeQuery(chip.query);
                    }}
                    style={{
                      backgroundColor: 'rgba(30, 41, 59, 0.9)',
                      border: '1px solid rgba(56, 189, 248, 0.25)',
                      borderRadius: '6px',
                      padding: '3px 7px',
                      color: '#E2E8F0',
                      fontSize: '9.5px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <span>{chip.icon}</span>
                    <span>
                      {language === 'mr' ? chip.label_mr : language === 'hi' ? chip.label_hi : chip.label_en}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* 5. INTERACTIVE AI QUERY INPUT (Ask ANUBHAV + Voice Mic) */}
            <div
              style={{
                backgroundColor: '#1E293B',
                borderRadius: '12px',
                padding: '8px 12px',
                border: isVoiceListening ? '1.5px solid #EF4444' : '1px solid rgba(56, 189, 248, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: isVoiceListening ? '0 0 12px rgba(239, 68, 68, 0.4)' : 'none'
              }}
            >
              <div
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  backgroundColor: '#2563EB',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '13px'
                }}
              >
                🤖
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '8.5px', color: '#94A3B8' }}>{t.mobile.needHelp}</div>
                <input
                  type="text"
                  value={phoneQuery}
                  onChange={(e) => setPhoneQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handlePhoneQuery()}
                  placeholder={
                    isVoiceListening
                      ? 'Listening in ' + language.toUpperCase() + '...'
                      : t.mobile.askPlaceholder
                  }
                  style={{
                    width: '100%',
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: '#fff',
                    fontSize: '11px',
                    outline: 'none',
                    padding: 0
                  }}
                />
              </div>

              {/* Voice Mic Button */}
              <button
                onClick={handleToggleMic}
                style={{
                  backgroundColor: isVoiceListening ? '#EF4444' : 'transparent',
                  border: 'none',
                  borderRadius: '50%',
                  color: isVoiceListening ? '#FFFFFF' : '#38BDF8',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title={isVoiceListening ? 'Stop listening' : 'Speak your query'}
              >
                {isVoiceListening ? <MicOff size={15} /> : <Mic size={15} />}
              </button>

              {/* Send Button */}
              <button
                onClick={handlePhoneQuery}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: '#38BDF8',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                <Send size={15} />
              </button>
            </div>

            {/* 6. AI ASSISTANT ANSWER CARD (Appears when query is processed) */}
            {isAgentThinking && (
              <div
                style={{
                  backgroundColor: '#1E293B',
                  border: '1px dashed #38BDF8',
                  borderRadius: '12px',
                  padding: '10px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#94A3B8',
                  fontSize: '11px'
                }}
              >
                <Sparkles size={16} style={{ color: '#38BDF8' }} />
                <span>ANUBHAV AI reasoning with Nashik Crowd Engine...</span>
              </div>
            )}

            {agentResponse && !isAgentThinking && (
              <div
                style={{
                  backgroundColor: '#0F172A',
                  border: '1px solid rgba(56, 189, 248, 0.4)',
                  borderRadius: '12px',
                  padding: '12px',
                  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.4)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '11px' }}>🤖</span>
                    <span style={{ fontSize: '10px', fontWeight: 800, color: '#38BDF8' }}>
                      ANUBHAV AI ASSISTANT
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '8.5px', color: '#10B981', fontWeight: 700, backgroundColor: 'rgba(16,185,129,0.15)', padding: '1px 5px', borderRadius: '4px' }}>
                      {agentResponse.primary_metric || '96% Match'}
                    </span>

                    {/* Replay Voice button */}
                    <button
                      onClick={() => speechService.speak(agentResponse.speak_text, language)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#38BDF8',
                        cursor: 'pointer',
                        padding: 0
                      }}
                      title="Replay Voice response"
                    >
                      <Volume2 size={13} />
                    </button>
                  </div>
                </div>

                <div style={{ fontSize: '11px', fontWeight: 800, color: '#38BDF8', marginBottom: '4px' }}>
                  {agentResponse.title}
                </div>

                <div
                  style={{
                    fontSize: '11px',
                    color: '#E2E8F0',
                    lineHeight: 1.4,
                    whiteSpace: 'pre-line',
                    marginBottom: '10px'
                  }}
                >
                  {agentResponse.summary}
                </div>

                <button
                  onClick={handleStartJourney}
                  style={{
                    width: '100%',
                    backgroundColor: '#1E3A8A',
                    color: '#93C5FD',
                    border: '1px solid #3B82F6',
                    borderRadius: '8px',
                    padding: '8px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <span>Start Navigation to this destination</span>
                  <span>➔</span>
                </button>
              </div>
            )}

            {/* 7. NEARBY FACILITIES (4 Quick Tiles) */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#FFFFFF' }}>
                  {t.mobile.nearbyFacilities}
                </span>
                <span
                  onClick={() => setShowFacilities(!showFacilities)}
                  style={{ fontSize: '9.5px', color: '#38BDF8', fontWeight: 700, cursor: 'pointer' }}
                >
                  {showFacilities ? 'Hide Pins' : 'Show on Map'}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                {/* Toilet */}
                <div
                  onClick={() => executeQuery('Nearest clean sanitation toilet')}
                  style={{ backgroundColor: '#1E293B', borderRadius: '10px', padding: '8px 4px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer' }}
                >
                  <div style={{ fontSize: '16px', marginBottom: '2px' }}>🚻</div>
                  <div style={{ fontSize: '9.5px', fontWeight: 700, color: '#FFFFFF' }}>{t.mobile.toilet}</div>
                  <div style={{ fontSize: '8.5px', color: '#94A3B8' }}>250 m</div>
                </div>

                {/* Water */}
                <div
                  onClick={() => executeQuery('Nearest drinking water')}
                  style={{ backgroundColor: '#1E293B', borderRadius: '10px', padding: '8px 4px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer' }}
                >
                  <div style={{ fontSize: '16px', marginBottom: '2px' }}>💧</div>
                  <div style={{ fontSize: '9.5px', fontWeight: 700, color: '#FFFFFF' }}>{t.mobile.water}</div>
                  <div style={{ fontSize: '8.5px', color: '#94A3B8' }}>180 m</div>
                </div>

                {/* Medical */}
                <div
                  onClick={() => executeQuery('Emergency medical help')}
                  style={{ backgroundColor: '#1E293B', borderRadius: '10px', padding: '8px 4px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer' }}
                >
                  <div style={{ fontSize: '16px', marginBottom: '2px' }}>➕</div>
                  <div style={{ fontSize: '9.5px', fontWeight: 700, color: '#FFFFFF' }}>{t.mobile.medical}</div>
                  <div style={{ fontSize: '8.5px', color: '#94A3B8' }}>450 m</div>
                </div>

                {/* Volunteer */}
                <div
                  onClick={() => executeQuery('Where are the police volunteers?')}
                  style={{ backgroundColor: '#1E293B', borderRadius: '10px', padding: '8px 4px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer' }}
                >
                  <div style={{ fontSize: '16px', marginBottom: '2px' }}>👥</div>
                  <div style={{ fontSize: '9.5px', fontWeight: 700, color: '#FFFFFF' }}>{t.mobile.volunteer}</div>
                  <div style={{ fontSize: '8.5px', color: '#94A3B8' }}>300 m</div>
                </div>
              </div>
            </div>
          </div>

          {/* 8. BOTTOM NAVIGATION BAR */}
          <div
            style={{
              height: '48px',
              backgroundColor: '#0B132B',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-around',
              fontSize: '9.5px',
              color: '#94A3B8'
            }}
          >
            <div
              onClick={() => {
                setPhoneNavMode(false);
                setAgentResponse(null);
              }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: !phoneNavMode ? '#38BDF8' : '#94A3B8', fontWeight: 700, cursor: 'pointer' }}
            >
              <span>🏠</span>
              <span>{t.mobile.navHome}</span>
            </div>
            <div
              onClick={() => {
                setPhoneNavMode(true);
                setIsSimPlaying(true);
              }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: phoneNavMode ? '#38BDF8' : '#94A3B8', fontWeight: 700, cursor: 'pointer' }}
            >
              <span>🗺️</span>
              <span>{t.mobile.navMap}</span>
            </div>
            <div
              onClick={() => {
                executeQuery('Where is Ramkund Ghat?');
              }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}
            >
              <span>💬</span>
              <span>{t.mobile.navAsk}</span>
            </div>
            <div
              onClick={() => {
                audioAlert.playPing();
                setLanguage(language === 'en' ? 'hi' : language === 'hi' ? 'mr' : 'en');
              }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}
            >
              <span>🌐</span>
              <span>{language.toUpperCase()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
