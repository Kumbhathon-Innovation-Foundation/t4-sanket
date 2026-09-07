import React, { useState, useEffect, useRef } from 'react';
import {
  RouteStatus,
  AgentResponse,
  TierBadge,
  subscribeToRouteUpdates
} from '@kumbh-saathi/shared';
import '@kumbh-saathi/shared/tokens.css';
import {
  Tv,
  Mic,
  MicOff,
  Volume2,
  AlertTriangle,
  Compass,
  ArrowRight,
  Clock,
  Car,
  Bath,
  Utensils,
  MapPin,
  CheckCircle2
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export const App: React.FC = () => {
  const [routes, setRoutes] = useState<RouteStatus[]>([]);
  const [activeResponse, setActiveResponse] = useState<AgentResponse | null>(null);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [alertActive, setAlertActive] = useState<boolean>(false);
  const [alertMessage, setAlertMessage] = useState<string>('');
  const [kioskTime, setKioskTime] = useState<string>(new Date().toLocaleTimeString());

  const audioCtxRef = useRef<AudioContext | null>(null);

  const playSiren = () => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';

      const now = ctx.currentTime;
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.4);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.45);
    } catch {
      // Audio policy safe
    }
  };

  const fetchRoutes = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/routes`);
      if (res.ok) {
        const data = await res.json();
        if (data.routes) setRoutes(data.routes);
      }
    } catch (e) {
      console.warn('Failed to fetch routes for kiosk:', e);
    }
  };

  const askAgent = async (queryText: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/agent/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: queryText, language: 'mr' })
      });
      if (res.ok) {
        const data: AgentResponse = await res.json();
        setActiveResponse(data);
      }
    } catch (e) {
      console.error('Kiosk query failed:', e);
    }
  };

  useEffect(() => {
    fetchRoutes();
    askAgent('पहाटे ४ वाजता रामकुंड स्नान मार्ग');

    const clockInterval = setInterval(() => {
      setKioskTime(new Date().toLocaleTimeString());
    }, 1000);

    // Subscribe to Supabase Realtime
    const unsubscribe = subscribeToRouteUpdates(
      (updatedRoute) => {
        setRoutes((prev) => {
          const idx = prev.findIndex((r) => r.route_id === updatedRoute.route_id);
          if (idx !== -1) {
            const next = [...prev];
            next[idx] = updatedRoute;
            return next;
          }
          return [...prev, updatedRoute];
        });

        if (updatedRoute.tier <= 2) {
          playSiren();
          setAlertActive(true);
          setAlertMessage(updatedRoute.message_mr || updatedRoute.message_en || 'पोलीस आणीबाणी आदेश');
          askAgent('पोलीस वळण मार्ग दाखवा');
        } else {
          setAlertActive(false);
          setAlertMessage('');
        }
      },
      () => {
        fetchRoutes();
        setAlertActive(false);
        setAlertMessage('');
        askAgent('पहाटे ४ वाजता रामकुंड स्नान मार्ग');
      }
    );

    return () => {
      clearInterval(clockInterval);
      unsubscribe();
    };
  }, []);

  const handleVoicePush = () => {
    if (isListening) {
      setIsListening(false);
    } else {
      setIsListening(true);
      setTimeout(() => {
        setIsListening(false);
        askAgent('जवळचे स्वच्छ शौचालय कुठे आहे?');
      }, 2000);
    }
  };

  const r17 = routes.find((r) => r.route_id === 'R17');
  const isR17Closed = r17 ? r17.tier <= 2 : alertActive;

  return (
    <div style={{ width: '100vw', height: '100vh', backgroundColor: '#1B2A4A', color: '#F6F1E4', display: 'flex', flexDirection: 'column', fontFamily: 'var(--font-family)', overflow: 'hidden', padding: '24px' }}>
      {/* Kiosk Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid rgba(47, 122, 107, 0.3)', paddingBottom: '16px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ backgroundColor: 'var(--marigold)', color: '#1B2A4A', padding: '12px', borderRadius: '12px' }}>
            <Tv size={28} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0, letterSpacing: '0.02em' }}>
                कुंभ साथी — सार्वजनिक ध्वनी व माहिती किओस्क
              </h1>
              <span style={{ backgroundColor: '#2F7A6B', color: '#fff', fontSize: '12px', padding: '3px 10px', borderRadius: '9999px', fontWeight: 700 }}>
                स्थानक १ (मोठे मैदान)
              </span>
            </div>
            <div style={{ fontSize: '13px', color: '#ECE5D5', marginTop: '2px' }}>
              नाशिक कुंभमेळा २०२६ • अधिकृत पोलीस व प्रशासकीय मार्गदर्शन प्रणाली
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--marigold)', fontFamily: 'monospace' }}>
            {kioskTime}
          </div>
          <div style={{ fontSize: '12px', color: '#34D399', fontWeight: 600 }}>
            ● थेट जोडणी कार्यरत
          </div>
        </div>
      </header>

      {/* Emergency Full-Width Banner if R17 Closed */}
      {isR17Closed && (
        <div style={{
          backgroundColor: '#C1401F',
          color: '#fff',
          padding: '16px 20px',
          borderRadius: '16px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          boxShadow: '0 6px 24px rgba(193, 64, 31, 0.4)',
          border: '2px solid #FF8080'
        }}>
          <AlertTriangle size={36} style={{ flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '18px', fontWeight: 800 }}>
              सावधान: पोलीस आणीबाणी आदेश — थेट नदीकाठ मार्ग बंद!
            </div>
            <div style={{ fontSize: '14px', marginTop: '4px' }}>
              {alertMessage || 'व्हीआयपी मिरवणुकीमुळे मार्ग तात्पुरता बंद. सर्व यात्रेकरूंनी पंचवटी घाट वळण मार्ग (R21) वापरावा.'}
            </div>
          </div>
          <div style={{ backgroundColor: 'rgba(0,0,0,0.3)', padding: '8px 16px', borderRadius: '10px', fontWeight: 800, fontSize: '15px' }}>
            वळण मार्ग R21 खुला ➡️
          </div>
        </div>
      )}

      {/* Main Kiosk Content Split */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', flex: 1, overflow: 'hidden' }}>
        {/* Left: Active Guidance Panel */}
        <div style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid var(--river-teal-border)', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Compass size={24} style={{ color: 'var(--marigold)' }} />
              <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>
                {activeResponse?.title || 'पहाटे ४:०० — रामकुंड स्नान मार्ग'}
              </h2>
            </div>
            {isR17Closed ? (
              <TierBadge tier={1} language="mr" size="lg" />
            ) : (
              <TierBadge tier={4} language="mr" size="lg" />
            )}
          </div>

          <div style={{ fontSize: '16px', lineHeight: 1.6, color: '#ECE5D5', marginBottom: '20px' }}>
            {activeResponse?.summary || 'मोदी मैदान (P09) येथे वाहन उभे करा (६८% जागा उपलब्ध). थेट नदीकाठ मार्गाने (R17) १४ मिनिटांत रामकुंडावर पोहोचा.'}
          </div>

          {/* Metric Box */}
          <div style={{ backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid var(--river-teal-border)', borderRadius: '12px', padding: '16px 20px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--marigold)' }}>
                {activeResponse?.primary_metric || '१४ मिनिटे चालण्याचा वेळ'}
              </div>
              <div style={{ fontSize: '13px', color: '#ECE5D5' }}>
                {activeResponse?.primary_metric_label || 'मध्यम गर्दी • सुरक्षित पादचारी मार्ग'}
              </div>
            </div>
            <div style={{ backgroundColor: 'rgba(47, 122, 107, 0.25)', padding: '10px 16px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Volume2 size={20} style={{ color: 'var(--marigold)' }} />
              <span style={{ fontSize: '13px', fontWeight: 700 }}>ध्वनी उद्घोषणा सक्रिय</span>
            </div>
          </div>

          {/* Navigation Steps */}
          <div style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--marigold)' }}>
              मार्गदर्शक पावले (Walking Directions):
            </div>
            {(activeResponse?.route_data?.steps || [
              'मोदी मैदान वाहनतळ (P09) येथे वाहन उभे करा',
              'गोदावरी नदीकाठ पदपथाने (R17) पुढे चला',
              'रामकुंड मुख्य स्नान घाटावर सुरक्षित पोहोचा'
            ]).map((step, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '15px' }}>
                <span style={{ backgroundColor: 'var(--marigold)', color: '#1B2A4A', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '12px', flexShrink: 0 }}>
                  {idx + 1}
                </span>
                <span>{step}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Touchscreen Buttons & Push-to-Talk Voice */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Push to talk giant touch card */}
          <div
            onClick={handleVoicePush}
            style={{
              backgroundColor: isListening ? '#C1401F' : 'rgba(232, 135, 30, 0.15)',
              border: '2px solid var(--marigold)',
              borderRadius: '16px',
              padding: '20px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px'
            }}
          >
            <div style={{ backgroundColor: 'var(--marigold)', color: '#1B2A4A', padding: '16px', borderRadius: '50%' }}>
              {isListening ? <MicOff size={32} /> : <Mic size={32} />}
            </div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#fff' }}>
              {isListening ? 'मी ऐकत आहे... (Listening...)' : 'येथे स्पर्श करून बोला (Press & Speak)'}
            </div>
            <div style={{ fontSize: '12px', color: '#ECE5D5' }}>
              मराठी, हिंदी किंवा इंग्रजीत प्रश्न विचारा
            </div>
          </div>

          {/* Quick inquiry touch cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', flex: 1 }}>
            <button
              onClick={() => askAgent('पहाटे ४ वाजता स्नान मार्ग')}
              style={{ backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid var(--river-teal-border)', borderRadius: '12px', padding: '16px', color: '#fff', textAlign: 'left', cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
            >
              <Clock size={24} style={{ color: 'var(--marigold)' }} />
              <div>
                <div style={{ fontSize: '15px', fontWeight: 700 }}>४ वाजता स्नान</div>
                <div style={{ fontSize: '12px', color: '#ECE5D5' }}>कमी गर्दीचा मार्ग</div>
              </div>
            </button>

            <button
              onClick={() => askAgent('५ वाजता गर्दी कशी असेल?')}
              style={{ backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid var(--river-teal-border)', borderRadius: '12px', padding: '16px', color: '#fff', textAlign: 'left', cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
            >
              <AlertTriangle size={24} style={{ color: '#F59E0B' }} />
              <div>
                <div style={{ fontSize: '15px', fontWeight: 700 }}>५ वाजता आगमन</div>
                <div style={{ fontSize: '12px', color: '#ECE5D5' }}>गर्दी पुनर्नियोजन</div>
              </div>
            </button>

            <button
              onClick={() => askAgent('जवळचे स्वच्छ शौचालय कुठे आहे?')}
              style={{ backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid var(--river-teal-border)', borderRadius: '12px', padding: '16px', color: '#fff', textAlign: 'left', cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
            >
              <Bath size={24} style={{ color: '#38BDF8' }} />
              <div>
                <div style={{ fontSize: '15px', fontWeight: 700 }}>स्वच्छ शौचालय</div>
                <div style={{ fontSize: '12px', color: '#ECE5D5' }}>१४० मी • ३ मिनिटे रांग</div>
              </div>
            </button>

            <button
              onClick={() => askAgent('जवळचे मोफत लंगर किंवा स्वस्त जेवण कुठे आहे?')}
              style={{ backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid var(--river-teal-border)', borderRadius: '12px', padding: '16px', color: '#fff', textAlign: 'left', cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
            >
              <Utensils size={24} style={{ color: '#4ADE80' }} />
              <div>
                <div style={{ fontSize: '15px', fontWeight: 700 }}>अन्नछत्र / लंगर</div>
                <div style={{ fontSize: '12px', color: '#ECE5D5' }}>मोफत खिचडी व चहा</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
