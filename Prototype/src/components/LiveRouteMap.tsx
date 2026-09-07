import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { RouteStatus } from '../types';
import { NASHIK_LOCATIONS, PRECOMPUTED_WALKING_PATHS, HERITAGE_POIS } from '../services/mockData';
import { Navigation, AlertTriangle, X, Compass, Footprints } from 'lucide-react';

interface LiveRouteMapProps {
  routes: RouteStatus[];
  activeRouteId?: string;
  isDiverted?: boolean;
  compact?: boolean;
  isKiosk?: boolean;
  simulatedPosition?: [number, number] | null;
  activePoiNear?: string | null;
  detourStop?: { name: string; lat: number; lng: number; type: string } | null;
  onClose?: () => void;
}

// Custom DivIcons styled using design system tokens
const createCustomIcon = (
  type: 'parking' | 'ghat' | 'temple' | 'destination' | 'pilgrim' | 'detour',
  label: string,
  isKiosk: boolean
) => {
  const baseSize = isKiosk ? 36 : type === 'pilgrim' ? 30 : 26;
  let bg = '#2F7A6B'; // river-teal
  let border = '#F6F1E4'; // parchment
  let pulseHtml = '';

  if (type === 'parking') {
    bg = '#E8871E'; // marigold
  } else if (type === 'destination') {
    bg = '#E8871E';
    pulseHtml = `<div style="position:absolute; inset:-8px; border-radius:50%; border:2px solid #E8871E; animation: mapPulse 1.8s infinite;"></div>`;
  } else if (type === 'temple') {
    bg = '#8B5CF6';
  } else if (type === 'detour') {
    bg = '#0284C7';
  } else if (type === 'pilgrim') {
    bg = '#DC2626';
    pulseHtml = `<div style="position:absolute; inset:-10px; border-radius:50%; border:3px solid #DC2626; animation: mapPulse 1.2s infinite;"></div>`;
  }

  const html = `
    <div style="position:relative; width:${baseSize}px; height:${baseSize}px;">
      ${pulseHtml}
      <div style="
        width:${baseSize}px;
        height:${baseSize}px;
        border-radius:50%;
        background-color:${bg};
        border:2px solid ${border};
        display:flex;
        align-items:center;
        justify-content:center;
        color:#FFFFFF;
        font-family:'IBM Plex Sans Devanagari', sans-serif;
        font-size:${isKiosk ? 13 : type === 'pilgrim' ? 14 : 10}px;
        font-weight:600;
        box-shadow:0 2px 8px rgba(0,0,0,0.35);
      ">
        ${label}
      </div>
    </div>
  `;

  return L.divIcon({
    className: 'custom-map-marker',
    html,
    iconSize: [baseSize, baseSize],
    iconAnchor: [baseSize / 2, baseSize / 2]
  });
};

