import React, { useState, useEffect, useRef } from 'react';
import { AgentResponse, RouteStatus } from '../types';
import { agentEngine } from '../services/agentEngine';
import { realtimeHub } from '../services/realtimeHub';
import { speechService } from '../services/speechService';
import {
  Mic,
  Volume2,
  Navigation,
  Utensils,
  Car,
  RotateCcw,
  ShieldAlert
} from 'lucide-react';

import { LiveRouteMap } from './LiveRouteMap';

type KioskState = 'idle' | 'listening' | 'thinking' | 'result' | 'alert_interrupt';

export const KiskoKiosk: React.FC = () => {
  const [kioskState, setKioskState] = useState<KioskState>('idle');
  const [currentResponse, setCurrentResponse] = useState<AgentResponse | null>(null);
  const [activeAlert, setActiveAlert] = useState<{ message: string; tier: number; routeName: string } | null>(null);
  const [countdown, setCountdown] = useState<number>(30);
  const [routes, setRoutes] = useState<RouteStatus[]>([]);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    setRoutes(realtimeHub.getRoutes());

    // Subscribe to realtime updates: On a tier <= 2 change, INTERRUPT ANY STATE and speak alert per PRD
    const unsubscribe = realtimeHub.subscribe((event) => {
      const updatedRoutes = realtimeHub.getRoutes();
      setRoutes(updatedRoutes);

      if (event.route.tier <= 2 || event.route.is_closed) {
        setActiveAlert({
          message: event.route.message_mr,
          tier: event.route.tier,
          routeName: event.route.name_mr
        });
        setKioskState('alert_interrupt');

        // Immediately speak alert announcement aloud for passersby
        const announcement = `सावधान! पोलीस नियंत्रण कक्षाने ${event.route.name_mr} तात्पुरता बंद केला आहे. कृपया पर्यायी पंचवटी वळण मार्ग वापरा.`;
        speechService.speak(announcement, 'mr', () => {
          setTimeout(() => {
            const detour = updatedRoutes.find((r) => r.route_id === 'R21') || updatedRoutes[1];
            const detourResp = agentEngine.generateDetourResponse('mr', event.route, detour);
            setCurrentResponse(detourResp);
            setKioskState('result');
          }, 2500);
        });
      }
    });

    return () => {
      unsubscribe();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // 30s Auto-reset timer back to idle state
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    if (kioskState === 'result' || kioskState === 'alert_interrupt') {
      setCountdown(30);
      timerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            handleResetToIdle();
            return 30;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [kioskState]);

  const handleResetToIdle = () => {
    speechService.stopSpeaking();
    setKioskState('idle');
    setCurrentResponse(null);
    setActiveAlert(null);
  };

  const handleTargetClick = (type: 'route' | 'parking' | 'food' | 'toilet') => {
    setKioskState('thinking');

    setTimeout(() => {
      let query = '';
      if (type === 'route') query = '४ बजे स्नान और दर्शन के लिए सबसे सुगम रास्ता';
      else if (type === 'parking') query = 'पार्किंग कुठे उपलब्ध आहे';
      else if (type === 'food') query = 'जवळ चांगले आणि स्वस्त जेवण किंवा लंगर कुठे आहे';
      else if (type === 'toilet') query = 'मला सर्वात जवळचे शौचालय हवे आहे';

      const resp = agentEngine.processQuery(query, 'mr');
      setCurrentResponse(resp);
      setKioskState('result');

      // Speaks aloud ALWAYS on kiosk per PRD
      speechService.speak(resp.speak_text, 'mr');
    }, 400);
  };

  const handleVoiceTrigger = () => {
    setKioskState('listening');

    const started = speechService.startListening(
      'mr',
      (text, isFinal) => {
        if (isFinal && text.trim().length > 0) {
          setKioskState('thinking');
          const resp = agentEngine.processQuery(text, 'mr');
          setCurrentResponse(resp);
          setKioskState('result');
          speechService.speak(resp.speak_text, 'mr');
        }
      },
      () => {}
    );

    if (!started) {
      setTimeout(() => {
        setKioskState('thinking');
        setTimeout(() => {
          const resp = agentEngine.processQuery('मला सर्वात जवळचे शौचालय हवे आहे', 'mr');
          setCurrentResponse(resp);
          setKioskState('result');
          speechService.speak(resp.speak_text, 'mr');
        }, 600);
      }, 1800);
    }
  };

  return (
    <div
      style={{
        maxWidth: '920px',
        margin: '0 auto',
        minHeight: '720px',
        backgroundColor: 'var(--indigo-dusk)',
        borderRadius: 'var(--radius-card)',
        border: '1px solid var(--river-teal-border)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        color: 'var(--parchment)'
      }}
    >
      {/* Kiosk Header: Pre-dawn Indigo Dusk */}
      <div
        style={{
          padding: '1.5rem 2rem',
          borderBottom: '1px solid var(--river-teal-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <div>
          <div style={{ fontSize: '1.5rem', fontWeight: 500, color: 'var(--parchment)', margin: 0 }}>
            किस्को जनसंवाद • Kisko Kiosk
          </div>
          <div style={{ fontSize: '0.95rem', color: 'var(--parchment-deep)', opacity: 0.85, marginTop: '2px' }}>
            सार्वजनिक ध्वनी किओस्क, नाशिक कुंभमेळा २०२६
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              border: '1px solid var(--river-teal-border)',
              fontSize: '0.9rem',
              color: 'var(--parchment)'
            }}
          >
            किओस्क क्रमांक ०७
          </div>

          {(kioskState === 'result' || kioskState === 'alert_interrupt') && (
            <button
              onClick={handleResetToIdle}
              style={{
                backgroundColor: 'transparent',
                border: '1px solid var(--river-teal-border)',
                color: 'var(--parchment)',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '0.9rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <RotateCcw size={16} /> मुख्य स्क्रीन ({countdown}s)
            </button>
          )}
        </div>
      </div>

      {/* ALERT INTERRUPT STATE (Sindoor Color - Reserved Only for Advisories & Warnings) */}
      {kioskState === 'alert_interrupt' && activeAlert && (
        <div
          style={{
            flex: 1,
            backgroundColor: 'var(--sindoor)',
            color: '#FFFFFF',
            padding: '3rem 2rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            gap: '1.5rem'
          }}
        >
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              backgroundColor: '#FFFFFF',
              color: 'var(--sindoor)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <ShieldAlert size={48} />
          </div>

          <div>
            <div style={{ fontSize: '1.2rem', fontWeight: 500, letterSpacing: '0.02em', marginBottom: '8px' }}>
              पोलीस अत्यावश्यक सूचना
            </div>
            <h2 style={{ fontSize: '2.4rem', fontWeight: 500, lineHeight: 1.2, margin: 0 }}>
              {activeAlert.routeName} तात्पुरता बंद
            </h2>
          </div>

          <div
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.25)',
              padding: '1.25rem 2rem',
              borderRadius: 'var(--radius-card)',
              fontSize: '1.3rem',
              maxWidth: '680px',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}
          >
            {activeAlert.message}
          </div>

          <div style={{ fontSize: '1.15rem', fontWeight: 500, color: 'var(--parchment)' }}>
            पर्यायी मार्ग: कपिला संगम बायपास मार्ग वापरा
          </div>
        </div>
      )}

      {/* IDLE STATE: 4 Massive Flat Touch Targets Scaled Up 2-3x for Arm's Length Legibility */}
      {kioskState === 'idle' && (
        <div style={{ flex: 1, padding: '2.5rem 2rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '2.1rem', fontWeight: 500, color: 'var(--parchment)', margin: '0 0 6px 0' }}>
              कुठली माहिती हवी आहे? स्पर्श करा किंवा बोला
            </h2>
            <p style={{ fontSize: '1.15rem', color: 'var(--parchment-deep)', margin: 0, opacity: 0.9 }}>
              Touch any section below or speak directly to the kiosk
            </p>
          </div>

          {/* 4 Large Touch Targets (Flat Parchment Surface on Dusk Sky) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
            {/* 1. Route & Crowd */}
            <button
              onClick={() => handleTargetClick('route')}
              style={{
                backgroundColor: 'var(--parchment)',
                color: 'var(--ink)',
                border: '1px solid var(--river-teal-border)',
                borderRadius: 'var(--radius-card)',
                padding: '28px 24px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
                textAlign: 'left'
              }}
            >
              <div
                style={{
                  width: 68,
                  height: 68,
                  borderRadius: '12px',
                  backgroundColor: 'var(--river-teal-subtle)',
                  color: 'var(--river-teal)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Navigation size={38} />
              </div>
              <div>
                <div style={{ fontSize: '1.6rem', fontWeight: 500, color: 'var(--ink)' }}>
                  मार्ग आणि गर्दी
                </div>
                <div style={{ fontSize: '1.05rem', color: 'var(--ink-muted)', marginTop: '2px' }}>
                  स्नान व दर्शन मार्ग स्थिती
                </div>
              </div>
            </button>

            {/* 2. Parking */}
            <button
              onClick={() => handleTargetClick('parking')}
              style={{
                backgroundColor: 'var(--parchment)',
                color: 'var(--ink)',
                border: '1px solid var(--river-teal-border)',
                borderRadius: 'var(--radius-card)',
                padding: '28px 24px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
                textAlign: 'left'
              }}
            >
              <div
                style={{
                  width: 68,
                  height: 68,
                  borderRadius: '12px',
                  backgroundColor: 'var(--river-teal-subtle)',
                  color: 'var(--river-teal)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Car size={38} />
              </div>
              <div>
                <div style={{ fontSize: '1.6rem', fontWeight: 500, color: 'var(--ink)' }}>
                  वाहन तळ (पार्किंग)
                </div>
                <div style={{ fontSize: '1.05rem', color: 'var(--ink-muted)', marginTop: '2px' }}>
                  उपलब्ध जागा व अंतर
                </div>
              </div>
            </button>

            {/* 3. Food & Langar */}
            <button
              onClick={() => handleTargetClick('food')}
              style={{
                backgroundColor: 'var(--parchment)',
                color: 'var(--ink)',
                border: '1px solid var(--river-teal-border)',
                borderRadius: 'var(--radius-card)',
                padding: '28px 24px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
                textAlign: 'left'
              }}
            >
              <div
                style={{
                  width: 68,
                  height: 68,
                  borderRadius: '12px',
                  backgroundColor: 'var(--river-teal-subtle)',
                  color: 'var(--river-teal)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Utensils size={38} />
              </div>
              <div>
                <div style={{ fontSize: '1.6rem', fontWeight: 500, color: 'var(--ink)' }}>
                  अन्न व लंगर
                </div>
                <div style={{ fontSize: '1.05rem', color: 'var(--ink-muted)', marginTop: '2px' }}>
                  मोफत भोजन व अधिकृत दर
                </div>
              </div>
            </button>

            {/* 4. Sanitation / Toilets */}
            <button
              onClick={() => handleTargetClick('toilet')}
              style={{
                backgroundColor: 'var(--parchment)',
                color: 'var(--ink)',
                border: '1px solid var(--river-teal-border)',
                borderRadius: 'var(--radius-card)',
                padding: '28px 24px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
                textAlign: 'left'
              }}
            >
              <div
                style={{
                  width: 68,
                  height: 68,
                  borderRadius: '12px',
                  backgroundColor: 'var(--river-teal-subtle)',
                  color: 'var(--river-teal)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2rem'
                }}
              >
                🚻
              </div>
              <div>
                <div style={{ fontSize: '1.6rem', fontWeight: 500, color: 'var(--ink)' }}>
                  स्वच्छतागृह (शौचालय)
                </div>
                <div style={{ fontSize: '1.05rem', color: 'var(--ink-muted)', marginTop: '2px' }}>
                  कमी रांग व स्वच्छ परिसर
                </div>
              </div>
            </button>
          </div>

          {/* Large Voice Action Strip */}
          <div
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.25)',
              border: '1px solid var(--river-teal-border)',
              borderRadius: 'var(--radius-card)',
              padding: '1.5rem 2rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <button
                onClick={handleVoiceTrigger}
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  backgroundColor: 'var(--marigold)',
                  border: 'none',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
                aria-label="Speak query"
              >
                <Mic size={40} />
              </button>
              <div>
                <div style={{ fontSize: '1.4rem', fontWeight: 500, color: 'var(--parchment)' }}>
                  माइक दाबून बोला
                </div>
                <div style={{ fontSize: '1.05rem', color: 'var(--parchment-deep)' }}>
                  उदा. "जवळचे शौचालय कुठे आहे?"
                </div>
              </div>
            </div>

            <div style={{ fontSize: '1rem', color: 'var(--parchment-deep)', opacity: 0.9 }}>
              उत्तर मोठ्या आवाजात ऐकू येईल
            </div>
          </div>
        </div>
      )}

      {/* LISTENING & THINKING STATE */}
      {(kioskState === 'listening' || kioskState === 'thinking') && (
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '2rem',
            textAlign: 'center',
            padding: '3rem'
          }}
        >
          <div
            style={{
              width: 100,
              height: 100,
              borderRadius: '50%',
              backgroundColor: 'var(--marigold)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Mic size={52} />
          </div>

          <h2 style={{ fontSize: '2.2rem', fontWeight: 500, color: 'var(--parchment)', margin: 0 }}>
            {kioskState === 'listening' ? 'ऐकत आहे, कृपया बोला...' : 'माहिती शोधत आहे...'}
          </h2>
        </div>
      )}

      {/* RESULT STATE: Scaled Up for Reading from Arm's Length in Outdoor Daylight */}
      {kioskState === 'result' && currentResponse && (
        <div
          style={{
            flex: 1,
            padding: '2.5rem 2rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--parchment)',
              color: 'var(--ink)',
              borderRadius: 'var(--radius-card)',
              border: '1px solid var(--river-teal-border)',
              padding: '2.5rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <span
                style={{
                  backgroundColor: currentResponse.type === 'reroute' ? 'var(--sindoor-subtle)' : 'var(--river-teal-subtle)',
                  color: currentResponse.type === 'reroute' ? 'var(--sindoor)' : 'var(--river-teal)',
                  padding: '6px 14px',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  fontWeight: 500
                }}
              >
                {currentResponse.type === 'reroute' ? 'पोलीस डायव्हर्जन' : 'अधिकृत माहिती'}
              </span>

              <button
                onClick={() => speechService.speak(currentResponse.speak_text, 'mr')}
                className="btn-quiet"
                style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px' }}
              >
                <Volume2 size={20} /> पुन्हा ऐका
              </button>
            </div>

            <h2 style={{ fontSize: '2.2rem', fontWeight: 500, color: 'var(--ink)', lineHeight: 1.25, margin: '0 0 1rem 0' }}>
              {currentResponse.title}
            </h2>

            <p style={{ fontSize: '1.35rem', color: 'var(--ink)', lineHeight: 1.5, margin: '0 0 1.75rem 0' }}>
              {currentResponse.summary}
            </p>

            {/* Key Metric Indicator Box */}
            <div
              style={{
                backgroundColor: 'var(--parchment-deep)',
                borderRadius: '8px',
                padding: '1.25rem 1.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                border: '1px solid rgba(47, 122, 107, 0.15)'
              }}
            >
              <div>
                <div style={{ fontSize: '1rem', color: 'var(--ink-muted)' }}>
                  महत्त्वाचे:
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: 500, color: 'var(--river-teal)' }}>
                  {currentResponse.primary_metric}
                </div>
              </div>
              <div style={{ fontSize: '1.15rem', color: 'var(--ink)', fontWeight: 500 }}>
                {currentResponse.primary_metric_label}
              </div>
            </div>
          </div>

          {/* KISKO Direct Live Map Display (2x scaled elements for 55" kiosk screen) */}
          {(currentResponse.type === 'journey' || currentResponse.type === 'reroute') && (
            <div style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }}>
              <LiveRouteMap
                routes={routes}
                activeRouteId={currentResponse.route_data?.primary_route.route_id}
                isDiverted={currentResponse.type === 'reroute'}
                compact={false}
                isKiosk={true}
              />
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2rem' }}>
            <button
              onClick={handleResetToIdle}
              className="btn-marigold"
              style={{ fontSize: '1.15rem', padding: '14px 28px' }}
            >
              <RotateCcw size={20} /> मुख्य स्क्रीनवर परत जा
            </button>

            <span style={{ fontSize: '1rem', color: 'var(--parchment-deep)', opacity: 0.85 }}>
              ३० सेकंदांनंतर आपोआप रीसेट होईल
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
