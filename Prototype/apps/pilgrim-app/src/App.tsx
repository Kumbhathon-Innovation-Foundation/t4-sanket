import React, { useState, useEffect } from 'react';
import {
  RouteStatus,
  SupportedLanguage,
  AgentResponse,
  TierBadge,
  subscribeToRouteUpdates
} from '@kumbh-saathi/shared';
import '@kumbh-saathi/shared/tokens.css';
import { LiveRouteMap } from './components/LiveRouteMap';
import { speechService } from './speechService';
import {
  Volume2,
  VolumeX,
  Compass,
  Navigation,
  Send,
  Sparkles,
  MapPin,
  Clock,
  Car,
  AlertTriangle,
  RefreshCw,
  Utensils,
  Bath
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export const App: React.FC = () => {
  const [language, setLanguage] = useState<SupportedLanguage>('hi');
  const [routes, setRoutes] = useState<RouteStatus[]>([]);
  const [activeRouteId, setActiveRouteId] = useState<string>('R17');
  const [currentResponse, setCurrentResponse] = useState<AgentResponse | null>(null);
  const [inputQuery, setInputQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [realtimeAlert, setRealtimeAlert] = useState<string | null>(null);

  // Fetch routes from services/api on mount
  const fetchRoutes = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/routes`);
      if (res.ok) {
        const data = await res.json();
        if (data.routes) setRoutes(data.routes);
      }
    } catch (e) {
      console.warn('Failed to fetch routes from API:', e);
    }
  };

  // Call POST /api/agent/query
  const sendQuery = async (queryText: string, forcedLang?: SupportedLanguage) => {
    const langToUse = forcedLang || language;
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/agent/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: queryText, language: langToUse })
      });

      if (res.ok) {
        const data: AgentResponse = await res.json();
        setCurrentResponse(data);
        if (data.route_data?.primary_route) {
          setActiveRouteId(data.route_data.primary_route.route_id);
        }
      }
    } catch (e) {
      console.error('Agent query error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutes();
    // Default initial query for 4 AM snan
    sendQuery('४ बजे स्नान और दर्शन के लिए आ रहा हूँ', 'hi');

    // Subscribe to Supabase Realtime route updates
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

        // Trigger tactical re-routing if R17 closed
        if (updatedRoute.route_id === 'R17' && updatedRoute.tier <= 2) {
          setRealtimeAlert(`⚠️ ${updatedRoute.message_hi || updatedRoute.message_en}`);
          sendQuery('मार्ग सुरक्षा अपडेट', language);
        } else if (updatedRoute.tier === 4) {
          setRealtimeAlert(null);
        }
      },
      () => {
        fetchRoutes();
        sendQuery('४ बजे स्नान और दर्शन के लिए आ रहा हूँ', language);
        setRealtimeAlert(null);
      }
    );

    return () => unsubscribe();
  }, [language]);

  const handleLanguageChange = (newLang: SupportedLanguage) => {
    setLanguage(newLang);
    sendQuery('यात्रा विवरण', newLang);
  };

  const handleAudioPlayback = () => {
    if (!currentResponse) return;
    if (isSpeaking) {
      speechService.stop();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      speechService.speak(currentResponse.speak_text, language, () => setIsSpeaking(false));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputQuery.trim()) return;
    sendQuery(inputQuery);
    setInputQuery('');
  };

  const primaryRoute = routes.find((r) => r.route_id === activeRouteId) || routes[0];
  const isDiverted = currentResponse?.route_data?.is_diverted || (primaryRoute?.tier <= 2);

  return (
    <div style={{ maxWidth: '480px', margin: '0 auto', minHeight: '100vh', backgroundColor: 'var(--indigo-dusk)', color: 'var(--parchment)', padding: '16px' }}>
      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--river-teal-border)', paddingBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ backgroundColor: 'var(--marigold)', color: 'var(--indigo-dusk)', padding: '6px', borderRadius: '8px' }}>
            <Compass size={20} />
          </div>
          <div>
            <h1 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>कुंभ साथी — Pilgrim App</h1>
            <p style={{ fontSize: '11px', color: 'var(--parchment-deep)', margin: 0 }}>नाशिक कुंभमेळा २०२६ • अधिकृत थेट सेवा</p>
          </div>
        </div>

        {/* Language switcher */}
        <div style={{ display: 'flex', gap: '4px', backgroundColor: 'rgba(255,255,255,0.08)', padding: '3px', borderRadius: '8px' }}>
          {(['hi', 'mr', 'en'] as SupportedLanguage[]).map((l) => (
            <button
              key={l}
              onClick={() => handleLanguageChange(l)}
              style={{
                background: language === l ? 'var(--marigold)' : 'transparent',
                color: language === l ? 'var(--indigo-dusk)' : 'var(--parchment)',
                border: 'none',
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {l === 'hi' ? 'हिंदी' : l === 'mr' ? 'मराठी' : 'EN'}
            </button>
          ))}
        </div>
      </header>

      {/* Emergency Tactical Detour Banner */}
      {isDiverted && (
        <div style={{ backgroundColor: '#C1401F', color: '#fff', padding: '12px 14px', borderRadius: '12px', marginBottom: '16px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
          <AlertTriangle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: '13px' }}>
              {language === 'mr' ? 'पोलीस तात्काळ वळण आदेश' : language === 'hi' ? 'पुलिस तत्काल डायवर्जन आदेश' : 'Police Emergency Detour Active'}
            </div>
            <div style={{ fontSize: '12px', opacity: 0.95, marginTop: '2px' }}>
              {language === 'mr' ? 'नदीकाठ मार्ग बंद आहे. त्वरित पंचवटी वळण मार्ग (R21) वापरा.' : language === 'hi' ? 'मुख्य नदी तट मार्ग बंद है। कृपया पंचवटी घाट डायवर्जन (R21) लें।' : 'Riverside corridor is blocked. Diverting via Panchavati Ghat (R21).'}
            </div>
          </div>
        </div>
      )}

      {/* Live Map */}
      <div style={{ marginBottom: '16px' }}>
        <LiveRouteMap routes={routes} activeRouteId={activeRouteId} isDiverted={isDiverted} />
      </div>

      {/* Current Guidance Card */}
      {currentResponse && (
        <div style={{ backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid var(--river-teal-border)', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px' }}>🛕</span>
              <h2 style={{ fontSize: '15px', fontWeight: 700, margin: 0 }}>{currentResponse.title}</h2>
            </div>
            {primaryRoute && <TierBadge tier={primaryRoute.tier} language={language} size="sm" />}
          </div>

          <p style={{ fontSize: '13px', lineHeight: 1.5, color: 'var(--parchment-deep)', marginBottom: '12px' }}>
            {currentResponse.summary}
          </p>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)', padding: '8px 12px', borderRadius: '8px', marginBottom: '12px' }}>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--marigold)' }}>
                {currentResponse.primary_metric}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--ink-subtle)' }}>
                {currentResponse.primary_metric_label}
              </div>
            </div>

            <button
              onClick={handleAudioPlayback}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: isSpeaking ? 'var(--sindoor)' : 'var(--river-teal)',
                color: '#fff',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {isSpeaking ? <VolumeX size={14} /> : <Volume2 size={14} />}
              <span>{isSpeaking ? 'थांबवा' : 'ऐका (Audio)'}</span>
            </button>
          </div>

          {/* Quick Steps */}
          {currentResponse.route_data?.steps && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {currentResponse.route_data.steps.map((step, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--parchment)' }}>
                  <span style={{ color: 'var(--marigold)', fontWeight: 700 }}>•</span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Quick Action Chips */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '16px' }}>
        <button
          onClick={() => sendQuery('अगर ५ बजे आऊँ तो क्या बदलाव होगा?')}
          style={{ whiteSpace: 'nowrap', backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid var(--river-teal-border)', color: 'var(--parchment)', padding: '6px 12px', borderRadius: '20px', fontSize: '11px', cursor: 'pointer' }}
        >
          ⏰ ५ वाजता गर्दी? (5 AM rush)
        </button>
        <button
          onClick={() => sendQuery('स्वच्छ शौचालय कुठे आहे?')}
          style={{ whiteSpace: 'nowrap', backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid var(--river-teal-border)', color: 'var(--parchment)', padding: '6px 12px', borderRadius: '20px', fontSize: '11px', cursor: 'pointer' }}
        >
          🚻 शौचालय (Toilets)
        </button>
        <button
          onClick={() => sendQuery('जवळ चांगले आणि स्वस्त जेवण कुठे मिळेल?')}
          style={{ whiteSpace: 'nowrap', backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid var(--river-teal-border)', color: 'var(--parchment)', padding: '6px 12px', borderRadius: '20px', fontSize: '11px', cursor: 'pointer' }}
        >
          🍲 लंगर / महाप्रसाद (Food)
        </button>
      </div>

      {/* Query Bar */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '8px' }}>
        <input
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          placeholder={language === 'mr' ? 'कोणताही प्रश्न विचारा...' : language === 'hi' ? 'कोई भी प्रश्न पूछें...' : 'Ask route, toilet, food...'}
          style={{
            flex: 1,
            backgroundColor: 'rgba(255,255,255,0.1)',
            border: '1px solid var(--river-teal-border)',
            borderRadius: '10px',
            padding: '10px 14px',
            color: '#fff',
            fontSize: '13px',
            outline: 'none'
          }}
        />
        <button
          type="submit"
          disabled={isLoading}
          style={{
            backgroundColor: 'var(--marigold)',
            color: 'var(--indigo-dusk)',
            border: 'none',
            borderRadius: '10px',
            padding: '0 16px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {isLoading ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} />}
        </button>
      </form>
    </div>
  );
};
