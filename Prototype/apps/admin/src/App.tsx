import React, { useState, useEffect } from 'react';
import {
  RouteStatus,
  RouteTier,
  CrowdLevel,
  TierBadge,
  subscribeToRouteUpdates,
  broadcastLocalEvent
} from '@kumbh-saathi/shared';
import '@kumbh-saathi/shared/tokens.css';
import {
  ShieldAlert,
  Radio,
  Lock,
  LogOut,
  Send,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export const App: React.FC = () => {
  // Auth state
  const [token, setToken] = useState<string | null>(() => sessionStorage.getItem('pravah_token'));
  const [username, setUsername] = useState<string>('admin');
  const [password, setPassword] = useState<string>('pravah2026');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  // Route control state
  const [routes, setRoutes] = useState<RouteStatus[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<string>('R17');
  const [selectedTier, setSelectedTier] = useState<RouteTier>(1);
  const [selectedCrowd, setSelectedCrowd] = useState<CrowdLevel>('surge');
  const [reasonEn, setReasonEn] = useState<string>('VIP procession movement: Riverside road (R17) closed by police order');
  const [reasonHi, setReasonHi] = useState<string>('वीआईपी काफिला एवं अत्यधिक भीड़: मुख्य नदी तट मार्ग (R17) पुलिस आदेश द्वारा बंद');
  const [reasonMr, setReasonMr] = useState<string>('मुख्य नदीकाठ मार्ग (R17) व्हीआयपी मिरवणूक व गर्दीमुळे बंद करण्यात आला आहे');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [broadcastLog, setBroadcastLog] = useState<Array<{ time: string; text: string; tier: number }>>([]);

  // Fetch routes from API
  const fetchRoutes = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/routes`);
      if (res.ok) {
        const data = await res.json();
        if (data.routes) setRoutes(data.routes);
      }
    } catch (err) {
      console.warn('Failed to fetch routes:', err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchRoutes();
      const unsubscribe = subscribeToRouteUpdates(
        (updatedRoute) => {
          setRoutes((prev) => {
            const idx = prev.findIndex((r) => r.route_id === updatedRoute.route_id);
            if (idx !== -1) {
              const copy = [...prev];
              copy[idx] = updatedRoute;
              return copy;
            }
            return [...prev, updatedRoute];
          });
        },
        () => fetchRoutes()
      );
      return () => unsubscribe();
    }
  }, [token]);

  // Login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();
      if (res.ok && data.token) {
        setToken(data.token);
        sessionStorage.setItem('pravah_token', data.token);
      } else {
        setLoginError(data.error || 'Authentication failed. Please check credentials.');
      }
    } catch (err) {
      setLoginError('Cannot reach backend API at ' + API_BASE_URL);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    setToken(null);
    sessionStorage.removeItem('pravah_token');
  };

  // Submit route override via POST /api/admin/route-status (Bearer Auth)
  const submitRouteOverride = async (
    routeId: string,
    tier: RouteTier,
    crowd: CrowdLevel,
    en: string,
    hi: string,
    mr: string
  ) => {
    if (!token) return;
    setIsSubmitting(true);
    setActionFeedback(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/route-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          route_id: routeId,
          tier,
          crowd,
          message_en: en,
          message_hi: hi,
          message_mr: mr,
          updated_by: 'Nashik Police Joint Command (PRAVAH Desk)'
        })
      });

      if (res.status === 401) {
        handleLogout();
        setLoginError('Session expired. Please log in again.');
        return;
      }

      if (res.ok) {
        const data = await res.json();
        const updated = data.route;

        // Broadcast locally to notify other open tabs
        broadcastLocalEvent({
          type: tier === 1 ? 'TACTICAL_OVERRIDE' : 'ROUTE_UPDATE',
          route: {
            ...updated,
            is_closed: tier === 1,
            travel_time_min: tier === 1 ? 999 : 18
          },
          timestamp: new Date().toISOString()
        });

        // Update local route view
        await fetchRoutes();

        const logMsg = `[${new Date().toLocaleTimeString()}] ${routeId} set to Tier ${tier} (${crowd}): ${en.slice(0, 45)}...`;
        setBroadcastLog((prev) => [
          { time: new Date().toLocaleTimeString(), text: logMsg, tier },
          ...prev.slice(0, 15)
        ]);

        setActionFeedback(`Broadcasted: ${routeId} successfully updated to Tier ${tier}!`);
      } else {
        const errData = await res.json();
        setActionFeedback(`Error: ${errData.error || 'Failed to update'}`);
      }
    } catch (e) {
      setActionFeedback(`Network error contacting API at ${API_BASE_URL}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Preset Handlers
  const handlePresetVIPClose = () => {
    setSelectedRouteId('R17');
    setSelectedTier(1);
    setSelectedCrowd('surge');
    const en = 'VIP procession movement: Riverside road (R17) closed by police order';
    const hi = 'वीआईपी काफिला एवं अत्यधिक भीड़: मुख्य नदी तट मार्ग (R17) पुलिस आदेश द्वारा बंद';
    const mr = 'मुख्य नदीकाठ मार्ग (R17) व्हीआयपी मिरवणूक व गर्दीमुळे बंद करण्यात आला आहे';
    setReasonEn(en);
    setReasonHi(hi);
    setReasonMr(mr);
    submitRouteOverride('R17', 1, 'surge', en, hi, mr);
  };

  const handlePresetSurgeAdvisory = () => {
    setSelectedRouteId('R18');
    setSelectedTier(2);
    setSelectedCrowd('high');
    const en = 'High crowd congestion at Tapovan Ghat: queue wait exceeding 25 minutes';
    const hi = 'तपोवन स्नान घाट पर अधिक भीड़: कतार २५ मिनट से अधिक';
    const mr = 'तपोवन स्नान घाटावर प्रचंड गर्दी: रांगेचा वेळ २५ मिनिटांपेक्षा जास्त';
    setReasonEn(en);
    setReasonHi(hi);
    setReasonMr(mr);
    submitRouteOverride('R18', 2, 'high', en, hi, mr);
  };

  const handleResetToNormal = async () => {
    if (!token) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        broadcastLocalEvent({
          type: 'RESET_ALL',
          route: routes[0] || ({} as any),
          timestamp: new Date().toISOString()
        });
        await fetchRoutes();
        setActionFeedback('All corridors successfully restored to Tier 4 (Normal)!');
        setBroadcastLog((prev) => [
          { time: new Date().toLocaleTimeString(), text: 'All corridors reset to Normal Status (Tier 4)', tier: 4 },
          ...prev.slice(0, 15)
        ]);
      }
    } catch (e) {
      setActionFeedback('Failed to reset');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 1. Render Login Screen if not authenticated
  if (!token) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--indigo-dusk)', padding: '20px' }}>
        <div style={{ width: '100%', maxWidth: '420px', backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--river-teal-border)', borderRadius: '16px', padding: '32px', boxShadow: '0 12px 36px rgba(0,0,0,0.5)' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{ display: 'inline-flex', padding: '12px', borderRadius: '12px', backgroundColor: 'rgba(193, 64, 31, 0.15)', color: 'var(--sindoor)', marginBottom: '12px' }}>
              <ShieldAlert size={32} />
            </div>
            <h1 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: 'var(--parchment)' }}>
              PRAVAH — Police Control Desk
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--parchment-deep)', marginTop: '4px' }}>
              नाशिक कुंभमेळा २०२६ • अधिकृत पोलीस नियंत्रण प्रवेश
            </p>
          </div>

          {loginError && (
            <div style={{ backgroundColor: 'rgba(193, 64, 31, 0.2)', border: '1px solid var(--sindoor)', color: '#fff', padding: '10px 14px', borderRadius: '8px', fontSize: '12px', marginBottom: '18px' }}>
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--parchment-deep)', marginBottom: '6px' }}>
                Officer Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                style={{ width: '100%', padding: '10px 14px', backgroundColor: 'rgba(0, 0, 0, 0.25)', border: '1px solid var(--river-teal-border)', borderRadius: '8px', color: '#fff', fontSize: '14px', outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--parchment-deep)', marginBottom: '6px' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{ width: '100%', padding: '10px 40px 10px 14px', backgroundColor: 'rgba(0, 0, 0, 0.25)', border: '1px solid var(--river-teal-border)', borderRadius: '8px', color: '#fff', fontSize: '14px', outline: 'none' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--parchment-deep)', cursor: 'pointer' }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div style={{ backgroundColor: 'rgba(47, 122, 107, 0.12)', border: '1px solid var(--river-teal-border)', borderRadius: '8px', padding: '10px', fontSize: '11px', color: 'var(--parchment-deep)' }}>
              <strong>Demo Credentials:</strong> <code>admin</code> / <code>pravah2026</code>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: 'var(--marigold)',
                color: 'var(--indigo-dusk)',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              {isLoggingIn ? <RefreshCw size={16} className="animate-spin" /> : <Lock size={16} />}
              <span>सुरक्षित प्रवेश करा (Login)</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 2. Render Authenticated PRAVAH Console
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--indigo-dusk)', color: 'var(--parchment)', padding: '24px' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        {/* Top Command Bar */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--river-teal-border)', paddingBottom: '16px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ backgroundColor: 'var(--sindoor)', color: '#fff', padding: '8px', borderRadius: '10px' }}>
              <Radio size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h1 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>
                  PRAVAH — Police Control Command Desk
                </h1>
                <span style={{ fontSize: '11px', backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#34D399', padding: '2px 8px', borderRadius: '9999px', fontWeight: 600 }}>
                  LIVE DESK
                </span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--parchment-deep)', margin: '2px 0 0' }}>
                नाशिक कुंभमेळा २०२६ • अधिकृत मार्ग नियंत्रण व थेट आदेश प्रणाली
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '12px', color: 'var(--parchment-deep)' }}>
              Officer: <strong>admin (Joint Command)</strong>
            </span>
            <button
              onClick={handleLogout}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid var(--river-teal-border)', color: 'var(--parchment)', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer' }}
            >
              <LogOut size={14} />
              <span>बाहेर पडा (Logout)</span>
            </button>
          </div>
        </header>

        {actionFeedback && (
          <div style={{ backgroundColor: 'rgba(47, 122, 107, 0.2)', border: '1px solid var(--river-teal)', color: '#fff', padding: '10px 16px', borderRadius: '8px', fontSize: '13px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={16} style={{ color: 'var(--marigold)' }} />
            <span>{actionFeedback}</span>
          </div>
        )}

        {/* Corridor Status Overview Cards */}
        <section style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--parchment-deep)', marginBottom: '12px' }}>
            Active Pilgrimage Corridors (थेट मार्ग स्थिती)
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
            {routes.map((r) => {
              const isClosed = r.tier === 1;
              return (
                <div
                  key={r.route_id}
                  style={{
                    backgroundColor: isClosed ? 'rgba(193, 64, 31, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                    border: isClosed ? '1px solid var(--sindoor)' : '1px solid var(--river-teal-border)',
                    borderRadius: '12px',
                    padding: '16px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: isClosed ? '#FF8080' : 'var(--marigold)' }}>
                      {r.route_id}: {r.name.split(' via ')[0]}
                    </span>
                    <TierBadge tier={r.tier} language="en" size="sm" />
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--parchment-deep)', marginBottom: '8px', lineHeight: 1.4 }}>
                    {r.message_en || r.message_hi}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--ink-subtle)', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '6px' }}>
                    <span>Crowd: <strong>{r.crowd.toUpperCase()}</strong></span>
                    <span>Updated: {r.updated_at || 'Just now'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Quick Tactical Presets Bar */}
        <section style={{ marginBottom: '24px', backgroundColor: 'rgba(0,0,0,0.2)', border: '1px solid var(--river-teal-border)', borderRadius: '12px', padding: '16px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '10px' }}>
            ⚡ Fast Tactical Dispatch Presets (जलद पोलीस कृती)
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={handlePresetVIPClose}
              disabled={isSubmitting}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'var(--sindoor)',
                color: '#fff',
                border: 'none',
                padding: '10px 18px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <AlertTriangle size={16} />
              <span>Force Close R17 (VIP Procession Emergency Override)</span>
            </button>

            <button
              onClick={handlePresetSurgeAdvisory}
              disabled={isSubmitting}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#2563EB',
                color: '#fff',
                border: 'none',
                padding: '10px 18px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <span>Trigger Tapovan Advisory (Tier 2 Surge)</span>
            </button>

            <button
              onClick={handleResetToNormal}
              disabled={isSubmitting}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'var(--river-teal)',
                color: '#fff',
                border: 'none',
                padding: '10px 18px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <RotateCcw size={16} />
              <span>Reset All to Normal (Tier 4)</span>
            </button>
          </div>
        </section>

        {/* Custom Override Form & Dispatch Log Split */}
        <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '20px' }}>
          {/* Form */}
          <div style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid var(--river-teal-border)', borderRadius: '12px', padding: '20px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '16px' }}>
              Manual Route Override / Advisory Dispatch
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>Target Corridor</label>
                <select
                  value={selectedRouteId}
                  onChange={(e) => setSelectedRouteId(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid var(--river-teal-border)', borderRadius: '6px', color: '#fff' }}
                >
                  <option value="R17">R17: Modi Ground to Ramkund (Riverside)</option>
                  <option value="R21">R21: Panchavati Ghat Diversion</option>
                  <option value="R18">R18: Tapovan Ghat Bypass Corridor</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>Tier Classification</label>
                <select
                  value={selectedTier}
                  onChange={(e) => setSelectedTier(Number(e.target.value) as RouteTier)}
                  style={{ width: '100%', padding: '8px 12px', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid var(--river-teal-border)', borderRadius: '6px', color: '#fff' }}
                >
                  <option value={1}>Tier 1: 🔴 Tactical Override (Force Closure)</option>
                  <option value={2}>Tier 2: 🔵 Verified Advisory (High Congestion)</option>
                  <option value={3}>Tier 3: 🟡 Automated Guidance</option>
                  <option value={4}>Tier 4: ⚪ Normal Operation</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>Crowd Level</label>
              <select
                value={selectedCrowd}
                onChange={(e) => setSelectedCrowd(e.target.value as CrowdLevel)}
                style={{ width: '100%', padding: '8px 12px', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid var(--river-teal-border)', borderRadius: '6px', color: '#fff' }}
              >
                <option value="low">Low (सुगम / विरळ)</option>
                <option value="moderate">Moderate (मध्यम)</option>
                <option value="high">High (जास्त गर्दी)</option>
                <option value="surge">Surge (अति गर्दी / बंद)</option>
              </select>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>Broadcast Message (English)</label>
              <input
                type="text"
                value={reasonEn}
                onChange={(e) => setReasonEn(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid var(--river-teal-border)', borderRadius: '6px', color: '#fff', fontSize: '13px' }}
              />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>संदेश (हिंदी)</label>
              <input
                type="text"
                value={reasonHi}
                onChange={(e) => setReasonHi(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid var(--river-teal-border)', borderRadius: '6px', color: '#fff', fontSize: '13px' }}
              />
            </div>

            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>संदेश (मराठी)</label>
              <input
                type="text"
                value={reasonMr}
                onChange={(e) => setReasonMr(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid var(--river-teal-border)', borderRadius: '6px', color: '#fff', fontSize: '13px' }}
              />
            </div>

            <button
              onClick={() => submitRouteOverride(selectedRouteId, selectedTier, selectedCrowd, reasonEn, reasonHi, reasonMr)}
              disabled={isSubmitting}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: selectedTier === 1 ? 'var(--sindoor)' : 'var(--marigold)',
                color: selectedTier === 1 ? '#fff' : 'var(--indigo-dusk)',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              {isSubmitting ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} />}
              <span>प्रसारित करा (Broadcast Authorization via API)</span>
            </button>
          </div>

          {/* Broadcast Activity Log */}
          <div style={{ backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid var(--river-teal-border)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '12px', color: 'var(--parchment-deep)' }}>
              Police Command Broadcast Log
            </h3>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {broadcastLog.length === 0 ? (
                <div style={{ fontSize: '12px', color: 'var(--ink-subtle)', fontStyle: 'italic', textAlign: 'center', marginTop: '20px' }}>
                  No manual overrides dispatched this session. Use presets or form to broadcast.
                </div>
              ) : (
                broadcastLog.map((log, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '6px',
                      backgroundColor: log.tier === 1 ? 'rgba(193, 64, 31, 0.2)' : 'rgba(255,255,255,0.05)',
                      fontSize: '12px',
                      lineHeight: 1.3
                    }}
                  >
                    <span style={{ color: log.tier === 1 ? '#FF9999' : 'var(--marigold)', fontWeight: 600 }}>{log.time}</span>: {log.text}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
