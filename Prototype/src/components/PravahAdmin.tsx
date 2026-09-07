import React, { useState, useEffect } from 'react';
import { RouteStatus, RouteTier, CrowdLevel } from '../types';
import { realtimeHub } from '../services/realtimeHub';
import {
  ShieldAlert,
  Radio,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Send
} from 'lucide-react';

export const PravahAdmin: React.FC = () => {
  const [routes, setRoutes] = useState<RouteStatus[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<string>('R17');
  const [selectedTier, setSelectedTier] = useState<RouteTier>(1);
  const [selectedCrowd, setSelectedCrowd] = useState<CrowdLevel>('surge');
  const [reasonEn, setReasonEn] = useState<string>('VIP procession movement: Riverside road (R17) closed by police order');
  const [reasonHi, setReasonHi] = useState<string>('वीआईपी काफिला एवं अत्यधिक भीड़: मुख्य नदी तट मार्ग (R17) पुलिस आदेश द्वारा बंद');
  const [reasonMr, setReasonMr] = useState<string>('मुख्य नदीकाठ मार्ग (R17) व्हीआयपी मिरवणूक व गर्दीमुळे बंद करण्यात आला आहे');
  const [lastBroadcastTime, setLastBroadcastTime] = useState<string | null>(null);
  const [broadcastCount, setBroadcastCount] = useState<number>(0);

  useEffect(() => {
    setRoutes(realtimeHub.getRoutes());

    const unsubscribe = realtimeHub.subscribe(() => {
      setRoutes(realtimeHub.getRoutes());
      setLastBroadcastTime(new Date().toLocaleTimeString());
      setBroadcastCount((c) => c + 1);
    });

    return () => unsubscribe();
  }, []);

  const handleApplyOverride = () => {
    try {
      realtimeHub.updateRouteStatus(
        selectedRouteId,
        selectedTier,
        selectedCrowd,
        {
          en: reasonEn,
          hi: reasonHi,
          mr: reasonMr
        },
        'Nashik Police Joint Command (PRAVAH Desk)'
      );
    } catch (e) {
      console.error(e);
    }
  };

  const handleQuickPreset = (preset: 'VIP_CLOSE' | 'ADVISORY_SURGE' | 'RESET_NORMAL') => {
    if (preset === 'VIP_CLOSE') {
      setSelectedRouteId('R17');
      setSelectedTier(1);
      setSelectedCrowd('surge');
      setReasonEn('VIP procession movement: Riverside road (R17) closed by police order');
      setReasonHi('वीआईपी काफिला एवं अत्यधिक भीड़: मुख्य नदी तट मार्ग (R17) पुलिस आदेश द्वारा बंद');
      setReasonMr('मुख्य नदीकाठ मार्ग (R17) व्हीआयपी मिरवणूक व गर्दीमुळे बंद करण्यात आला आहे');

      realtimeHub.updateRouteStatus(
        'R17',
        1,
        'surge',
        {
          en: 'VIP procession movement: Riverside road (R17) closed by police order',
          hi: 'वीआईपी काफिला एवं अत्यधिक भीड़: मुख्य नदी तट मार्ग (R17) पुलिस आदेश द्वारा बंद',
          mr: 'मुख्य नदीकाठ मार्ग (R17) व्हीआयपी मिरवणूक व गर्दीमुळे बंद करण्यात आला आहे'
        },
        'PRAVAH Police Control Room'
      );
    } else if (preset === 'ADVISORY_SURGE') {
      setSelectedRouteId('R18');
      setSelectedTier(2);
      setSelectedCrowd('high');
      setReasonEn('High crowd congestion at Tapovan Ghat: queue wait exceeding 25 minutes');
      setReasonHi('तपोवन स्नान घाट पर अधिक भीड़: कतार २५ मिनट से अधिक');
      setReasonMr('तपोवन स्नान घाटावर प्रचंड गर्दी: रांगेचा वेळ २५ मिनिटांपेक्षा जास्त');

      realtimeHub.updateRouteStatus(
        'R18',
        2,
        'high',
        {
          en: 'High crowd congestion at Tapovan Ghat: queue wait exceeding 25 minutes',
          hi: 'तपोवन स्नान घाट पर अधिक भीड़: कतार २५ मिनट से अधिक',
          mr: 'तपोवन स्नान घाटावर प्रचंड गर्दी: रांगेचा वेळ २५ मिनिटांपेक्षा जास्त'
        },
        'PRAVAH Police Control Room'
      );
    } else if (preset === 'RESET_NORMAL') {
      realtimeHub.resetAllToNormal();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Banner & Command Overview */}
      <div
        style={{
          backgroundColor: 'var(--indigo-dusk)',
          border: '1px solid var(--river-teal-border)',
          borderRadius: 'var(--radius-card)',
          padding: '1.5rem',
          borderLeft: '4px solid var(--marigold)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
              <span
                style={{
                  backgroundColor: 'var(--marigold)',
                  color: '#FFFFFF',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  fontWeight: 500
                }}
              >
                प्रवाह • Pravah
              </span>
              <h1 style={{ fontSize: '1.35rem', fontWeight: 500, color: 'var(--parchment)', margin: 0 }}>
                पोलीस नियंत्रण कक्ष (Police command room console)
              </h1>
            </div>
            <p style={{ color: 'var(--parchment-deep)', fontSize: '0.88rem', margin: '4px 0 0 0', opacity: 0.9 }}>
              नाशिक कुंभमेळा २०२६ अधिकृत मार्ग नियंत्रण. बदल थेट यात्रेकरूंच्या फोनवर व किओस्कवर त्वरित पोहोचतात.
            </p>
          </div>

          <div
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.25)',
              padding: '6px 14px',
              borderRadius: '8px',
              border: '1px solid var(--river-teal-border)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              fontSize: '0.82rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Radio size={15} color="var(--river-teal)" />
              <span style={{ color: 'var(--parchment-deep)' }}>प्रसारण:</span>
              <span style={{ color: 'var(--parchment)', fontWeight: 500 }}>{broadcastCount}</span>
            </div>
            <div style={{ width: 1, height: 14, backgroundColor: 'var(--river-teal-border)' }} />
            <span style={{ color: 'var(--parchment-deep)' }}>
              शेवटचे अपडेट: {lastBroadcastTime || 'सक्रिय'}
            </span>
          </div>
        </div>

        {/* Demo Trigger Buttons */}
        <div style={{ marginTop: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--parchment-deep)' }}>
            डेमो कृती:
          </span>

          <button
            onClick={() => handleQuickPreset('VIP_CLOSE')}
            className="btn-marigold"
            style={{ fontSize: '0.82rem', padding: '7px 14px' }}
          >
            <ShieldAlert size={15} />
            रामकुंड पंचवटी मार्ग बंद करा (VIP movement)
          </button>

          <button
            onClick={() => handleQuickPreset('ADVISORY_SURGE')}
            style={{
              backgroundColor: 'transparent',
              color: 'var(--sindoor)',
              border: '1px solid var(--sindoor)',
              borderRadius: '8px',
              padding: '7px 14px',
              fontSize: '0.82rem',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <AlertTriangle size={15} />
            तपोवन गर्दी सूचना (Tier 2 advisory)
          </button>

          <button
            onClick={() => handleQuickPreset('RESET_NORMAL')}
            style={{
              backgroundColor: 'transparent',
              color: 'var(--river-teal)',
              border: '1px solid var(--river-teal-border)',
              borderRadius: '8px',
              padding: '7px 14px',
              fontSize: '0.82rem',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <RotateCcw size={14} />
            सर्व मार्ग पूर्ववत करा (Normal flow)
          </button>
        </div>
      </div>

      {/* Main Grid: Control Form & Route Status Table */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
        {/* Left: Tactical Route Control Form */}
        <div
          style={{
            backgroundColor: 'var(--indigo-dusk)',
            border: '1px solid var(--river-teal-border)',
            borderRadius: 'var(--radius-card)',
            padding: '1.5rem',
            color: 'var(--parchment)'
          }}
        >
          <h2 style={{ fontSize: '1.15rem', fontWeight: 500, margin: '0 0 1.25rem 0' }}>
            मार्ग नियंत्रण (Route control)
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--parchment-deep)', marginBottom: '5px' }}>
                मार्ग निवडा
              </label>
              <select
                value={selectedRouteId}
                onChange={(e) => setSelectedRouteId(e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: 'rgba(0, 0, 0, 0.25)',
                  color: 'var(--parchment)',
                  border: '1px solid var(--river-teal-border)',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  fontSize: '0.88rem',
                  fontFamily: 'var(--font-family)',
                  outline: 'none'
                }}
              >
                {routes.map((r) => (
                  <option key={r.route_id} value={r.route_id} style={{ backgroundColor: '#1B2A4A' }}>
                    {r.name_mr} ({r.name}) {r.is_closed ? '• [बंद]' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--parchment-deep)', marginBottom: '5px' }}>
                अधिकार स्तर (Tier level)
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTier(1);
                    setSelectedCrowd('surge');
                  }}
                  style={{
                    backgroundColor: selectedTier === 1 ? 'rgba(232, 135, 30, 0.15)' : 'rgba(0, 0, 0, 0.2)',
                    border: selectedTier === 1 ? '1px solid var(--marigold)' : '1px solid var(--river-teal-border)',
                    color: selectedTier === 1 ? 'var(--marigold)' : 'var(--parchment-deep)',
                    padding: '10px',
                    borderRadius: '8px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '0.82rem',
                    fontWeight: selectedTier === 1 ? 500 : 400
                  }}
                >
                  Tier 1: Tactical override
                  <div style={{ fontSize: '0.72rem', opacity: 0.85, marginTop: '2px' }}>थेट पोलीस आदेश (रस्ता बंद)</div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedTier(2);
                    setSelectedCrowd('high');
                  }}
                  style={{
                    backgroundColor: selectedTier === 2 ? 'var(--sindoor-subtle)' : 'rgba(0, 0, 0, 0.2)',
                    border: selectedTier === 2 ? '1px solid var(--sindoor)' : '1px solid var(--river-teal-border)',
                    color: selectedTier === 2 ? 'var(--sindoor)' : 'var(--parchment-deep)',
                    padding: '10px',
                    borderRadius: '8px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '0.82rem',
                    fontWeight: selectedTier === 2 ? 500 : 400
                  }}
                >
                  Tier 2: Verified advisory
                  <div style={{ fontSize: '0.72rem', opacity: 0.85, marginTop: '2px' }}>सल्ला व गर्दी सूचना</div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedTier(4)}
                  style={{
                    backgroundColor: selectedTier === 4 ? 'var(--river-teal-subtle)' : 'rgba(0, 0, 0, 0.2)',
                    border: selectedTier === 4 ? '1px solid var(--river-teal)' : '1px solid var(--river-teal-border)',
                    color: selectedTier === 4 ? 'var(--river-teal)' : 'var(--parchment-deep)',
                    padding: '10px',
                    borderRadius: '8px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '0.82rem',
                    fontWeight: selectedTier === 4 ? 500 : 400
                  }}
                >
                  Tier 4: Normal status
                  <div style={{ fontSize: '0.72rem', opacity: 0.85, marginTop: '2px' }}>सामान्य व खुला प्रवाह</div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedTier(3)}
                  style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.2)',
                    border: '1px solid var(--river-teal-border)',
                    color: 'var(--parchment-deep)',
                    padding: '10px',
                    borderRadius: '8px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '0.82rem'
                  }}
                >
                  Tier 3: Automated sensor
                  <div style={{ fontSize: '0.72rem', opacity: 0.7, marginTop: '2px' }}>राखीव स्लॉट</div>
                </button>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--parchment-deep)', marginBottom: '4px' }}>
                मराठी सूचना
              </label>
              <input
                type="text"
                value={reasonMr}
                onChange={(e) => setReasonMr(e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: 'rgba(0, 0, 0, 0.25)',
                  color: 'var(--parchment)',
                  border: '1px solid var(--river-teal-border)',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '0.82rem',
                  fontFamily: 'var(--font-family)',
                  outline: 'none'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--parchment-deep)', marginBottom: '4px' }}>
                English notice
              </label>
              <input
                type="text"
                value={reasonEn}
                onChange={(e) => setReasonEn(e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: 'rgba(0, 0, 0, 0.25)',
                  color: 'var(--parchment)',
                  border: '1px solid var(--river-teal-border)',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '0.82rem',
                  fontFamily: 'var(--font-family)',
                  outline: 'none'
                }}
              />
            </div>

            <button
              onClick={handleApplyOverride}
              className="btn-marigold"
              style={{ width: '100%', marginTop: '0.5rem', padding: '10px' }}
            >
              <Send size={15} />
              <span>लागू करा आणि प्रसारित करा (Broadcast update)</span>
            </button>
          </div>
        </div>

        {/* Right: Live Route Status Table */}
        <div
          style={{
            backgroundColor: 'var(--indigo-dusk)',
            border: '1px solid var(--river-teal-border)',
            borderRadius: 'var(--radius-card)',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 500, margin: 0 }}>
              सध्याची मार्ग स्थिती (Live route feed)
            </h2>
            <span style={{ fontSize: '0.8rem', color: 'var(--parchment-deep)' }}>
              ५ मार्ग
            </span>
          </div>

          <div style={{ overflowX: 'auto', flex: 1 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--river-teal-border)', color: 'var(--parchment-deep)', textAlign: 'left' }}>
                  <th style={{ padding: '8px 10px', fontWeight: 400 }}>मार्ग नाव</th>
                  <th style={{ padding: '8px 10px', fontWeight: 400 }}>अधिकार स्तर</th>
                  <th style={{ padding: '8px 10px', fontWeight: 400 }}>स्थिती</th>
                  <th style={{ padding: '8px 10px', fontWeight: 400 }}>वेळ</th>
                </tr>
              </thead>
              <tbody>
                {routes.map((r) => (
                  <tr
                    key={r.route_id}
                    style={{
                      borderBottom: '1px solid rgba(47, 122, 107, 0.15)',
                      backgroundColor: r.is_closed ? 'rgba(193, 64, 31, 0.08)' : 'transparent'
                    }}
                  >
                    <td style={{ padding: '9px 10px' }}>
                      <div style={{ fontWeight: 500, color: 'var(--parchment)' }}>{r.name_mr}</div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--parchment-deep)', opacity: 0.8 }}>{r.destination}</div>
                    </td>
                    <td style={{ padding: '9px 10px' }}>
                      {r.tier === 1 ? (
                        <span className="badge badge-tactical">Tier 1: Tactical</span>
                      ) : r.tier === 2 ? (
                        <span className="badge badge-advisory">Tier 2: Advisory</span>
                      ) : (
                        <span className="badge badge-calm">Tier 4: Normal</span>
                      )}
                    </td>
                    <td style={{ padding: '9px 10px' }}>
                      {r.is_closed ? (
                        <span style={{ color: 'var(--marigold)', fontWeight: 500 }}>
                          रस्ता बंद
                        </span>
                      ) : (
                        <span style={{ color: 'var(--river-teal)', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <CheckCircle2 size={13} /> खुला
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '9px 10px', color: 'var(--parchment-deep)', fontSize: '0.75rem' }}>
                      {r.updated_at}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
