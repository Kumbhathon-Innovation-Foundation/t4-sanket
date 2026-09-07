import React, { useState, useMemo } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Polygon,
  Circle,
  Popup,
  useMap
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { RouteStatus, SupportedLanguage } from '../types';
import { PRECOMPUTED_WALKING_PATHS } from '../services/mockData';
import { DASHBOARD_TRANSLATIONS } from '../services/dashboardI18n';
import {
  NASHIK_POIS,
  NASHIK_POLYGONS,
  NashikPOI,
  NashikPoiCategory
} from '../services/nashikGisData';

interface OpenFreeMapCanvasProps {
  routes: RouteStatus[];
  activeRouteId?: string;
  isDiverted?: boolean;
  language?: SupportedLanguage;
  showCrowdDensity?: boolean;
  showFacilities?: boolean;
  simulatedPosition?: [number, number] | null;
  activePoiId?: string | null;
  activePolyline?: [number, number][] | null;
  targetDestinationName?: string;
  onSelectPoi?: (poi: NashikPOI) => void;
  onToggleCrowdDensity?: () => void;
  onToggleFacilities?: () => void;
}

// Custom DivIcon generator for Badges
const createBadgeIcon = (htmlContent: string, className: string = 'custom-badge') => {
  return L.divIcon({
    className,
    html: htmlContent,
    iconSize: [140, 36],
    iconAnchor: [70, 18]
  });
};