export const LiveRouteMap: React.FC<LiveRouteMapProps> = ({
  routes,
  activeRouteId = 'R17',
  isDiverted = false,
  compact = false,
  isKiosk = false,
  simulatedPosition = null,
  activePoiNear = null,
  detourStop = null,
  onClose
}) => {
  const [r17Path, setR17Path] = useState<[number, number][]>(PRECOMPUTED_WALKING_PATHS.R17);
  const [r21Path, setR21Path] = useState<[number, number][]>(PRECOMPUTED_WALKING_PATHS.R21);
  const [r18Path, setR18Path] = useState<[number, number][]>(PRECOMPUTED_WALKING_PATHS.R18);
  const [rTalkPath, setRTalkPath] = useState<[number, number][]>(PRECOMPUTED_WALKING_PATHS.R_TALKUTESHWAR);

  const r17Route = routes.find((r) => r.route_id === 'R17');
  const isR17Closed = r17Route?.tier === 1 || r17Route?.is_closed || isDiverted;
  const isTalkActive = activeRouteId === 'R_TALKUTESHWAR';

  // Map center dynamically focuses between Ramkund and Modi Ground
  const mapCenter: [number, number] = [20.0073, 73.8010];
  const mapZoom = compact ? 15 : isKiosk ? 16 : 15;
  const lineWidth = isKiosk ? 7 : 5;

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: compact ? '240px' : isKiosk ? '420px' : '360px',
        borderRadius: 'var(--radius-card)',
        overflow: 'hidden',
        border: isR17Closed ? '2px solid var(--sindoor)' : '1px solid var(--river-teal-border)'
      }}
    >
      <style>{`
        @keyframes mapPulse {
          0% { transform: scale(1); opacity: 0.9; }
          50% { transform: scale(1.6); opacity: 0.3; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        .leaflet-container {
          width: 100%;
          height: 100%;
          background-color: #121E33;
        }
      `}</style>

      {/* Top Banner indicating current route state */}
      <div
        style={{
          position: 'absolute',
          top: 10,
          left: 10,
          zIndex: 1000,
          backgroundColor: isR17Closed ? 'var(--sindoor)' : isTalkActive ? 'var(--river-teal)' : 'var(--indigo-dusk)',
          color: '#FFFFFF',
          border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: 'var(--radius-pill)',
          padding: '5px 12px',
          fontSize: '11px',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          boxShadow: '0 2px 8px rgba(0,0,0,0.4)'
        }}
      >
        {isR17Closed ? (
          <>
            <AlertTriangle size={13} />
            <span>पोलीस आदेश: नदीकाठ बंद ➔ पंचवटी वळण (R21)</span>
          </>
        ) : isTalkActive ? (
          <>
            <Compass size={13} />
            <span>नियम 1a: वरिष्ठ सुगम मार्ग (तालकुटेश्वर)</span>
          </>
        ) : (
          <>
            <Navigation size={13} />
            <span>थेट नदीकाठ मार्ग खुला (R17 ➔ रामकुंड)</span>
          </>
        )}
      </div>

      {onClose && (
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            zIndex: 1000,
            backgroundColor: 'rgba(27, 42, 74, 0.85)',
            border: '1px solid var(--river-teal-border)',
            borderRadius: '50%',
            width: 28,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            cursor: 'pointer'
          }}
        >
          <X size={14} />
        </button>
      )}

      {/* Proactive Audio Radar Banner if near a heritage shrine */}
      {activePoiNear && (
        <div
          style={{
            position: 'absolute',
            top: 48,
            left: 10,
            right: 10,
            zIndex: 1000,
            backgroundColor: '#8B5CF6',
            color: '#fff',
            borderRadius: '8px',
            padding: '8px 12px',
            fontSize: '11px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 4px 12px rgba(139, 92, 246, 0.4)',
            animation: 'fadeIn 0.3s ease-out'
          }}
        >
          <span>🔊 {activePoiNear}</span>
          <span style={{ fontSize: '10px', backgroundColor: 'rgba(0,0,0,0.2)', padding: '2px 6px', borderRadius: '4px' }}>
            ऐका (Radar)
          </span>
        </div>
      )}

      {/* MapContainer */}
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        zoomControl={false}
        attributionControl={false}
        scrollWheelZoom={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          maxZoom={19}
        />

        {/* 1. Origin: Modi Ground Parking */}
        <Marker
          position={[NASHIK_LOCATIONS.P09.lat, NASHIK_LOCATIONS.P09.lng]}
          icon={createCustomIcon('parking', 'P09', isKiosk)}
        >
          <Popup>
            <div style={{ fontFamily: 'var(--font-family)', fontSize: '12px', color: 'var(--ink)' }}>
              <strong>मोदी मैदान वाहनतळ (P09)</strong>
              <div>६८% जागा उपलब्ध</div>
            </div>
          </Popup>
        </Marker>

        {/* 2. Destination: Ramkund Main Ghat */}
        <Marker
          position={[NASHIK_LOCATIONS.RAMKUND.lat, NASHIK_LOCATIONS.RAMKUND.lng]}
          icon={createCustomIcon('destination', 'राम', isKiosk)}
        >
          <Popup>
            <div style={{ fontFamily: 'var(--font-family)', fontSize: '12px', color: 'var(--ink)' }}>
              <strong>रामकुंड मुख्य स्नान घाट</strong>
              <div>पवित्र स्नान व गोदावरी दर्शन</div>
            </div>
          </Popup>
        </Marker>

        {/* 3. Talkuteshwar Ghat (Rule 1a Elder Friendly) */}
        <Marker
          position={[NASHIK_LOCATIONS.TALKUTESHWAR.lat, NASHIK_LOCATIONS.TALKUTESHWAR.lng]}
          icon={createCustomIcon('ghat', 'ताल', isKiosk)}
        >
          <Popup>
            <div style={{ fontFamily: 'var(--font-family)', fontSize: '12px', color: 'var(--ink)' }}>
              <strong>तालकुटेश्वर घाट (नियम 1a सुगम)</strong>
              <div>सौम्य रॅम्प • स्वयंसेवक सहायता • कमी गर्दी</div>
            </div>
          </Popup>
        </Marker>

        {/* 4. Panchavati Ghat */}
        <Marker
          position={[NASHIK_LOCATIONS.R21_end.lat, NASHIK_LOCATIONS.R21_end.lng]}
          icon={createCustomIcon('ghat', 'पंच', isKiosk)}
        >
          <Popup>
            <div style={{ fontFamily: 'var(--font-family)', fontSize: '12px', color: 'var(--ink)' }}>
              <strong>पंचवटी घाट</strong>
              <div>अधिकृत पोलीस वळण मार्ग</div>
            </div>
          </Popup>
        </Marker>

        {/* 5. Heritage Shrine: Kalaram Temple */}
        <Marker
          position={[NASHIK_LOCATIONS.KALARAM.lat, NASHIK_LOCATIONS.KALARAM.lng]}
          icon={createCustomIcon('temple', 'काळ', isKiosk)}
        >
          <Popup>
            <div style={{ fontFamily: 'var(--font-family)', fontSize: '12px', color: 'var(--ink)' }}>
              <strong>श्री काळाराम संस्थान मंदिर</strong>
              <div>१७८२ मधील ऐतिहासिक काळा पाषाण मंदिर</div>
            </div>
          </Popup>
        </Marker>

        {/* Proactive 60m Radar Circles around Temples */}
        <Circle
          center={[NASHIK_LOCATIONS.KALARAM.lat, NASHIK_LOCATIONS.KALARAM.lng]}
          radius={60}
          pathOptions={{
            color: '#8B5CF6',
            fillColor: '#8B5CF6',
            fillOpacity: 0.12,
            weight: 1,
            dashArray: '3, 4'
          }}
        />

        {/* 6. Heritage Shrine: Sita Gufa */}
        <Marker
          position={[NASHIK_LOCATIONS.SITA_GUFA.lat, NASHIK_LOCATIONS.SITA_GUFA.lng]}
          icon={createCustomIcon('temple', 'सीता', isKiosk)}
        >
          <Popup>
            <div style={{ fontFamily: 'var(--font-family)', fontSize: '12px', color: 'var(--ink)' }}>
              <strong>सीता गुंफा</strong>
              <div>पवित्र विश्रामस्थान</div>
            </div>
          </Popup>
        </Marker>

        {/* Detour Stop Pin if Active (Toilet / Medical / Langar) */}
        {detourStop && (
          <Marker
            position={[detourStop.lat, detourStop.lng]}
            icon={createCustomIcon('detour', 'थांबा', isKiosk)}
          >
            <Popup>
              <div style={{ fontFamily: 'var(--font-family)', fontSize: '12px', color: 'var(--ink)' }}>
                <strong>{detourStop.name}</strong>
                <div>मध्यंतरी जोडलेला थांबा (&lt;0.5 सेकंदात)</div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* 7. LIVE SIMULATED PILGRIM WALKING POSITION */}
        {simulatedPosition && (
          <Marker
            position={simulatedPosition}
            icon={createCustomIcon('pilgrim', '🚶', isKiosk)}
          >
            <Popup>
              <div style={{ fontFamily: 'var(--font-family)', fontSize: '12px', color: 'var(--ink)' }}>
                <strong>आपली थेट स्थिती (Live Pilgrim)</strong>
                <div>चालण्याचा वेग चालू आहे</div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* ROUTE POLYLINES */}
        {/* R17: Modi Ground -> Ramkund (Direct Riverside Road) */}
        {isR17Closed ? (
          <Polyline
            positions={r17Path}
            pathOptions={{
              color: '#C1401F', // sindoor
              weight: lineWidth + 1,
              dashArray: '8 8',
              opacity: 0.95
            }}
          />
        ) : (
          <Polyline
            positions={r17Path}
            pathOptions={{
              color: isTalkActive ? '#6B7280' : '#2F7A6B',
              weight: isTalkActive ? 3 : lineWidth,
              opacity: isTalkActive ? 0.35 : 0.95
            }}
          />
        )}

        {/* R21: Panchavati Ghat Diversion Corridor (Active Detour when R17 Closed) */}
        {isR17Closed ? (
          <Polyline
            positions={r21Path}
            pathOptions={{
              color: '#E8871E', // marigold (important, act now)
              weight: lineWidth + 2,
              opacity: 1
            }}
          />
        ) : (
          <Polyline
            positions={r21Path}
            pathOptions={{
              color: '#2F7A6B',
              weight: 3,
              opacity: 0.35,
              dashArray: '4 6'
            }}
          />
        )}

        {/* R_TALKUTESHWAR: Rule 1a Safe Corridor */}
        {isTalkActive && (
          <Polyline
            positions={rTalkPath}
            pathOptions={{
              color: '#10B981', // Emerald green
              weight: lineWidth + 2,
              opacity: 1
            }}
          />
        )}

        {/* R18: Tapovan Ghat Bypass */}
        <Polyline
          positions={r18Path}
          pathOptions={{
            color: '#2F7A6B',
            weight: 3,
            opacity: 0.35,
            dashArray: '4 4'
          }}
        />
      </MapContainer>

      {/* Floating Bottom Route Summary Card */}
      <div
        style={{
          position: 'absolute',
          bottom: 10,
          left: 10,
          right: 10,
          zIndex: 1000,
          backgroundColor: 'var(--parchment)',
          color: 'var(--ink)',
          border: isR17Closed ? '2px solid var(--sindoor)' : '1px solid var(--river-teal-border)',
          borderRadius: '8px',
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: '6px',
              backgroundColor: isR17Closed ? 'var(--sindoor)' : isTalkActive ? '#10B981' : 'var(--river-teal)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF'
            }}
          >
            {simulatedPosition ? <Footprints size={15} /> : <Navigation size={15} />}
          </div>
          <div>
            <div style={{ fontSize: isKiosk ? '1rem' : '0.82rem', fontWeight: 600, color: 'var(--ink)' }}>
              {isR17Closed
                ? 'पोलीस वळण: पंचवटी घाट (R21)'
                : isTalkActive
                ? 'नियम 1a: तालकुटेश्वर घाट (सुगम रॅम्प)'
                : 'थेट नदीकाठ मार्ग: रामकुंड (R17)'}
            </div>
            <div style={{ fontSize: isKiosk ? '0.8rem' : '0.72rem', color: 'var(--ink-muted)' }}>
              {isR17Closed
                ? 'पोलीस आदेश: थेट मार्ग बंद, १८ मिनिटे वळण'
                : isTalkActive
                ? 'ज्येष्ठ नागरिक सुलभ, १२ मिनिटे चालणे'
                : 'खुला मार्ग, १४ मिनिटे चालणे (१.३ किमी)'}
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: isKiosk ? '1.15rem' : '0.95rem', fontWeight: 700, color: isR17Closed ? 'var(--sindoor)' : isTalkActive ? '#059669' : 'var(--river-teal)' }}>
            {isR17Closed ? '१८ मिनिटे' : isTalkActive ? '१२ मिनिटे' : '१४ मिनिटे'}
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--ink-muted)' }}>
            {simulatedPosition ? 'सिम्युलेशन सक्रिय' : 'अंदाजे वेळ'}
          </div>
        </div>
      </div>
    </div>
  );
};
