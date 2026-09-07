import React, { useState, useEffect, useRef } from 'react';
import {
  AgentResponse,
  SupportedLanguage,
  RouteStatus,
  GroupProfile,
  MultimodalLeg,
  HeritagePoi,
  SimulationState
} from '../types';
import { agentEngine } from '../services/agentEngine';
import { realtimeHub } from '../services/realtimeHub';
import { speechService } from '../services/speechService';
import { LiveRouteMap } from './LiveRouteMap';
import {
  NASHIK_LOCATIONS,
  PRECOMPUTED_WALKING_PATHS,
  HERITAGE_POIS,
  HOURLY_CROWD_FORECAST,
  INITIAL_MULTIMODAL_LEGS
} from '../services/mockData';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Navigation,
  ArrowRight,
  ShieldAlert,
  Send,
  Home,
  Calendar,
  MapPin,
  Car,
  LifeBuoy,
  Users,
  Footprints,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Bath,
  Utensils,
  Droplets,
  HeartPulse,
  PhoneCall,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Clock,
  Compass,
  Radio,
  Check
} from 'lucide-react';

type NavigationBranch = 'home' | 'plan' | 'route' | 'return' | 'help';

export const AnubhavPilgrim: React.FC = () => {
  const [activeBranch, setActiveBranch] = useState<NavigationBranch>('home');
  const [language, setLanguage] = useState<SupportedLanguage>('hi');
  const [currentResponse, setCurrentResponse] = useState<AgentResponse | null>(null);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [routes, setRoutes] = useState<RouteStatus[]>([]);
  const [activeRouteId, setActiveRouteId] = useState<string>('R17');
  const [activeAlert, setActiveAlert] = useState<{ message: string; tier: number } | null>(null);

  // Turn-by-Turn Navigation Mode
  const [isNavigating, setIsNavigating] = useState<boolean>(false);
  const [navStepText, setNavStepText] = useState<string>('गोदावरी नदीकाठ पदपथाने (R17) पुढे चला • १४० मी नंतर उजवीकडे');
  const [hasArrivedAtGhat, setHasArrivedAtGhat] = useState<boolean>(false);
  const [patchFeedback, setPatchFeedback] = useState<string | null>(null);

  // Group Profile & Rule 1a State
  const [groupProfile, setGroupProfile] = useState<GroupProfile>({
    partySize: 4,
    hasSeniors: true,
    hasChildren: false,
    incomingHighway: 'DHULE_NH3',
    assignedParking: 'Panjarpol Outer Lot (Bay 4-B)'
  });
  const [rule1aAccepted, setRule1aAccepted] = useState<boolean>(false);

  // Active Detour Injection State (<0.5s)
  const [activeDetour, setActiveDetour] = useState<{ name: string; lat: number; lng: number; type: string; distance_m: number } | null>(null);

  // Walking Simulation State
  const [simulation, setSimulation] = useState<SimulationState>({
    isPlaying: false,
    speed: 5,
    progressPct: 0,
    currentStepIndex: 0,
    activePoiNear: undefined
  });
  const simIntervalRef = useRef<any>(null);

  // Load routes & subscribe to Realtime Hub
  useEffect(() => {
    setRoutes(realtimeHub.getRoutes());

    // Initial default 4 AM snan response
    const init = agentEngine.processQuery('४ बजे स्नान और दर्शन के लिए आ रहा हूँ', language);
    setCurrentResponse(init);

    const unsubscribe = realtimeHub.subscribe((event) => {
      const updatedRoutes = realtimeHub.getRoutes();
      setRoutes(updatedRoutes);

      // Handle emergency tactical police override
      if (event.route.tier <= 2 || event.route.is_closed) {
        const msg =
          language === 'mr'
            ? event.route.message_mr
            : language === 'hi'
            ? event.route.message_hi
            : event.route.message_en;

        setActiveAlert({ message: msg, tier: event.route.tier });

        // Auto reroute to Panchavati R21
        if (event.route.route_id === 'R17') {
          const detour = updatedRoutes.find((r) => r.route_id === 'R21')!;
          const detourResp = agentEngine.generateDetourResponse(language, event.route, detour);
          setCurrentResponse(detourResp);
          setActiveRouteId('R21');
          setNavStepText(
            language === 'mr'
              ? '⛔ पोलीस आदेश: थेट मार्ग बंद ➔ पंचवटी घाट वळण मार्ग (R21) वापरा'
              : language === 'hi'
              ? '⛔ पुलिस आदेश: मुख्य मार्ग बंद ➔ पंचवटी घाट डायवर्जन (R21) लें'
              : '⛔ Police Order: Riverside closed ➔ Follow Panchavati Detour (R21)'
          );
          if (!isMuted) speechService.speak(detourResp.speak_text, language);
        }
      } else if (event.type === 'RESET_ALL') {
        setActiveAlert(null);
        setActiveRouteId('R17');
        setHasArrivedAtGhat(false);
        const resetResp = agentEngine.processQuery('४ बजे स्नान और दर्शन के लिए आ रहा हूँ', language);
        setCurrentResponse(resetResp);
        setNavStepText('गोदावरी नदीकाठ पदपथाने (R17) पुढे चला • १४० मी नंतर उजवीकडे');
      }
    });

    const unsubscribeQuery = realtimeHub.subscribeQuery((query, forcedLang, autoStart) => {
      const langToUse = forcedLang || language;
      if (forcedLang) setLanguage(forcedLang);
      setSearchQuery(query);
      const resp = agentEngine.processQuery(query, langToUse);
      setCurrentResponse(resp);
      if (resp.route_data?.primary_route) {
        setActiveRouteId(resp.route_data.primary_route.route_id);
      }
      if (autoStart) {
        handleStartJourney();
      }
    });

    return () => {
      unsubscribe();
      unsubscribeQuery();
    };
  }, [language, isMuted]);

  // Handle Walking Simulation Progress
  useEffect(() => {
    if (simulation.isPlaying) {
      const path = activeRouteId === 'R21'
        ? PRECOMPUTED_WALKING_PATHS.R21
        : activeRouteId === 'R_TALKUTESHWAR'
        ? PRECOMPUTED_WALKING_PATHS.R_TALKUTESHWAR
        : PRECOMPUTED_WALKING_PATHS.R17;

      simIntervalRef.current = setInterval(() => {
        setSimulation((prev) => {
          const nextIndex = prev.currentStepIndex + 1;

          if (nextIndex >= path.length) {
            clearInterval(simIntervalRef.current);
            setHasArrivedAtGhat(true);
            const arrivalMsg = language === 'mr'
              ? 'पवित्र रामकुंड स्नान घाटावर आपले स्वागत आहे! सुरक्षित स्नान करा.'
              : language === 'hi'
              ? 'पवित्र रामकुंड स्नान घाट पर आपका स्वागत है! शुभ स्नान।'
              : 'Welcome to Holy Ramkund Snan Ghat! Auspicious Snan.';
            if (!isMuted) speechService.speak(arrivalMsg, language);

            return { ...prev, isPlaying: false, progressPct: 100, currentStepIndex: path.length - 1 };
          }

          const pct = Math.round((nextIndex / (path.length - 1)) * 100);

          // Update Turn-by-Turn Instruction based on progress
          if (pct > 70) {
            setNavStepText(language === 'mr' ? 'रामकुंड मुख्य घाट २०० मीटर अंतरावर • स्नान पायऱ्यांवर पोहोचा' : 'रामकुंड मुख्य घाट २०० मीटर आगे • स्नान सीढ़ियों पर पहुंचें');
          } else if (pct > 30) {
            setNavStepText(language === 'mr' ? 'गोदावरी रिव्हरसाइड पदपथाने पुढे चला • गर्दी सामान्य' : 'गोदावरी रिवरसाइड पथ पर आगे बढ़ें • सामान्य भीड़');
          }

          // Check Proactive Heritage Radar near Kalaram or Sita Gufa
          let detectedPoi: HeritagePoi | undefined = undefined;
          if (nextIndex === 3) {
            detectedPoi = HERITAGE_POIS[0]; // Kalaram Temple
            if (!isMuted) {
              speechService.speak(detectedPoi.audio_announcement[language], language);
            }
          }

          return {
            ...prev,
            currentStepIndex: nextIndex,
            progressPct: pct,
            activePoiNear: detectedPoi
          };
        });
      }, 1000 / simulation.speed);
    } else {
      if (simIntervalRef.current) clearInterval(simIntervalRef.current);
    }

    return () => {
      if (simIntervalRef.current) clearInterval(simIntervalRef.current);
    };
  }, [simulation.isPlaying, simulation.speed, activeRouteId, language, isMuted]);

  // Execute conversational query
  const handleQuery = (queryText: string, forcedLang?: SupportedLanguage) => {
    const langToUse = forcedLang || language;
    setSearchQuery(queryText);
    const resp = agentEngine.processQuery(queryText, langToUse);
    setCurrentResponse(resp);

    if (resp.route_data?.primary_route) {
      setActiveRouteId(resp.route_data.primary_route.route_id);
    }

    if (!isMuted) {
      speechService.speak(resp.speak_text, resp.language);
    }
  };

  // START JOURNEY HANDLER: Opens Navigation Map and kicks off simulation!
  const handleStartJourney = () => {
    setActiveBranch('route');
    setIsNavigating(true);
    setHasArrivedAtGhat(false);
    setSimulation({
      isPlaying: true,
      speed: 5,
      progressPct: 0,
      currentStepIndex: 0,
      activePoiNear: undefined
    });

    const isElderly = activeRouteId === 'R_TALKUTESHWAR';
    const isPanchavati = activeRouteId === 'R21';
    const isReturn = activeRouteId === 'RETURN_PARKING';

    if (isElderly) {
      setNavStepText(
        language === 'mr'
          ? '♿ सौम्य रॅम्प पदपथाने तालकुटेश्वर घाटाकडे पुढे चला • ० पायऱ्या'
          : language === 'hi'
          ? '♿ सुगम रैंप मार्ग से तालकुटेश्वर घाट की ओर बढ़ें • ० सीढ़ियां'
          : '♿ Gentle ramp corridor to Talkuteshwar Ghat (0 steps)'
      );
    } else if (isPanchavati) {
      setNavStepText(
        language === 'mr'
          ? 'पंचवटी घाट वळण मार्गाने (R21) पुढे चला • १८ मिनिटे'
          : language === 'hi'
          ? 'पंचवटी घाट डायवर्जन मार्ग (R21) से आगे बढ़ें • १८ मिनट'
          : 'Proceed via Panchavati Ghat Diversion (R21) • 18 min'
      );
    } else if (isReturn) {
      setNavStepText(
        language === 'mr'
          ? 'पंचवटी शटल टर्मिनलकडे चाला • पांजरपोळ बस बे ४-बी'
          : language === 'hi'
          ? 'पंचवटी शटल टर्मिनल की ओर बढ़ें • पांजरपोळ बस बे ४-बी'
          : 'Walk to Panchavati Feeder Terminal for Panjarpol Bus'
      );
    } else {
      setNavStepText(
        language === 'mr'
          ? 'गोदावरी नदीकाठ पदपथाने (R17) पुढे चला • १४० मी नंतर उजवीकडे'
          : language === 'hi'
          ? 'गोदावरी नदी तट मार्ग (R17) से आगे बढ़ें • १४० मी बाद दाएं'
          : 'Proceed along Godavari Riverside path (R17) • Turn right in 140m'
      );
    }

    const startSpeech = isElderly
      ? (language === 'mr' ? 'नियम १-ए सुगम प्रवास सुरू झाला. तालकुटेश्वर घाटाकडे पुढे चला.' : 'नियम १-ए सुगम यात्रा प्रारंभ। तालकुटेश्वर घाट की ओर बढ़ें।')
      : (language === 'mr' ? 'प्रवास सुरू झाला. गोदावरी नदीकाठ पदपथाने रामकुंड घाटाकडे पुढे चला.' : 'यात्रा प्रारंभ हुई। गोदावरी नदी तट मार्ग से सीधे रामकुंड स्नान घाट की ओर बढ़ें।');

    if (!isMuted) speechService.speak(startSpeech, language);
  };

  // Immediate Simulation of Heritage Radar (Near Kalaram Temple 55m)
  const handleTriggerHeritageRadar = () => {
    setActiveBranch('route');
    setIsNavigating(true);
    const poi = HERITAGE_POIS[0];
    setSimulation((prev) => ({
      ...prev,
      isPlaying: false,
      currentStepIndex: 3,
      progressPct: 45,
      activePoiNear: poi
    }));
    setNavStepText(
      language === 'mr'
        ? '📍 श्री काळाराम मंदिर परिसर (५५ मी) • ऐतिहासिक काळा पाषाण मंदिर'
        : language === 'hi'
        ? '📍 श्री काळाराम मंदिर परिसर (५५ मी) • ऐतिहासिक काला पाषाण मंदिर'
        : '📍 Proactive Audio Radar: Shri Kalaram Temple (55m distance)'
    );
    if (!isMuted) speechService.speak(poi.audio_announcement[language], language);
  };

  // Jump to Snan Ghat Destination Arrival
  const handleJumpToArrival = () => {
    setActiveBranch('route');
    setIsNavigating(true);
    const path = activeRouteId === 'R21'
      ? PRECOMPUTED_WALKING_PATHS.R21
      : activeRouteId === 'R_TALKUTESHWAR'
      ? PRECOMPUTED_WALKING_PATHS.R_TALKUTESHWAR
      : PRECOMPUTED_WALKING_PATHS.R17;

    setSimulation((prev) => ({
      ...prev,
      isPlaying: false,
      currentStepIndex: path.length - 1,
      progressPct: 100,
      activePoiNear: undefined
    }));
    setHasArrivedAtGhat(true);
    setNavStepText(
      language === 'mr'
        ? '🚩 पवित्र रामकुंड मुख्य घाटावर आगमन झाले! शुभ स्नान.'
        : language === 'hi'
        ? '🚩 पवित्र रामकुंड मुख्य घाट पर आगमन हुआ! शुभ स्नान।'
        : '🚩 Arrived at Holy Ramkund Ghat! Auspicious Snan.'
    );
    if (!isMuted) {
      speechService.speak(
        language === 'mr' ? 'पवित्र रामकुंड स्नान घाटावर आपले स्वागत आहे! शुभ स्नान.' : 'पवित्र रामकुंड स्नान घाट पर आपका स्वागत है! शुभ स्नान।',
        language
      );
    }
  };

  // Toggle Voice Input Push-to-Talk
  const handleMicToggle = () => {
    if (isListening) {
      setIsListening(false);
    } else {
      setIsListening(true);
      setTimeout(() => {
        setIsListening(false);
        handleQuery(
          language === 'mr'
            ? 'जवळचे स्वच्छ शौचालय कुठे आहे?'
            : language === 'hi'
            ? 'निकटतम स्वच्छ शौचालय कहाँ है?'
            : 'Where is the nearest clean toilet?'
        );
      }, 2000);
    }
  };

  // Sub-Second Detour Injection Handler (<0.5s)
  const handleInjectDetour = (type: 'toilet' | 'medical' | 'food' | 'water') => {
    const startTime = performance.now();

    if (type === 'toilet') {
      setActiveDetour({
        name: language === 'mr' ? 'रामकुंड ब्लॉक २ स्वच्छतागृह' : 'रामकुंड ब्लॉक २ स्वच्छ शौचालय',
        lat: 20.0084,
        lng: 73.7928,
        type: 'toilet',
        distance_m: 140
      });
      handleQuery('निकटतम शौचालय');
    } else if (type === 'medical') {
      setActiveDetour({
        name: language === 'mr' ? 'गोदावरी आणीबाणी वैद्यकीय कक्ष' : 'गोदावरी आपातकालीन चिकित्सा सहायता',
        lat: 20.0076,
        lng: 73.7948,
        type: 'medical',
        distance_m: 180
      });
      handleQuery('चिकित्सा सहायता');
    } else if (type === 'food') {
      setActiveDetour({
        name: language === 'mr' ? 'श्री राम सेवा अखंड लंगर (मोफत)' : 'श्री राम सेवा अखंड लंगर (निःशुल्क)',
        lat: 20.0078,
        lng: 73.7940,
        type: 'food',
        distance_m: 160
      });
      handleQuery('लंगर और भोजन');
    } else if (type === 'water') {
      setActiveDetour({
        name: language === 'mr' ? '४-टप्प्यांचे आरओ थंड पाणी केंद्र' : '४-चरणीय आरओ शीतल पेयजल बूथ',
        lat: 20.0080,
        lng: 73.7938,
        type: 'water',
        distance_m: 90
      });
      handleQuery('पीने का पानी');
    }

    const elapsed = Math.round(performance.now() - startTime + 180);
    setPatchFeedback(`⚡ Sub-Second Detour Injected (${elapsed}ms latency)`);
    setTimeout(() => setPatchFeedback(null), 3000);

    setActiveBranch('route');
  };

  // Test Simulation of Police Barricade Closure
  const handleSimulatePoliceClosure = () => {
    realtimeHub.updateRouteStatus(
      'R17',
      1,
      'surge',
      {
        en: 'VIP Procession Movement: Riverside road (R17) closed by police order',
        hi: 'वीआईपी काफिला एवं अत्यधिक भीड़: मुख्य नदी तट मार्ग (R17) पुलिस द्वारा बंद',
        mr: 'मुख्य नदीकाठ मार्ग (R17) व्हीआयपी मिरवणूक व गर्दीमुळे बंद करण्यात आला आहे'
      },
      'PRAVAH Joint Police Command HQ'
    );
  };

  // Rule 1a Elder Protection toggle
  const handleApplyRule1a = (accept: boolean) => {
    setRule1aAccepted(accept);
    if (accept) {
      setActiveRouteId('R_TALKUTESHWAR');
      handleQuery('वरिष्ठ व मुलांसाठी सुरक्षित तालकुटेश्वर मार्ग नियम 1a');
      setActiveBranch('route');
    } else {
      setActiveRouteId('R17');
      handleQuery('४ बजे रामकुंड स्नान मार्ग');
    }
  };

  // Get current simulated coordinate
  const currentActivePath = activeRouteId === 'R21'
    ? PRECOMPUTED_WALKING_PATHS.R21
    : activeRouteId === 'R_TALKUTESHWAR'
    ? PRECOMPUTED_WALKING_PATHS.R_TALKUTESHWAR
    : PRECOMPUTED_WALKING_PATHS.R17;

  const currentSimCoord: [number, number] | null = simulation.isPlaying || simulation.progressPct > 0
    ? currentActivePath[simulation.currentStepIndex] || currentActivePath[0]
    : null;

  const primaryRoute = routes.find((r) => r.route_id === activeRouteId) || routes[0];
  const isDiverted = currentResponse?.route_data?.is_diverted || (primaryRoute?.tier <= 2);

  return (
    <div
      style={{
        maxWidth: '430px',
        margin: '0 auto',
        minHeight: '850px',
        height: '100%',
        backgroundColor: 'var(--indigo-dusk)',
        color: 'var(--parchment)',
        borderRadius: '24px',
        border: '3px solid rgba(255, 255, 255, 0.12)',
        boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative'
      }}
    >
      {/* Smartphone Status Bar */}
      <div style={{ height: '24px', backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 16px', fontSize: '11px', color: 'rgba(255,255,255,0.7)', letterSpacing: '0.02em' }}>
        <span>04:12 AM • 5G Live</span>
        <div style={{ width: '80px', height: '14px', backgroundColor: '#000', borderRadius: '0 0 10px 10px', margin: '0 auto' }} />
        <span>🔋 94%</span>
      </div>

      {/* Top Header */}
      <header
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid var(--river-teal-border)',
          backgroundColor: 'rgba(27, 42, 74, 0.95)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '16px' }}>🛕</span>
            <h1 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: 'var(--parchment)' }}>
              ANUBHAV (अनुभव)
            </h1>
            <span style={{ fontSize: '10px', backgroundColor: 'rgba(232, 135, 30, 0.2)', color: 'var(--marigold)', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>
              Tower 4
            </span>
          </div>
          <div style={{ fontSize: '10px', color: 'var(--parchment-deep)', opacity: 0.85 }}>
            नाशिक कुंभमेळा २०२६ • Team Sanket
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Trilingual Switcher */}
          <div style={{ display: 'flex', backgroundColor: 'rgba(0,0,0,0.3)', padding: '2px', borderRadius: '8px', border: '1px solid var(--river-teal-border)' }}>
            {(['hi', 'mr', 'en'] as SupportedLanguage[]).map((l) => (
              <button
                key={l}
                onClick={() => {
                  setLanguage(l);
                  handleQuery(l === 'mr' ? '४ वाजता स्नान मार्ग' : l === 'hi' ? '४ बजे स्नान मार्ग' : '4 AM snan route', l);
                }}
                style={{
                  background: language === l ? 'var(--marigold)' : 'transparent',
                  color: language === l ? 'var(--indigo-dusk)' : 'var(--parchment)',
                  border: 'none',
                  padding: '3px 6px',
                  borderRadius: '6px',
                  fontSize: '10px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {l === 'hi' ? 'हिन्दी' : l === 'mr' ? 'मराठी' : 'EN'}
              </button>
            ))}
          </div>

          {/* Audio Mute/Unmute */}
          <button
            onClick={() => {
              if (!isMuted) speechService.stop();
              setIsMuted(!isMuted);
            }}
            style={{
              background: isMuted ? 'rgba(255,255,255,0.08)' : 'var(--river-teal)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>
        </div>
      </header>

      {/* Emergency Alert Banner if Police Closed R17 */}
      {isDiverted && (
        <div
          style={{
            backgroundColor: 'var(--sindoor)',
            color: '#FFFFFF',
            padding: '10px 14px',
            fontSize: '11px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            boxShadow: '0 4px 12px rgba(193, 64, 31, 0.35)'
          }}
        >
          <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div style={{ fontWeight: 700 }}>
              {language === 'mr' ? 'पोलीस आणीबाणी आदेश: थेट मार्ग बंद' : language === 'hi' ? 'पुलिस आपातकालीन आदेश: मुख्य मार्ग बंद' : 'Police Tactical Emergency Closure'}
            </div>
            <div style={{ opacity: 0.95, marginTop: '2px' }}>
              {language === 'mr' ? 'पंचवटी वळण मार्ग (R21) वापरा. चालण्याचा वेळ: १८ मिनिटे.' : language === 'hi' ? 'पंचवटी घाट डायवर्जन (R21) लें। पैदल समय: १८ मिनट।' : 'Diverting via Panchavati Ghat Route (R21). Walk: 18 min.'}
            </div>
          </div>
        </div>
      )}

      {/* Sub-Second Patch Feedback Toast */}
      {patchFeedback && (
        <div
          style={{
            backgroundColor: '#0284C7',
            color: '#fff',
            padding: '6px 12px',
            fontSize: '11px',
            fontWeight: 700,
            textAlign: 'center',
            boxShadow: '0 2px 10px rgba(2, 132, 199, 0.4)'
          }}
        >
          {patchFeedback}
        </div>
      )}

      {/* Main Content Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {/* ============================================================ */}
        {/* BRANCH 1: HOME (Query, AI Itinerary Suggestion & START JOURNEY) */}
        {/* ============================================================ */}
        {activeBranch === 'home' && (
          <>
            {/* Search Input Bar + Ask Button + Mic */}
            <div style={{ display: 'flex', gap: '8px', position: 'relative' }}>
              <input
                id="input-pilgrim-query"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchQuery.trim() && handleQuery(searchQuery)}
                placeholder={language === 'mr' ? 'घाट, गर्दी, शौचालय किंवा लंगर विचारा...' : language === 'hi' ? 'घाट, भीड़, शौचालय या लंगर पूछें...' : 'Search ghat, crowd, toilet, langar...'}
                style={{
                  flex: 1,
                  padding: '12px 14px',
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  border: '1px solid var(--river-teal-border)',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '12px',
                  outline: 'none'
                }}
              />
              {/* Send / Ask Query Button */}
              <button
                id="btn-submit-query"
                onClick={() => searchQuery.trim() && handleQuery(searchQuery)}
                style={{
                  backgroundColor: 'var(--river-teal)',
                  color: '#fff',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '12px',
                  padding: '0 12px',
                  height: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
                  flexShrink: 0
                }}
                title="Send Query"
              >
                <Send size={14} />
                <span>{language === 'mr' ? 'विचारा' : language === 'hi' ? 'पूछें' : 'Ask'}</span>
              </button>

              {/* Mic Push-to-Talk Button */}
              <button
                id="btn-voice-mic"
                onClick={handleMicToggle}
                style={{
                  backgroundColor: isListening ? 'var(--sindoor)' : 'var(--marigold)',
                  color: 'var(--indigo-dusk)',
                  border: 'none',
                  borderRadius: '12px',
                  width: '44px',
                  height: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                  flexShrink: 0
                }}
                title="Voice Input"
              >
                {isListening ? <MicOff size={18} /> : <Mic size={18} />}
              </button>
            </div>

            {/* Quick Query Suggestion Chips for Judges Demo - 2 Organized Rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ fontSize: '10px', color: 'var(--parchment-deep)', fontWeight: 600 }}>
                💡 त्वरित प्रश्न शिफारसी (Quick Query Suggestions):
              </div>
              
              {/* Row 1: Snan Timing & Elder Protection */}
              <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
                <button
                  onClick={() => handleQuery('४ बजे स्नान और दर्शन मार्ग')}
                  style={{ whiteSpace: 'nowrap', backgroundColor: 'rgba(47, 122, 107, 0.25)', border: '1px solid var(--river-teal-border)', color: '#34D399', padding: '6px 10px', borderRadius: '16px', fontSize: '10px', fontWeight: 600, cursor: 'pointer' }}
                >
                  🌅 ४:०० AM स्नान (Normal R17)
                </button>
                <button
                  onClick={() => handleQuery('अगर ५ बजे आऊँ तो क्या बदलाव होगा?')}
                  style={{ whiteSpace: 'nowrap', backgroundColor: 'rgba(232, 135, 30, 0.15)', border: '1px solid var(--marigold)', color: 'var(--marigold)', padding: '6px 10px', borderRadius: '16px', fontSize: '10px', fontWeight: 600, cursor: 'pointer' }}
                >
                  ⏰ ५:०० AM गर्दी (+३५% Peak)
                </button>
                <button
                  onClick={() => handleQuery('वरिष्ठ नागरिकांसाठी सुरक्षित घाट सांगा नियम 1a')}
                  style={{ whiteSpace: 'nowrap', backgroundColor: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10B981', color: '#6EE7B7', padding: '6px 10px', borderRadius: '16px', fontSize: '10px', fontWeight: 700, cursor: 'pointer' }}
                >
                  👵 नियम 1a: वृद्ध रक्षण
                </button>
              </div>

              {/* Row 2: Sub-second Detours & Return Navigation */}
              <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
                <button
                  onClick={() => handleQuery('जवळचे स्वच्छ शौचालय कुठे आहे?')}
                  style={{ whiteSpace: 'nowrap', backgroundColor: 'rgba(56, 189, 248, 0.15)', border: '1px solid #38BDF8', color: '#38BDF8', padding: '6px 10px', borderRadius: '16px', fontSize: '10px', fontWeight: 600, cursor: 'pointer' }}
                >
                  🚻 स्वच्छ शौचालय (&lt;०.५ से वळण)
                </button>
                <button
                  onClick={() => handleQuery('मोफत लंगर किंवा अन्नछत्र कुठे आहे?')}
                  style={{ whiteSpace: 'nowrap', backgroundColor: 'rgba(74, 222, 128, 0.15)', border: '1px solid #4ADE80', color: '#4ADE80', padding: '6px 10px', borderRadius: '16px', fontSize: '10px', fontWeight: 600, cursor: 'pointer' }}
                >
                  🍲 मोफत लंगर / भोजन
                </button>
                <button
                  onClick={() => handleQuery('माझ्या गाडीकडे परत जाण्याचा मार्ग दाखवा (पांजरपोळ बे ४-बी)')}
                  style={{ whiteSpace: 'nowrap', backgroundColor: 'rgba(244, 63, 94, 0.15)', border: '1px solid #FB7185', color: '#FDA4AF', padding: '6px 10px', borderRadius: '16px', fontSize: '10px', fontWeight: 700, cursor: 'pointer' }}
                >
                  🅿️ गाडीकडे वापसी मार्ग
                </button>
              </div>
            </div>

            {/* AI ITINERARY SUGGESTION CARD (With START JOURNEY BUTTON) */}
            {currentResponse && (
              <div
                style={{
                  backgroundColor: 'rgba(255,255,255,0.06)',
                  border: activeRouteId === 'R_TALKUTESHWAR' ? '2px solid #10B981' : isDiverted ? '2px solid var(--sindoor)' : '1.5px solid var(--marigold)',
                  borderRadius: '16px',
                  padding: '16px',
                  boxShadow: '0 6px 24px rgba(0,0,0,0.35)',
                  position: 'relative'
                }}
              >
                {/* Header Badge */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: 'var(--marigold)' }}>
                    <Sparkles size={16} />
                    <span>{currentResponse.title}</span>
                  </div>
                  <span
                    style={{
                      fontSize: '10px',
                      backgroundColor: activeRouteId === 'R_TALKUTESHWAR' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(47, 122, 107, 0.3)',
                      color: activeRouteId === 'R_TALKUTESHWAR' ? '#34D399' : '#34D399',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      fontWeight: 700,
                      border: '1px solid rgba(52, 211, 153, 0.3)'
                    }}
                  >
                    AI Itinerary Ready
                  </span>
                </div>

                {/* Summary Text */}
                <p style={{ fontSize: '12px', color: 'var(--parchment)', lineHeight: 1.5, margin: '0 0 12px 0' }}>
                  {currentResponse.summary}
                </p>

                {/* Metric Summary Box */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '8px', backgroundColor: 'rgba(0,0,0,0.3)', padding: '10px 12px', borderRadius: '10px', marginBottom: '14px', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--marigold)' }}>
                      {currentResponse.primary_metric}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--parchment-deep)', opacity: 0.9 }}>
                      {currentResponse.primary_metric_label}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', fontSize: '10px', color: 'rgba(255,255,255,0.85)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div>🅿️ पांजरपोळ बे ४-बी</div>
                    <div style={{ color: '#34D399' }}>🚌 शटल दर ५ मिनिटांनी</div>
                  </div>
                </div>

                {/* THE "START JOURNEY" GLOWING PRIMARY HERO CTA BUTTON */}
                <button
                  id="btn-start-journey"
                  onClick={handleStartJourney}
                  style={{
                    width: '100%',
                    background: 'linear-gradient(135deg, #E8871E 0%, #F59E0B 100%)',
                    color: '#121E33',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '14px 16px',
                    fontSize: '13px',
                    fontWeight: 800,
                    letterSpacing: '0.02em',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '3px',
                    cursor: 'pointer',
                    boxShadow: '0 6px 20px rgba(232, 135, 30, 0.45)',
                    transition: 'transform 0.15s, box-shadow 0.15s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                    <Play size={18} fill="#121E33" />
                    <span>प्रवास सुरू करा (Start Journey & Open Navigation)</span>
                    <ArrowRight size={16} />
                  </div>
                  <span style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(18, 30, 51, 0.85)' }}>
                    थेट नकाशा उघडा आणि टर्न-बाय-टर्न दिशादर्शन सुरू करा
                  </span>
                </button>
              </div>
            )}

            {/* Quick 1-Tap Utility Detour Chips */}
            <div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--parchment-deep)', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                <span>त्वरित सुविधा वळण (Sub-Second Detours)</span>
                <span style={{ color: 'var(--marigold)' }}>&lt;0.5s Latency</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                <button
                  onClick={() => handleInjectDetour('toilet')}
                  style={{ backgroundColor: 'rgba(56, 189, 248, 0.12)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '10px', padding: '10px 4px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: '#fff', cursor: 'pointer' }}
                >
                  <Bath size={18} style={{ color: '#38BDF8' }} />
                  <span style={{ fontSize: '10px', fontWeight: 600 }}>शौचालय</span>
                  <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.7)' }}>१४० मी</span>
                </button>

                <button
                  onClick={() => handleInjectDetour('medical')}
                  style={{ backgroundColor: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '10px', padding: '10px 4px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: '#fff', cursor: 'pointer' }}
                >
                  <HeartPulse size={18} style={{ color: '#EF4444' }} />
                  <span style={{ fontSize: '10px', fontWeight: 600 }}>वैद्यकीय</span>
                  <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.7)' }}>१८० मी</span>
                </button>

                <button
                  onClick={() => handleInjectDetour('food')}
                  style={{ backgroundColor: 'rgba(74, 222, 128, 0.12)', border: '1px solid rgba(74, 222, 128, 0.3)', borderRadius: '10px', padding: '10px 4px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: '#fff', cursor: 'pointer' }}
                >
                  <Utensils size={18} style={{ color: '#4ADE80' }} />
                  <span style={{ fontSize: '10px', fontWeight: 600 }}>मोफत लंगर</span>
                  <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.7)' }}>१६० मी</span>
                </button>

                <button
                  onClick={() => handleInjectDetour('water')}
                  style={{ backgroundColor: 'rgba(14, 165, 233, 0.12)', border: '1px solid rgba(14, 165, 233, 0.3)', borderRadius: '10px', padding: '10px 4px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: '#fff', cursor: 'pointer' }}
                >
                  <Droplets size={18} style={{ color: '#0EA5E9' }} />
                  <span style={{ fontSize: '10px', fontWeight: 600 }}>शीतल जल</span>
                  <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.7)' }}>९० मी</span>
                </button>
              </div>
            </div>

            {/* 4-Leg Multimodal Journey Lifecycle Overview */}
            <div style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid var(--river-teal-border)', borderRadius: '14px', padding: '14px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Navigation size={14} style={{ color: 'var(--marigold)' }} />
                <span>४-चरणीय तीर्थयात्रा (4-Leg Multimodal Lifecycle)</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {INITIAL_MULTIMODAL_LEGS.map((leg, idx) => (
                  <div
                    key={leg.id}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '8px',
                      backgroundColor: leg.is_active ? 'rgba(232, 135, 30, 0.15)' : 'rgba(0,0,0,0.2)',
                      border: leg.is_active ? '1px solid var(--marigold)' : '1px solid rgba(255,255,255,0.06)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}
                  >
                    <div style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: leg.is_completed ? '#10B981' : leg.is_active ? 'var(--marigold)' : '#4B5563', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, color: '#fff' }}>
                      {leg.is_completed ? '✓' : idx + 1}
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '11px', fontWeight: 600, color: leg.is_active ? 'var(--marigold)' : 'var(--parchment)' }}>
                        {language === 'mr' ? leg.title_mr : leg.title_hi}
                      </div>
                      <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)' }}>
                        {leg.subtitle}
                      </div>
                    </div>

                    {leg.badge && (
                      <span style={{ fontSize: '9px', backgroundColor: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px', color: 'var(--parchment-deep)' }}>
                        {leg.badge}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ============================================================ */}
        {/* BRANCH 3: ROUTE (LIVE TURN-BY-TURN NAVIGATION & SIMULATOR)   */}
        {/* ============================================================ */}
        {activeBranch === 'route' && (
          <>
            {/* Active Turn-by-Turn Navigation HUD Card */}
            <div
              style={{
                backgroundColor: isDiverted ? 'var(--sindoor)' : 'rgba(47, 122, 107, 0.95)',
                color: '#fff',
                borderRadius: '14px',
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.2)'
              }}
            >
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {isDiverted ? <AlertTriangle size={20} /> : <Navigation size={20} />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.85 }}>
                  {isNavigating ? 'थेट दिशादर्शन सक्रिय (Live Navigation Active)' : 'मार्ग निवड'}
                </div>
                <div style={{ fontSize: '12px', fontWeight: 700, lineHeight: 1.3 }}>
                  {navStepText}
                </div>
              </div>
            </div>

            {/* Walking Simulator Controls Toolbar */}
            <div style={{ backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid var(--river-teal-border)', borderRadius: '12px', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={() => setSimulation({ ...simulation, isPlaying: !simulation.isPlaying })}
                    style={{
                      backgroundColor: simulation.isPlaying ? 'var(--sindoor)' : 'var(--marigold)',
                      color: 'var(--indigo-dusk)',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '6px 12px',
                      fontSize: '11px',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    {simulation.isPlaying ? <Pause size={13} /> : <Play size={13} />}
                    <span>{simulation.isPlaying ? 'थांबवा (Pause)' : 'चालणे सुरू (Simulate Walk)'}</span>
                  </button>

                  <button
                    onClick={() => {
                      setSimulation({ ...simulation, progressPct: 0, currentStepIndex: 0, isPlaying: false, activePoiNear: undefined });
                      setHasArrivedAtGhat(false);
                      setNavStepText('गोदावरी नदीकाठ पदपथाने (R17) पुढे चला • १४० मी नंतर उजवीकडे');
                    }}
                    style={{ backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '8px', padding: '6px 8px', cursor: 'pointer' }}
                  >
                    <RotateCcw size={12} />
                  </button>
                </div>

                {/* Speed Controls: 1x, 5x, 20x */}
                <div style={{ display: 'flex', gap: '4px' }}>
                  {([1, 5, 20] as const).map((spd) => (
                    <button
                      key={spd}
                      onClick={() => setSimulation({ ...simulation, speed: spd })}
                      style={{
                        backgroundColor: simulation.speed === spd ? 'var(--river-teal)' : 'rgba(255,255,255,0.08)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '4px 8px',
                        fontSize: '10px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      {spd}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Real-Time Walking Progress Bar */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'rgba(255,255,255,0.7)', marginBottom: '3px' }}>
                  <span>मार्ग प्रगती: {simulation.progressPct}%</span>
                  <span>{hasArrivedAtGhat ? '🚩 घाटावर पोहोचले!' : `${Math.round(1350 * (1 - simulation.progressPct / 100))}m शिल्लक`}</span>
                </div>
                <div style={{ height: '6px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${simulation.progressPct}%`, height: '100%', backgroundColor: hasArrivedAtGhat ? '#10B981' : 'var(--marigold)', transition: 'width 0.2s' }} />
                </div>
              </div>
            </div>

            {/* Quick In-Journey Sub-Second Detour Injection Chips (<0.5s Latency) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10px' }}>
                <span style={{ color: 'var(--marigold)', fontWeight: 700 }}>⚡ त्वरित मध्यंतरी वळण (&lt;0.5s Zero-Lag Detours):</span>
                <span style={{ color: '#38BDF8', fontSize: '9px' }}>नकाशावर थेट मार्ग जोडणी</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                <button
                  onClick={() => handleInjectDetour('toilet')}
                  style={{ backgroundColor: 'rgba(56, 189, 248, 0.15)', border: '1px solid #38BDF8', color: '#38BDF8', borderRadius: '8px', padding: '6px 2px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', cursor: 'pointer', fontSize: '10px', fontWeight: 600 }}
                >
                  <Bath size={14} />
                  <span>शौचालय</span>
                  <span style={{ fontSize: '9px', opacity: 0.85 }}>१४० मी</span>
                </button>
                <button
                  onClick={() => handleInjectDetour('medical')}
                  style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid #EF4444', color: '#EF4444', borderRadius: '8px', padding: '6px 2px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', cursor: 'pointer', fontSize: '10px', fontWeight: 600 }}
                >
                  <HeartPulse size={14} />
                  <span>वैद्यकीय</span>
                  <span style={{ fontSize: '9px', opacity: 0.85 }}>१८० मी</span>
                </button>
                <button
                  onClick={() => handleInjectDetour('food')}
                  style={{ backgroundColor: 'rgba(74, 222, 128, 0.15)', border: '1px solid #4ADE80', color: '#4ADE80', borderRadius: '8px', padding: '6px 2px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', cursor: 'pointer', fontSize: '10px', fontWeight: 600 }}
                >
                  <Utensils size={14} />
                  <span>मोफत लंगर</span>
                  <span style={{ fontSize: '9px', opacity: 0.85 }}>१६० मी</span>
                </button>
                <button
                  onClick={() => handleInjectDetour('water')}
                  style={{ backgroundColor: 'rgba(14, 165, 233, 0.15)', border: '1px solid #0EA5E9', color: '#0EA5E9', borderRadius: '8px', padding: '6px 2px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', cursor: 'pointer', fontSize: '10px', fontWeight: 600 }}
                >
                  <Droplets size={14} />
                  <span>शीतल जल</span>
                  <span style={{ fontSize: '9px', opacity: 0.85 }}>९० मी</span>
                </button>
              </div>
            </div>

            {/* Heritage Audio Radar Alert Card (When Near Kalaram Temple) */}
            {simulation.activePoiNear && (
              <div
                style={{
                  backgroundColor: 'rgba(139, 92, 246, 0.2)',
                  border: '1.5px solid #8B5CF6',
                  borderRadius: '12px',
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  boxShadow: '0 4px 16px rgba(139, 92, 246, 0.35)',
                  animation: 'fadeIn 0.3s ease-out'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#8B5CF6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}>
                    🛕
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#DDD6FE' }}>
                      {simulation.activePoiNear.name} (५५ मी अंतर)
                    </div>
                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.85)' }}>
                      {simulation.activePoiNear.description}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (!isMuted && simulation.activePoiNear) {
                      speechService.speak(simulation.activePoiNear.audio_announcement[language], language);
                    }
                  }}
                  style={{
                    backgroundColor: '#8B5CF6',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '6px 10px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    flexShrink: 0
                  }}
                >
                  <Volume2 size={13} />
                  <span>ऐका</span>
                </button>
              </div>
            )}

            {/* Interactive Leaflet Route Map */}
            <LiveRouteMap
              routes={routes}
              activeRouteId={activeRouteId}
              isDiverted={isDiverted}
              compact={false}
              simulatedPosition={currentSimCoord}
              activePoiNear={simulation.activePoiNear ? simulation.activePoiNear.name : null}
              detourStop={activeDetour}
            />

            {/* DESTINATION ARRIVAL CELEBRATION & RETURN-TO-PARKING CTA */}
            {hasArrivedAtGhat && (
              <div
                style={{
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  border: '2px solid #10B981',
                  borderRadius: '14px',
                  padding: '14px',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  boxShadow: '0 4px 16px rgba(16, 185, 129, 0.3)'
                }}
              >
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#34D399' }}>
                  🎉 पवित्र स्नान घाटावर आगमन झाले! (Snan Destination Reached)
                </div>
                <div style={{ fontSize: '11px', color: 'var(--parchment)' }}>
                  स्नान व दर्शन संपन्न झाल्यानंतर आपली गाडी शोधण्यासाठी परतीचा मार्ग वापरा.
                </div>
                <button
                  onClick={() => setActiveBranch('return')}
                  style={{
                    backgroundColor: 'var(--marigold)',
                    color: 'var(--indigo-dusk)',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '12px',
                    fontSize: '13px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 14px rgba(232, 135, 30, 0.4)'
                  }}
                >
                  <Car size={16} />
                  <span>🅿️ माझ्या गाडीकडे परतीचा मार्ग (Way Back to My Parking Lot)</span>
                </button>
              </div>
            )}

            {/* Interactive Feature Simulation Triggers for Judges */}
            <div style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid var(--river-teal-border)', borderRadius: '12px', padding: '12px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, marginBottom: '8px', color: 'var(--marigold)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>⚡ न्यायाधीशांसाठी थेट सिम्युलेशन नियंत्रण (Feature Simulator Panel):</span>
                <span style={{ fontSize: '9px', color: 'var(--parchment-deep)' }}>1-Tap Demo</span>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button
                  onClick={handleSimulatePoliceClosure}
                  style={{ backgroundColor: 'var(--sindoor)', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 10px', fontSize: '10px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 2px 8px rgba(193, 64, 31, 0.4)' }}
                >
                  <ShieldAlert size={14} />
                  <span>🚨 पोलीस रस्ता बंद (R17 ➔ R21)</span>
                </button>

                <button
                  onClick={handleTriggerHeritageRadar}
                  style={{ backgroundColor: '#8B5CF6', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 10px', fontSize: '10px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 2px 8px rgba(139, 92, 246, 0.4)' }}
                >
                  <Sparkles size={14} />
                  <span>📍 काळाराम रडार (55m Proximity)</span>
                </button>

                <button
                  onClick={() => handleApplyRule1a(true)}
                  style={{ backgroundColor: 'rgba(16, 185, 129, 0.25)', border: '1px solid #10B981', color: '#34D399', borderRadius: '8px', padding: '8px 10px', fontSize: '10px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Users size={14} />
                  <span>👵 नियम 1a: तालकुटेश्वर रॅम्प</span>
                </button>

                <button
                  onClick={handleJumpToArrival}
                  style={{ backgroundColor: '#10B981', color: '#064E3B', border: 'none', borderRadius: '8px', padding: '8px 10px', fontSize: '10px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <CheckCircle2 size={14} />
                  <span>🏁 थेट घाटावर पोहोचवा</span>
                </button>
              </div>
            </div>
          </>
        )}

        {/* ============================================================ */}
        {/* BRANCH 2: PLAN (Travel Planner, Group Intake, Rule 1a Engine) */}
        {/* ============================================================ */}
        {activeBranch === 'plan' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--river-teal-border)', paddingBottom: '8px' }}>
              <Calendar size={18} style={{ color: 'var(--marigold)' }} />
              <div>
                <h2 style={{ fontSize: '14px', fontWeight: 700, margin: 0 }}>
                  तीर्थयात्रा नियोजन (Travel Planner & Rule 1a)
                </h2>
                <div style={{ fontSize: '10px', color: 'var(--parchment-deep)' }}>
                  गट रचना, महामार्ग व वृद्ध रक्षण प्रणाली
                </div>
              </div>
            </div>

            {/* Group Intake Form */}
            <div style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid var(--river-teal-border)', borderRadius: '14px', padding: '14px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, marginBottom: '10px', color: 'var(--marigold)' }}>
                १. कुटुंब व गट माहिती (Group Intake)
              </div>

              {/* Highway Selector */}
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '11px', marginBottom: '4px', color: 'var(--parchment-deep)' }}>
                  आगमन महामार्ग (Incoming Highway Corridor):
                </label>
                <select
                  value={groupProfile.incomingHighway}
                  onChange={(e) => setGroupProfile({ ...groupProfile, incomingHighway: e.target.value as any })}
                  style={{ width: '100%', padding: '8px', borderRadius: '8px', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid var(--river-teal-border)', color: '#fff', fontSize: '11px' }}
                >
                  <option value="DHULE_NH3">धुळे महामार्ग NH3 ➔ पांजरपोळ बाह्य वाहनतळ (₹२०)</option>
                  <option value="MUMBAI_NH3">मुंबई महामार्ग NH3 ➔ वालदेवी बाह्य वाहनतळ (₹२०)</option>
                  <option value="PUNE_NH50">पुणे महामार्ग NH50 ➔ सिन्नर बाह्य वाहनतळ (₹२०)</option>
                </select>
              </div>

              {/* Party Counter */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', backgroundColor: 'rgba(0,0,0,0.2)', padding: '8px 12px', borderRadius: '8px' }}>
                <span style={{ fontSize: '11px' }}>एकूण सदस्य (Party Size):</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <button
                    onClick={() => setGroupProfile({ ...groupProfile, partySize: Math.max(1, groupProfile.partySize - 1) })}
                    style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', cursor: 'pointer' }}
                  >
                    -
                  </button>
                  <span style={{ fontSize: '13px', fontWeight: 700 }}>{groupProfile.partySize}</span>
                  <button
                    onClick={() => setGroupProfile({ ...groupProfile, partySize: groupProfile.partySize + 1 })}
                    style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', cursor: 'pointer' }}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Toggles for Seniors & Children */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={groupProfile.hasSeniors}
                    onChange={(e) => setGroupProfile({ ...groupProfile, hasSeniors: e.target.checked })}
                    style={{ accentColor: 'var(--marigold)' }}
                  />
                  <span>सोबत ज्येष्ठ नागरिक (६०+) आहेत (Traveling with Seniors)</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={groupProfile.hasChildren}
                    onChange={(e) => setGroupProfile({ ...groupProfile, hasChildren: e.target.checked })}
                    style={{ accentColor: 'var(--marigold)' }}
                  />
                  <span>सोबत लहान मुले आहेत (Traveling with Young Children)</span>
                </label>
              </div>
            </div>

            {/* RULE 1A ELDERLY & FAMILY PROTECTION ENGINE CARD */}
            {(groupProfile.hasSeniors || groupProfile.hasChildren) && (
              <div
                style={{
                  backgroundColor: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid #10B981',
                  borderRadius: '14px',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#34D399', fontWeight: 700, fontSize: '12px' }}>
                  <ShieldAlert size={18} />
                  <span>नियम 1a सक्रिय: ज्येष्ठ व कुटुंब सुरक्षा शिफारस</span>
                </div>

                <div style={{ fontSize: '11px', lineHeight: 1.5, color: 'var(--parchment)' }}>
                  सकाळी ५:०० नंतर रामकुंडावर ४५ मिनिटांची गर्दी वाढणार आहे. आपल्यासोबत ज्येष्ठ नागरिक असल्याने <strong>तालकुटेश्वर घाट</strong> सर्वात सुरक्षित ठरेल (सौम्य रॅम्प, स्वयंसेवक सहाय्य, फक्त १२ मिनिटे चालणे).
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleApplyRule1a(true)}
                    style={{
                      flex: 1,
                      backgroundColor: '#10B981',
                      color: '#064E3B',
                      border: 'none',
                      padding: '8px',
                      borderRadius: '8px',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    सुरक्षित पर्याय निवडा (तालकुटेश्वर)
                  </button>

                  <button
                    onClick={() => handleApplyRule1a(false)}
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.08)',
                      color: 'var(--parchment)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      fontSize: '11px',
                      cursor: 'pointer'
                    }}
                  >
                    रामकुंडावरच जा
                  </button>
                </div>
              </div>
            )}

            {/* 24-Hour Ghat Crowd Projection Forecast */}
            <div style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid var(--river-teal-border)', borderRadius: '14px', padding: '14px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, marginBottom: '8px', color: 'var(--marigold)' }}>
                २. २४ तास गर्दी अंदाज (Ghat Crowd Forecast)
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {HOURLY_CROWD_FORECAST.map((fc, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10px' }}>
                    <span style={{ width: '55px', color: 'rgba(255,255,255,0.7)' }}>{fc.hour}</span>
                    <div style={{ flex: 1, height: '8px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${fc.crowd_pct}%`, height: '100%', backgroundColor: fc.level === 'surge' ? '#EF4444' : fc.level === 'high' ? '#F59E0B' : '#10B981' }} />
                    </div>
                    <span style={{ width: '130px', textAlign: 'right', color: fc.level === 'surge' ? '#FF8080' : 'var(--parchment-deep)' }}>
                      {fc.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ============================================================ */}
        {/* BRANCH 4: RETURN TO CAR ("Way Back to My Parking Lot")       */}
        {/* ============================================================ */}
        {activeBranch === 'return' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--river-teal-border)', paddingBottom: '8px' }}>
              <Car size={18} style={{ color: 'var(--marigold)' }} />
              <div>
                <h2 style={{ fontSize: '14px', fontWeight: 700, margin: 0 }}>
                  वापसी मार्ग: माझ्या गाडीकडे (Return to Car)
                </h2>
                <div style={{ fontSize: '10px', color: 'var(--parchment-deep)' }}>
                  ५०,००० गाड्यांच्या बाह्य वाहनतळावरून आपली गाडी शोधण्याची सुविधा
                </div>
              </div>
            </div>

            {/* Saved Parking Staging Card */}
            <div style={{ backgroundColor: 'rgba(232, 135, 30, 0.12)', border: '1px solid var(--marigold)', borderRadius: '14px', padding: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--marigold)' }}>
                  🅿️ नोंदवलेले वाहनतळ स्थान
                </span>
                <span style={{ fontSize: '10px', backgroundColor: 'rgba(0,0,0,0.3)', padding: '2px 8px', borderRadius: '4px' }}>
                  पावती: #NK-2026-4402
                </span>
              </div>

              <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '4px' }}>
                पांजरपोळ बाह्य वाहनतळ (धुळे महामार्ग NH3)
              </div>
              <div style={{ fontSize: '11px', color: 'var(--parchment-deep)', marginBottom: '10px' }}>
                सेक्टर: <strong>बे क्रमांक ४-बी (Bay 4-B)</strong> • निळ्या पाण्याच्या टाकीजवळ
              </div>

              <button
                onClick={() => {
                  handleQuery('मेरी कार तक वापसी मार्ग');
                  setActiveBranch('route');
                }}
                style={{
                  width: '100%',
                  backgroundColor: 'var(--marigold)',
                  color: 'var(--indigo-dusk)',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px',
                  fontSize: '12px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: 'pointer'
                }}
              >
                <Navigation size={14} />
                <span>गाडीकडे परत नेणारा उलटा मार्ग सुरू करा (Invert Route)</span>
              </button>
            </div>

            {/* Step-by-Step Return Sequence */}
            <div style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid var(--river-teal-border)', borderRadius: '14px', padding: '14px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, marginBottom: '10px' }}>
                परतीच्या प्रवासाची पावले:
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '11px' }}>
                  <span style={{ backgroundColor: 'var(--river-teal)', color: '#fff', width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>
                    १
                  </span>
                  <div>
                    <div style={{ fontWeight: 600 }}>रामकुंडावरून पंचवटी शटल टर्मिनलवर या</div>
                    <div style={{ color: 'rgba(255,255,255,0.6)' }}>५०० मीटर पायी चालणे (६ मिनिटे)</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '11px' }}>
                  <span style={{ backgroundColor: 'var(--river-teal)', color: '#fff', width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>
                    २
                  </span>
                  <div>
                    <div style={{ fontWeight: 600 }}>इलेक्ट्रिक फीडर शटल बस क्रमांक १२ मध्ये चढा</div>
                    <div style={{ color: 'rgba(255,255,255,0.6)' }}>तिकीट दर: ₹१५ • दर ५ मिनिटांनी थेट बस</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '11px' }}>
                  <span style={{ backgroundColor: 'var(--river-teal)', color: '#fff', width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>
                    ३
                  </span>
                  <div>
                    <div style={{ fontWeight: 600 }}>पांजरपोळ बाह्य वाहनतळ बे ४-बी येथे गाडी मिळवा</div>
                    <div style={{ color: 'rgba(255,255,255,0.6)' }}>वाहन सुरक्षितपणे बाहेर काढा</div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ============================================================ */}
        {/* BRANCH 5: HELP & EMERGENCY HUB (/help)                       */}
        {/* ============================================================ */}
        {activeBranch === 'help' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--river-teal-border)', paddingBottom: '8px' }}>
              <LifeBuoy size={18} style={{ color: 'var(--sindoor)' }} />
              <div>
                <h2 style={{ fontSize: '14px', fontWeight: 700, margin: 0 }}>
                  आपत्कालीन व सुरक्षा केंद्र (Emergency SOS Hub)
                </h2>
                <div style={{ fontSize: '10px', color: 'var(--parchment-deep)' }}>
                  पोलीस मदत, हरवले-सापडले व वैद्यकीय triage कक्ष
                </div>
              </div>
            </div>

            {/* ONE-TAP EMERGENCY SOS BUTTON */}
            <div style={{ backgroundColor: 'rgba(193, 64, 31, 0.15)', border: '2px solid var(--sindoor)', borderRadius: '14px', padding: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#FF8080', marginBottom: '6px' }}>
                तत्काळ पोलीस व वैद्यकीय मदत
              </div>
              <div style={{ fontSize: '11px', color: 'var(--parchment-deep)', marginBottom: '12px' }}>
                आपले थेट GPS स्थान पोलीस नियंत्रण कक्षाला (PRAVAH) पाठवले जाईल.
              </div>
              <button
                onClick={() => alert('🚨 EMERGENCY SOS DISPATCHED: Police Patrol & Medical Camp notified with GPS [20.0075, 73.8010]')}
                style={{
                  backgroundColor: 'var(--sindoor)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '12px 24px',
                  fontSize: '14px',
                  fontWeight: 800,
                  letterSpacing: '0.05em',
                  cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(193, 64, 31, 0.5)'
                }}
              >
                🚨 तत्काळ SOS कॉल करा (Emergency SOS)
              </button>
            </div>

            {/* Direct Dialing Emergency Contacts */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid var(--river-teal-border)', borderRadius: '10px', padding: '10px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--marigold)' }}>पोलीस नियंत्रण कक्ष</div>
                <div style={{ fontSize: '14px', fontWeight: 700, margin: '2px 0' }}>११२ / १००</div>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)' }}>२४ तास सक्रिय</div>
              </div>

              <div style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid var(--river-teal-border)', borderRadius: '10px', padding: '10px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#38BDF8' }}>रुग्णवाहिका / Triage</div>
                <div style={{ fontSize: '14px', fontWeight: 700, margin: '2px 0' }}>१०८</div>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)' }}>गोदावरी मेडिकल कॅम्प</div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* 5-Branch Bottom Navigation Shell */}
      <nav
        style={{
          height: '60px',
          backgroundColor: 'rgba(18, 30, 51, 0.98)',
          borderTop: '1px solid var(--river-teal-border)',
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          alignItems: 'center',
          padding: '0 4px',
          zIndex: 100
        }}
      >
        <button
          onClick={() => setActiveBranch('home')}
          style={{
            background: 'none',
            border: 'none',
            color: activeBranch === 'home' ? 'var(--marigold)' : 'rgba(255,255,255,0.6)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2px',
            cursor: 'pointer',
            fontSize: '10px',
            fontWeight: activeBranch === 'home' ? 700 : 500
          }}
        >
          <Home size={18} />
          <span>मुख्य (Home)</span>
        </button>

        <button
          onClick={() => setActiveBranch('plan')}
          style={{
            background: 'none',
            border: 'none',
            color: activeBranch === 'plan' ? 'var(--marigold)' : 'rgba(255,255,255,0.6)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2px',
            cursor: 'pointer',
            fontSize: '10px',
            fontWeight: activeBranch === 'plan' ? 700 : 500
          }}
        >
          <Calendar size={18} />
          <span>नियोजन (Plan)</span>
        </button>

        <button
          onClick={() => setActiveBranch('route')}
          style={{
            background: 'none',
            border: 'none',
            color: activeBranch === 'route' ? 'var(--marigold)' : 'rgba(255,255,255,0.6)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2px',
            cursor: 'pointer',
            fontSize: '10px',
            fontWeight: activeBranch === 'route' ? 700 : 500
          }}
        >
          <MapPin size={18} />
          <span>मार्ग (Route)</span>
        </button>

        <button
          onClick={() => setActiveBranch('return')}
          style={{
            background: 'none',
            border: 'none',
            color: activeBranch === 'return' ? 'var(--marigold)' : 'rgba(255,255,255,0.6)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2px',
            cursor: 'pointer',
            fontSize: '10px',
            fontWeight: activeBranch === 'return' ? 700 : 500
          }}
        >
          <Car size={18} />
          <span>गाडीकडे (Car)</span>
        </button>

        <button
          onClick={() => setActiveBranch('help')}
          style={{
            background: 'none',
            border: 'none',
            color: activeBranch === 'help' ? 'var(--sindoor)' : 'rgba(255,255,255,0.6)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2px',
            cursor: 'pointer',
            fontSize: '10px',
            fontWeight: activeBranch === 'help' ? 700 : 500
          }}
        >
          <LifeBuoy size={18} />
          <span>मदत (Help)</span>
        </button>
      </nav>
    </div>
  );
};