// Custom Marker Pin Generator per Category
const createPoiIcon = (category: NashikPoiCategory, name: string, isSelected: boolean = false) => {
  let iconEmoji = '📍';
  let bgColor = '#3B82F6';
  let borderColor = '#FFFFFF';
  let ringAnimation = '';

  switch (category) {
    case 'ghat':
      iconEmoji = '🛕';
      bgColor = '#EA580C'; // Sacred saffron
      borderColor = '#FDE047';
      ringAnimation = 'box-shadow: 0 0 0 4px rgba(234, 88, 12, 0.4);';
      break;
    case 'riverside-holding':
      iconEmoji = '🛡️';
      bgColor = '#0891B2'; // Cyan/Teal
      borderColor = '#67E8F9';
      break;
    case 'parking':
      iconEmoji = '🅿️';
      bgColor = '#2563EB'; // Deep Blue
      borderColor = '#93C5FD';
      break;
    case 'congestion':
      iconEmoji = '🚨';
      bgColor = '#DC2626'; // Red Alert
      borderColor = '#FCA5A5';
      ringAnimation = 'box-shadow: 0 0 0 4px rgba(220, 38, 38, 0.4);';
      break;
    case 'medical':
      iconEmoji = '➕';
      bgColor = '#E11D48'; // Rose Medical
      borderColor = '#FFE4E6';
      break;
    case 'landmark':
      iconEmoji = '🏛️';
      bgColor = '#7C3AED'; // Purple
      borderColor = '#DDD6FE';
      break;
  }

  const size = isSelected ? 34 : category === 'ghat' ? 30 : 26;

  return L.divIcon({
    className: 'custom-poi-marker',
    html: `
      <div style="
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        transform: translate(-50%, -50%);
        cursor: pointer;
      ">
        <div style="
          width: ${size}px;
          height: ${size}px;
          border-radius: 50%;
          background-color: ${bgColor};
          border: 2px solid ${borderColor};
          display: flex;
          align-items: center;
          justify-content: center;
          color: #FFFFFF;
          font-size: ${size * 0.48}px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.5);
          ${ringAnimation}
          transition: transform 0.2s ease;
        ">
          ${iconEmoji}
        </div>
        ${
          category === 'ghat' || isSelected
            ? `
          <div style="
            margin-top: 2px;
            background: rgba(15, 23, 42, 0.88);
            border: 1px solid ${borderColor};
            border-radius: 4px;
            padding: 1px 5px;
            font-size: 8.5px;
            font-weight: 700;
            color: #FFFFFF;
            white-space: nowrap;
            text-shadow: 0 1px 2px rgba(0,0,0,0.8);
            pointer-events: none;
          ">
            ${name.length > 18 ? name.substring(0, 16) + '…' : name}
          </div>
        `
            : ''
        }
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2]
  });
};

// Map controller for zoom & pan
const MapController: React.FC<{ targetCoords?: [number, number] | null }> = ({ targetCoords }) => {
  const map = useMap();

  React.useEffect(() => {
    if (targetCoords) {
      map.flyTo(targetCoords, 16, { duration: 1.2 });
    }
  }, [targetCoords, map]);

  return (
    <div
      style={{
        position: 'absolute',
        right: '14px',
        bottom: '50px',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
      }}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          map.zoomIn();
        }}
        title="Zoom In"
        style={{
          width: '28px',
          height: '28px',
          borderRadius: '6px',
          backgroundColor: 'rgba(15, 23, 42, 0.9)',
          border: '1px solid rgba(255,255,255,0.25)',
          color: '#FFFFFF',
          fontSize: '15px',
          fontWeight: 700,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        +
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          map.zoomOut();
        }}
        title="Zoom Out"
        style={{
          width: '28px',
          height: '28px',
          borderRadius: '6px',
          backgroundColor: 'rgba(15, 23, 42, 0.9)',
          border: '1px solid rgba(255,255,255,0.25)',
          color: '#FFFFFF',
          fontSize: '15px',
          fontWeight: 700,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        -
      </button>
    </div>
  );
};

export const OpenFreeMapCanvas: React.FC<OpenFreeMapCanvasProps> = ({
  routes,
  activeRouteId = 'R21',
  isDiverted = true,
  language = 'en',
  showCrowdDensity = true,
  showFacilities = true,
  simulatedPosition = null,
  activePoiId = null,
  activePolyline = null,
  targetDestinationName = '',
  onSelectPoi,
  onToggleCrowdDensity,
  onToggleFacilities
}) => {
  const t = DASHBOARD_TRANSLATIONS[language]?.pravah || DASHBOARD_TRANSLATIONS.en.pravah;

  // Filter state for POI categories
  const [poiFilter, setPoiFilter] = useState<'all' | 'ghat' | 'riverside-holding' | 'parking' | 'congestion' | 'medical'>('all');
  const [showPolygons, setShowPolygons] = useState<boolean>(true);

  // Focus coordinates for map controller
  const [focusTarget, setFocusTarget] = useState<[number, number] | null>(null);

  // Precomputed paths
  const r17Path = PRECOMPUTED_WALKING_PATHS.R17;
  const r21Path = PRECOMPUTED_WALKING_PATHS.R21;

  // Current active display route
  const displayRoute = activePolyline && activePolyline.length >= 2 ? activePolyline : r21Path;

  // Recenter whenever activePolyline or target changes
  React.useEffect(() => {
    if (activePolyline && activePolyline.length > 0) {
      const midIdx = Math.floor(activePolyline.length / 2);
      setFocusTarget(activePolyline[midIdx]);
    }
  }, [activePolyline, targetDestinationName]);

  // Filtered POIs from nashik-all.geojson
  const visiblePois = useMemo(() => {
    if (poiFilter === 'all') return NASHIK_POIS;
    return NASHIK_POIS.filter((p) => p.category === poiFilter);
  }, [poiFilter]);

  // Handle POI selection
  const handleMarkerClick = (poi: NashikPOI) => {
    setFocusTarget([poi.lat, poi.lng]);
    if (onSelectPoi) onSelectPoi(poi);
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '440px',
        backgroundColor: '#0B132B',
        borderRadius: '16px',
        overflow: 'hidden',
        border: '1px solid rgba(56, 189, 248, 0.25)',
        boxShadow: '0 8px 30px rgba(0,0,0,0.45)'
      }}
    >
      <style>{`
        @keyframes mapPulse {
          0% { transform: scale(0.9); opacity: 0.9; }
          50% { transform: scale(1.6); opacity: 0.35; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        .leaflet-container {
          width: 100%;
          height: 100%;
          background: #0B132B !important;
        }
        .custom-popup .leaflet-popup-content-wrapper {
          background: #0F172A;
          color: #F8FAFC;
          border-radius: 10px;
          border: 1px solid rgba(56, 189, 248, 0.4);
          box-shadow: 0 10px 25px rgba(0,0,0,0.7);
          padding: 2px;
        }
        .custom-popup .leaflet-popup-tip {
          background: #0F172A;
          border: 1px solid rgba(56, 189, 248, 0.4);
        }
      `}</style>

      {/* Top Header Bar inside Map */}
      <div
        style={{
          position: 'absolute',
          top: '10px',
          left: '12px',
          right: '12px',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          pointerEvents: 'none'
        }}
      >
        {/* Row 1: Title & Main Toggles */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', pointerEvents: 'auto' }}>
            <div
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                backgroundColor: 'rgba(16,185,129,0.2)',
                border: '1px solid #10B981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#10B981',
                fontSize: '12px',
                fontWeight: 800
              }}
            >
              🌐
            </div>
            <span style={{ fontSize: '13px', fontWeight: 800, color: '#FFFFFF', letterSpacing: '0.04em' }}>
              {t.crowdMapTitle}
            </span>
            <span
              style={{
                fontSize: '9.5px',
                backgroundColor: 'rgba(56,189,248,0.15)',
                color: '#38BDF8',
                padding: '2px 8px',
                borderRadius: '4px',
                border: '1px solid rgba(56,189,248,0.3)',
                fontWeight: 700
              }}
            >
              Nashik GIS ({visiblePois.length} POIs)
            </span>
          </div>

          {/* Toggle Pills */}
          <div style={{ display: 'flex', gap: '6px', pointerEvents: 'auto', flexWrap: 'wrap' }}>
            <button
              onClick={onToggleCrowdDensity}
              style={{
                backgroundColor: showCrowdDensity ? '#2563EB' : 'rgba(15, 23, 42, 0.85)',
                color: '#FFFFFF',
                border: showCrowdDensity ? '1px solid #60A5FA' : '1px solid rgba(255,255,255,0.15)',
                borderRadius: '20px',
                padding: '3px 10px',
                fontSize: '10px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: showCrowdDensity ? '#60A5FA' : '#94A3B8'
                }}
              />
              <span>{t.crowdDensityToggle}</span>
            </button>

            <button
              onClick={() => setShowPolygons(!showPolygons)}
              style={{
                backgroundColor: showPolygons ? '#0891B2' : 'rgba(15, 23, 42, 0.85)',
                color: '#FFFFFF',
                border: showPolygons ? '1px solid #67E8F9' : '1px solid rgba(255,255,255,0.15)',
                borderRadius: '20px',
                padding: '3px 10px',
                fontSize: '10px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: showPolygons ? '#67E8F9' : '#94A3B8'
                }}
              />
              <span>Zones ({NASHIK_POLYGONS.length})</span>
            </button>
          </div>
        </div>

        {/* Row 2: Category Filter Bar from GeoJSON (Clickable!) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            pointerEvents: 'auto',
            overflowX: 'auto',
            paddingBottom: '2px'
          }}
        >
          {[
            { key: 'all', label: 'All', icon: '📍', count: NASHIK_POIS.length },
            { key: 'ghat', label: 'Ghats', icon: '🛕', count: NASHIK_POIS.filter((p) => p.category === 'ghat').length },
            { key: 'riverside-holding', label: 'Holding Areas', icon: '🛡️', count: NASHIK_POIS.filter((p) => p.category === 'riverside-holding').length },
            { key: 'parking', label: 'Outer Parking', icon: '🅿️', count: NASHIK_POIS.filter((p) => p.category === 'parking').length },
            { key: 'congestion', label: 'Transit Hubs', icon: '🚨', count: NASHIK_POIS.filter((p) => p.category === 'congestion').length },
            { key: 'medical', label: 'Medical', icon: '➕', count: NASHIK_POIS.filter((p) => p.category === 'medical').length }
          ].map((tab) => {
            const isActive = poiFilter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setPoiFilter(tab.key as any)}
                style={{
                  backgroundColor: isActive ? 'rgba(56, 189, 248, 0.25)' : 'rgba(15, 23, 42, 0.85)',
                  color: isActive ? '#38BDF8' : '#CBD5E1',
                  border: isActive ? '1px solid #38BDF8' : '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '6px',
                  padding: '2px 8px',
                  fontSize: '9.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  whiteSpace: 'nowrap',
                  boxShadow: isActive ? '0 0 10px rgba(56,189,248,0.3)' : 'none'
                }}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                <span
                  style={{
                    fontSize: '8px',
                    backgroundColor: 'rgba(255,255,255,0.12)',
                    padding: '1px 4px',
                    borderRadius: '4px'
                  }}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Leaflet MapContainer centered at Central Nashik Ramkund */}
      <MapContainer
        center={[20.0076, 73.7935]}
        zoom={14}
        zoomControl={false}
        attributionControl={false}
        scrollWheelZoom={true}
      >
        {/* OpenStreetMap / Carto Voyager tilelayer */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          maxZoom={19}
        />

        {/* Dynamic Zoom & Pan Controller */}
        <MapController targetCoords={focusTarget} />

        {/* 1. REAL NASHIK GEOJSON POLYGONS (Ghats, Holding Areas, Outer Parking) */}
        {showPolygons &&
          NASHIK_POLYGONS.map((poly, idx) => {
            let strokeColor = '#3B82F6';
            let fillColor = '#3B82F6';
            let fillOpacity = 0.25;

            if (poly.category === 'ghat') {
              strokeColor = '#EA580C';
              fillColor = '#F97316';
              fillOpacity = 0.35;
            } else if (poly.category === 'riverside-holding') {
              strokeColor = '#06B6D4';
              fillColor = '#06B6D4';
              fillOpacity = 0.3;
            } else if (poly.category === 'parking') {
              strokeColor = '#2563EB';
              fillColor = '#3B82F6';
              fillOpacity = 0.25;
            }

            return (
              <Polygon
                key={`poly-${idx}`}
                positions={poly.coordinates}
                pathOptions={{
                  color: strokeColor,
                  fillColor: fillColor,
                  fillOpacity: fillOpacity,
                  weight: 2
                }}
              >
                <Popup className="custom-popup">
                  <div style={{ fontSize: '11px', padding: '4px' }}>
                    <div style={{ fontWeight: 800, color: '#38BDF8', marginBottom: '2px' }}>
                      {poly.name}
                    </div>
                    <div style={{ fontSize: '9.5px', color: '#94A3B8' }}>
                      Category: <strong style={{ color: '#fff' }}>{poly.category.toUpperCase()}</strong>
                    </div>
                  </div>
                </Popup>
              </Polygon>
            );
          })}

        {/* 2. CROWD DENSITY HEATMAP OVERLAYS */}
        {showCrowdDensity && (
          <>
            {/* Ramkund Critical/High Density (Red) */}
            <Circle
              center={[20.0073, 73.7925]}
              radius={160}
              pathOptions={{
                color: '#EF4444',
                fillColor: '#EF4444',
                fillOpacity: 0.55,
                weight: 1.5
              }}
            />
            <Circle
              center={[20.0073, 73.7925]}
              radius={70}
              pathOptions={{
                color: '#DC2626',
                fillColor: '#DC2626',
                fillOpacity: 0.8,
                weight: 2
              }}
            />

            {/* R17 Corridor Heavy Crowd (Orange) */}
            <Circle
              center={[20.0068, 73.794]}
              radius={120}
              pathOptions={{
                color: '#F97316',
                fillColor: '#F97316',
                fillOpacity: 0.5,
                weight: 1
              }}
            />

            {/* Panchavati Moderate Crowd (Yellow) */}
            <Circle
              center={[20.0101, 73.7949]}
              radius={110}
              pathOptions={{
                color: '#EAB308',
                fillColor: '#EAB308',
                fillOpacity: 0.45,
                weight: 1
              }}
            />

            {/* Talkuteshwar Holding Safe (Green) */}
            <Circle
              center={[20.0028, 73.7971]}
              radius={100}
              pathOptions={{
                color: '#10B981',
                fillColor: '#10B981',
                fillOpacity: 0.35,
                weight: 1
              }}
            />
          </>
        )}

        {/* 3. R17 CLOSED RESTRICTION CORRIDOR (Red Dashed when diverted) */}
        {isDiverted && (
          <Polyline
            positions={r17Path}
            pathOptions={{
              color: '#EF4444',
              weight: 5,
              dashArray: '8 6',
              opacity: 0.95
            }}
          />
        )}

        {/* 4. ACTIVE DYNAMIC NAVIGATION ROUTE (Glowing Blue/Cyan Corridor) */}
        <Polyline
          positions={displayRoute}
          pathOptions={{
            color: '#38BDF8',
            weight: 9,
            opacity: 0.55
          }}
        />
        <Polyline
          positions={displayRoute}
          pathOptions={{
            color: '#2563EB',
            weight: 5,
            opacity: 1
          }}
        />

        {/* Target Destination Pin at the end of the route */}
        {displayRoute.length > 0 && targetDestinationName && (
          <Marker
            position={displayRoute[displayRoute.length - 1]}
            icon={createBadgeIcon(`
              <div style="background:#0F172A; border:1.5px solid #38BDF8; border-radius:18px; padding:3px 10px; display:flex; align-items:center; gap:6px; box-shadow:0 0 16px rgba(56,189,248,0.8); cursor:pointer; width:fit-content;">
                <div style="width:18px; height:18px; border-radius:50%; background:#2563EB; display:flex; align-items:center; justify-content:center; color:#fff; font-size:10px; font-weight:800;">🎯</div>
                <div style="color:#FFFFFF; font-size:10px; font-weight:800; white-space:nowrap;">
                  ${targetDestinationName.length > 22 ? targetDestinationName.substring(0, 20) + '…' : targetDestinationName}
                </div>
              </div>
            `)}
          />
        )}

        {/* 5. ROUTE STATUS BADGES */}
        {isDiverted && (
          <Marker
            position={[20.007, 73.7942]}
            icon={createBadgeIcon(`
              <div style="background:#1E293B; border:1.5px solid #EF4444; border-radius:20px; padding:3px 10px; display:flex; align-items:center; gap:6px; box-shadow:0 4px 14px rgba(239,68,68,0.5); cursor:pointer; width:fit-content;">
                <div style="width:18px; height:18px; border-radius:50%; background:#EF4444; display:flex; align-items:center; justify-content:center; color:#fff; font-size:10px; font-weight:800;">⛔</div>
                <div style="color:#FFFFFF; font-size:10px; font-weight:800; white-space:nowrap;">
                  R17 Closed <span style="opacity:0.75; font-weight:600; font-size:9px;">(VIP Movement)</span>
                </div>
              </div>
            `)}
          />
        )}

        <Marker
          position={[20.008, 73.798]}
          icon={createBadgeIcon(`
            <div style="background:#0F172A; border:1.5px solid #3B82F6; border-radius:20px; padding:3px 10px; display:flex; align-items:center; gap:6px; box-shadow:0 4px 14px rgba(59,130,246,0.6); cursor:pointer; width:fit-content;">
              <div style="width:18px; height:18px; border-radius:50%; background:#3B82F6; display:flex; align-items:center; justify-content:center; color:#fff; font-size:10px; font-weight:800;">▶</div>
              <div style="color:#93C5FD; font-size:10px; font-weight:700; white-space:nowrap;">
                Recommended Route <strong style="color:#FFFFFF;">R21</strong>
              </div>
            </div>
          `)}
        />

        {/* 6. ACTUAL NASHIK GEOJSON POIS (Custom Pointers per Category) */}
        {visiblePois.map((poi) => {
          const isSelected = activePoiId === poi.id;
          return (
            <Marker
              key={poi.id}
              position={[poi.lat, poi.lng]}
              icon={createPoiIcon(poi.category, poi.name, isSelected)}
              eventHandlers={{
                click: () => handleMarkerClick(poi)
              }}
            >
              <Popup className="custom-popup">
                <div style={{ minWidth: '180px', padding: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                    <span
                      style={{
                        fontSize: '9px',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        backgroundColor:
                          poi.category === 'ghat'
                            ? 'rgba(234,88,12,0.25)'
                            : poi.category === 'riverside-holding'
                            ? 'rgba(8,145,178,0.25)'
                            : poi.category === 'parking'
                            ? 'rgba(37,99,235,0.25)'
                            : 'rgba(220,38,38,0.25)',
                        color:
                          poi.category === 'ghat'
                            ? '#FB923C'
                            : poi.category === 'riverside-holding'
                            ? '#38BDF8'
                            : poi.category === 'parking'
                            ? '#60A5FA'
                            : '#F87171'
                      }}
                    >
                      {poi.category.replace('-', ' ')}
                    </span>
                    <span style={{ fontSize: '9px', color: '#10B981', fontWeight: 700 }}>● Active Sync</span>
                  </div>

                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#FFFFFF', marginBottom: '4px' }}>
                    {poi.name}
                  </div>

                  <div style={{ fontSize: '10px', color: '#94A3B8', marginBottom: '8px' }}>
                    GPS: {poi.lat.toFixed(4)}° N, {poi.lng.toFixed(4)}° E
                    {poi.area && <div>Area: {poi.area}</div>}
                    {poi.capacity && <div>Capacity: {poi.capacity}</div>}
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onSelectPoi) onSelectPoi(poi);
                    }}
                    style={{
                      width: '100%',
                      backgroundColor: '#2563EB',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '6px 10px',
                      fontSize: '10.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px'
                    }}
                  >
                    <span>Navigate to this Location</span>
                    <span>➔</span>
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* 7. LIVE SIMULATED PILGRIM WALKING POSITION */}
        {simulatedPosition && (
          <Marker
            position={simulatedPosition}
            icon={L.divIcon({
              className: 'pilgrim-animated-marker',
              html: `
                <div style="position:relative; width:34px; height:34px; transform: translate(-50%, -50%);">
                  <div style="position:absolute; inset:-8px; border-radius:50%; border:2.5px solid #38BDF8; animation:mapPulse 1.4s infinite;"></div>
                  <div style="width:34px; height:34px; border-radius:50%; background:#2563EB; border:2.5px solid #FFFFFF; display:flex; align-items:center; justify-content:center; color:#fff; font-size:16px; font-weight:800; box-shadow:0 4px 14px rgba(37,99,235,0.8);">
                    🚶
                  </div>
                </div>
              `,
              iconSize: [34, 34],
              iconAnchor: [17, 17]
            })}
          />
        )}
      </MapContainer>

      {/* Bottom Map Legend Bar */}
      <div
        style={{
          position: 'absolute',
          bottom: '8px',
          left: '10px',
          right: '10px',
          zIndex: 1000,
          backgroundColor: 'rgba(11, 19, 43, 0.94)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '10px',
          padding: '6px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px',
          fontSize: '9.5px',
          color: 'rgba(255, 255, 255, 0.9)'
        }}
      >
        {/* Heatmap density dots */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#EF4444' }} />
            <span>{t.legendHigh}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#F97316' }} />
            <span>{t.legendMed}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#10B981' }} />
            <span>{t.legendLow}</span>
          </div>
        </div>

        {/* POI Pointers Legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
            🛕 Ghats
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
            🛡️ Holding
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
            🅿️ Parking
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
            🚨 Hubs
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
            ➕ Medical
          </span>
        </div>

        {/* Route status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#EF4444', color: '#fff', fontSize: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>⛔</span>
            <span>{t.legendClosed}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '16px', height: '3px', backgroundColor: '#3B82F6', borderRadius: '2px', display: 'inline-block' }} />
            <span>{t.legendRec}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
