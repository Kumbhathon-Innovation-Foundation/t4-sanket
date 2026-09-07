import React, { useEffect, useRef } from 'react';
import { RouteStatus } from '@kumbh-saathi/shared';
import { MapPin, Navigation } from 'lucide-react';
import L from 'leaflet';

interface LiveRouteMapProps {
  routes: RouteStatus[];
  activeRouteId: string;
  isDiverted?: boolean;
}

export const LiveRouteMap: React.FC<LiveRouteMapProps> = ({
  routes,
  activeRouteId,
  isDiverted
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [20.0075, 73.8010],
        zoom: 15,
        zoomControl: false,
        attributionControl: false
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19
      }).addTo(map);

      L.control.zoom({ position: 'topright' }).addTo(map);

      const layerGroup = L.layerGroup().addTo(map);
      layerGroupRef.current = layerGroup;
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    if (!layerGroup || !map) return;

    layerGroup.clearLayers();

    // Landmark markers
    const createCustomIcon = (color: string, label: string) => {
      return L.divIcon({
        className: 'custom-map-icon',
        html: `
          <div style="
            background-color: ${color};
            color: white;
            padding: 4px 8px;
            border-radius: 6px;
            font-size: 11px;
            font-weight: bold;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            white-space: nowrap;
            border: 2px solid white;
            display: flex;
            align-items: center;
            gap: 4px;
          ">
            <span>${label}</span>
          </div>
        `,
        iconSize: [100, 24],
        iconAnchor: [50, 12]
      });
    };

    L.marker([20.0061, 73.8102], { icon: createCustomIcon('#2F7A6B', '🅿️ Modi Ground') }).addTo(layerGroup);
    L.marker([20.0085, 73.7925], { icon: createCustomIcon('#E8871E', '🛕 Ramkund') }).addTo(layerGroup);
    L.marker([20.0083, 73.7914], { icon: createCustomIcon('#2563EB', '🚩 Panchavati Ghat') }).addTo(layerGroup);
    L.marker([20.0000, 73.8124], { icon: createCustomIcon('#5C5549', '🌿 Tapovan Ghat') }).addTo(layerGroup);

    // Render Routes Polylines
    routes.forEach((route) => {
      const waypoints = route.waypoints || [];
      if (waypoints.length === 0) return;

      const isCurrentActive = route.route_id === activeRouteId;
      const isClosed = route.tier === 1 || route.is_closed;

      const color = isClosed
        ? '#EF4444'
        : isCurrentActive
        ? '#E8871E'
        : route.tier === 2
        ? '#3B82F6'
        : '#2F7A6B';

      const weight = isCurrentActive ? 6 : 4;
      const dashArray = isClosed ? '6, 8' : undefined;

      const polyline = L.polyline(waypoints, {
        color,
        weight,
        opacity: isCurrentActive ? 0.95 : 0.45,
        dashArray
      }).addTo(layerGroup);

      polyline.bindPopup(`
        <div style="font-family: sans-serif; font-size: 12px; color: #1B2A4A; padding: 4px;">
          <strong>${route.name}</strong><br/>
          <span>${route.message_en || ''}</span><br/>
          <span style="font-weight: bold; color: ${color};">Status: Tier ${route.tier}</span>
        </div>
      `);
    });

    // Auto-fit bounds
    const activeRoute = routes.find((r) => r.route_id === activeRouteId);
    if (activeRoute && activeRoute.waypoints && activeRoute.waypoints.length > 0) {
      map.fitBounds(L.latLngBounds(activeRoute.waypoints), { padding: [40, 40] });
    }
  }, [routes, activeRouteId, isDiverted]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '280px', borderRadius: '12px', overflow: 'hidden' }}>
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
      {isDiverted && (
        <div style={{
          position: 'absolute',
          top: 10,
          left: 10,
          zIndex: 1000,
          backgroundColor: '#C1401F',
          color: '#fff',
          padding: '4px 10px',
          borderRadius: '9999px',
          fontSize: '11px',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
        }}>
          <Navigation size={12} />
          <span>POLICE DETOUR ACTIVE (R21)</span>
        </div>
      )}
    </div>
  );
};
