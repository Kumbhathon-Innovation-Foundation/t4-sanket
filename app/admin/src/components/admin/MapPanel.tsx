// Reusable MapPanel Abstraction
// Architecture:
// MapPanel -> Geographic Layer Adapter (Leaflet with OpenStreetMap Tiles + Nashik GeoJSON + SVG Schematic Fallback)
import React, { useEffect, useRef, useState, useId } from "react";
import { cn } from "@/lib/utils";
import type { GeoPoint, Zone, CrowdLevel } from "@/types";
import { MapPin, Layers, Maximize2, RotateCcw, Map as MapIcon, Navigation, Activity } from "lucide-react";
import { MapLayerControl, type MapLayersState } from "./MapLayerControl";

export interface MapMarker {
  id: string;
  point: GeoPoint;
  label?: string | undefined;
  color?: string | undefined;
  size?: "sm" | "md" | "lg" | undefined;
  category?: "crowd" | "food" | "parking" | "facility" | "places" | "volunteer" | undefined;
  details?: string | undefined;
  badge?: string | undefined;
  badgeBg?: string | undefined;
}

export interface MapRouteItem {
  path: GeoPoint[];
  color?: string | undefined;
  dashed?: boolean | undefined;
  name?: string | undefined;
  status?: string | undefined;
}

export interface CrowdFlowVector {
  from: string;
  to: string;
  flow: string;
  trend: "INCREASING" | "STABLE" | "DECREASING";
  status: CrowdLevel;
}

export const DEMO_CROWD_VECTORS: CrowdFlowVector[] = [
  { from: "Z06", to: "Z07", flow: "1,400/hr", trend: "INCREASING", status: "HIGH" },
  { from: "Z07", to: "Z08", flow: "2,100/hr", trend: "INCREASING", status: "PEAK" },
  { from: "Z05", to: "Z06", flow: "800/hr", trend: "STABLE", status: "MODERATE" },
  { from: "Z03", to: "Z04", flow: "950/hr", trend: "STABLE", status: "MODERATE" },
];

interface MapPanelProps {
  zones?: Zone[] | undefined;
  markers?: MapMarker[] | undefined;
  routes?: MapRouteItem[] | undefined;
  selectedId?: string | undefined;
  focusedZoneId?: string | undefined;
  movementMode?: boolean | undefined;
  showMovementControl?: boolean | undefined;
  filterCategory?: "crowd" | "food" | "parking" | "facility" | "places" | undefined;
  allowedLayers?: (keyof MapLayersState)[] | undefined;
  onMovementModeChange?: ((enabled: boolean) => void) | undefined;
  onZoneClick?: ((zoneId: string) => void) | undefined;
  onMarkerClick?: ((id: string) => void) | undefined;
  className?: string | undefined;
  height?: string | undefined;
  children?: React.ReactNode | undefined;
  legend?: React.ReactNode | undefined;
  showLayerControls?: boolean | undefined;
  initialLayers?: Partial<MapLayersState> | undefined;
  center?: [number, number] | undefined; // [lat, lng] for Nashik
  zoom?: number | undefined;
}

// Nashik Godavari basin coordinates
const NASHIK_CENTER: [number, number] = [20.0063, 73.7900];
const DEFAULT_ZOOM = 14;

// Color schemes
const crowdFill: Record<string, string> = {
  LOW: "rgba(34, 197, 94, 0.22)",
  MODERATE: "rgba(234, 179, 8, 0.25)",
  HIGH: "rgba(249, 115, 22, 0.35)",
  PEAK: "rgba(239, 68, 68, 0.45)",
};

const crowdStroke: Record<string, string> = {
  LOW: "#22c55e",
  MODERATE: "#eab308",
  HIGH: "#f97316",
  PEAK: "#ef4444",
};

// Nashik Bounding box for coordinate projection
const NASHIK_BBOX = {
  minLng: 73.71,
  maxLng: 73.91,
  minLat: 19.97,
  maxLat: 20.04,
};

function toLatLng(pt: GeoPoint): [number, number] {
  if (pt.lat !== undefined && pt.lng !== undefined) {
    return [pt.lat, pt.lng];
  }
  const lat = NASHIK_BBOX.maxLat - (pt.y / 100) * (NASHIK_BBOX.maxLat - NASHIK_BBOX.minLat);
  const lng = NASHIK_BBOX.minLng + (pt.x / 100) * (NASHIK_BBOX.maxLng - NASHIK_BBOX.minLng);
  return [lat, lng];
}

export function MapPanel({
  zones = [],
  markers = [],
  routes = [],
  selectedId,
  focusedZoneId,
  movementMode: controlledMovementMode,
  showMovementControl = false,
  filterCategory,
  allowedLayers,
  onMovementModeChange,
  onZoneClick,
  onMarkerClick,
  className,
  height = "420px",
  children,
  legend,
  showLayerControls = true,
  initialLayers,
  center = NASHIK_CENTER,
  zoom = DEFAULT_ZOOM,
}: MapPanelProps) {
  const mapContainerId = useId().replace(/:/g, "_");
  const leafletMapRef = useRef<any>(null);
  const [mode, setMode] = useState<"gis" | "schematic">("gis");
  const [internalMovement, setInternalMovement] = useState(false);
  const movementActive = controlledMovementMode !== undefined ? controlledMovementMode : internalMovement;

  const [layers, setLayers] = useState<MapLayersState>({
    crowd: true,
    routes: true,
    parking: false,
    food: false,
    facilities: false,
    places: false,
    gisNashik: true,
    ...initialLayers,
  });

  const [geoFeatures, setGeoFeatures] = useState<any[]>([]);

  // Fetch Nashik core GeoJSON
  useEffect(() => {
    fetch("/data/nashik-core-ops.geojson")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.features) setGeoFeatures(data.features);
      })
      .catch(() => {});
  }, []);

  // Handle programmatic zone focus (flyTo)
  useEffect(() => {
    if (!focusedZoneId || !leafletMapRef.current) return;
    const targetZone = zones.find((z) => z.id === focusedZoneId);
    if (targetZone) {
      const targetCoords = toLatLng(targetZone.center);
      leafletMapRef.current.flyTo(targetCoords, 15, { duration: 0.8 });
    }
  }, [focusedZoneId, zones]);

  // Initialize and update Leaflet map
  useEffect(() => {
    if (typeof window === "undefined" || mode !== "gis") return;

    let isMounted = true;
    import("leaflet").then((L) => {
      if (!isMounted) return;

      const container = document.getElementById(mapContainerId);
      if (!container) return;

      // Clean up previous instance if any
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }

      const map = L.map(container, {
        center,
        zoom,
        zoomControl: false,
        attributionControl: false,
      });

      // Clean OpenStreetMap tiles
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      // Top-left zoom control
      L.control.zoom({ position: "topleft" }).addTo(map);

      // Attribution
      L.control.attribution({ position: "bottomright", prefix: false })
        .addAttribution("© OpenStreetMap · Nashik Kumbh GIS")
        .addTo(map);

      // 1. Render Nashik Core GeoJSON Features if enabled
      if (geoFeatures.length > 0 && layers.gisNashik) {
        L.geoJSON(
          { type: "FeatureCollection", features: geoFeatures } as any,
          {
            style: (feature: any) => {
              const layer = feature?.properties?.layer;
              if (layer === "Ghats") {
                return { color: "#2563eb", weight: 1.5, fillOpacity: 0.22, fillColor: "#3b82f6" };
              }
              if (layer === "Emergency routes") {
                return { color: "#dc2626", weight: 2, dashArray: "4 4", fillOpacity: 0 };
              }
              if (layer === "Holding areas") {
                return { color: "#9333ea", weight: 1.5, fillOpacity: 0.18, fillColor: "#a855f7" };
              }
              return { color: "#94a3b8", weight: 1, fillOpacity: 0.1 };
            },
            onEachFeature: (feature: any, layer: any) => {
              const name = feature?.properties?.Name || feature?.properties?.name;
              if (name) {
                layer.bindTooltip(name, { className: "text-[11px] font-sans font-medium" });
              }
            },
          }
        ).addTo(map);
      }

      // 2. Render Zone Polygons and Center Badges
      if (layers.crowd && zones.length > 0) {
        zones.forEach((zone) => {
          const latLngs = zone.shape.map((p) => toLatLng(p));
          const centerCoords = toLatLng(zone.center);
          const isSelected = selectedId === zone.id;
          const isPeakOrHigh = zone.crowd === "PEAK" || zone.crowd === "HIGH";

          // Calculate estimated pressure for display
          const pressurePct = zone.crowd === "PEAK" ? 94 : zone.crowd === "HIGH" ? 78 : zone.crowd === "MODERATE" ? 54 : 28;
          const trendSymbol = zone.trend === "INCREASING" ? "↑" : zone.trend === "DECREASING" ? "↓" : "→";

          // Draw Polygon
          const poly = L.polygon(latLngs, {
            color: isSelected ? "#c75b12" : crowdStroke[zone.crowd] || "#eab308",
            weight: isSelected ? 3.5 : isPeakOrHigh ? 2.5 : 1.5,
            fillColor: crowdStroke[zone.crowd] || "#eab308",
            fillOpacity: isSelected ? 0.5 : isPeakOrHigh ? 0.38 : 0.22,
            dashArray: zone.crowd === "PEAK" ? "4, 4" : undefined,
          }).addTo(map);

          poly.bindTooltip(
            `<div class="text-xs font-sans p-1">
              <strong class="font-semibold">${zone.name} (${zone.id})</strong><br/>
              <span>Crowd: <b style="color: ${crowdStroke[zone.crowd]}">${zone.crowd}</b></span> · <span>Pressure: <b>${pressurePct}%</b></span><br/>
              <span class="text-muted-foreground">Pilgrims: ${zone.pilgrims.toLocaleString()}</span> · <span>Trend: <b>${zone.trend}</b></span>
            </div>`,
            { sticky: true }
          );

          if (onZoneClick) {
            poly.on("click", () => onZoneClick(zone.id));
          }

          // Center Telemetry Label Marker
          const labelHtml = `
            <div class="cursor-pointer select-none rounded-md px-1.5 py-0.5 text-center shadow-md font-sans border transition-all ${
              isSelected
                ? "bg-stone-900 text-white border-orange-500 ring-2 ring-orange-500/50 scale-110 font-bold"
                : "bg-white/95 text-stone-900 border-stone-300 font-semibold hover:scale-105"
            }" style="font-size: 10px; line-height: 1.1; white-space: nowrap;">
              <span class="font-bold">${zone.id}</span>
              <span class="ml-1 px-1 rounded text-[9px] ${
                zone.crowd === "PEAK"
                  ? "bg-rose-100 text-rose-700"
                  : zone.crowd === "HIGH"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-stone-100 text-stone-600"
              }">${pressurePct}% ${trendSymbol}</span>
            </div>
          `;

          const customIcon = L.divIcon({
            html: labelHtml,
            className: "zone-telemetry-marker",
            iconSize: [68, 20],
            iconAnchor: [34, 10],
          });

          const centerMarker = L.marker(centerCoords, { icon: customIcon }).addTo(map);
          if (onZoneClick) {
            centerMarker.on("click", () => onZoneClick(zone.id));
          }
        });
      }

      // 3. Render Movement Mode Vectors (Directional Flow)
      if (movementActive && layers.crowd) {
        DEMO_CROWD_VECTORS.forEach((vec) => {
          const fromZone = zones.find((z) => z.id === vec.from);
          const toZone = zones.find((z) => z.id === vec.to);
          if (fromZone && toZone) {
            const start = toLatLng(fromZone.center);
            const end = toLatLng(toZone.center);

            L.polyline([start, end], {
              color: vec.status === "PEAK" ? "#ef4444" : vec.status === "HIGH" ? "#f97316" : "#eab308",
              weight: vec.status === "PEAK" ? 4 : 3,
              dashArray: "6, 6",
              opacity: 0.85,
            }).addTo(map);

            const midLat = (start[0] + end[0]) / 2;
            const midLng = (start[1] + end[1]) / 2;

            const flowBadgeHtml = `
              <div class="px-1.5 py-0.5 rounded shadow-sm bg-stone-900/90 text-amber-400 font-mono text-[9px] border border-amber-400/50 flex items-center gap-0.5 whitespace-nowrap">
                <span>${vec.from}→${vec.to}</span>
                <span class="font-bold text-white">${vec.flow}</span>
              </div>
            `;

            const badgeIcon = L.divIcon({
              html: flowBadgeHtml,
              className: "flow-badge-marker",
              iconSize: [80, 16],
              iconAnchor: [40, 8],
            });

            L.marker([midLat, midLng], { icon: badgeIcon, interactive: false }).addTo(map);
          }
        });
      }

      // 4. Render Routes & Corridors (if layer enabled)
      if (layers.routes && routes.length > 0) {
        routes.forEach((route) => {
          const pathCoords = route.path.map((p) => toLatLng(p));
          const line = L.polyline(pathCoords, {
            color: route.color || "#3b82f6",
            weight: 3.5,
            dashArray: route.dashed ? "6, 6" : undefined,
            opacity: 0.85,
          }).addTo(map);

          if (route.name) {
            line.bindTooltip(
              `<div class="text-xs font-sans"><b>${route.name}</b>${route.status ? ` · <span class="font-semibold">${route.status}</span>` : ""}</div>`,
              { sticky: true }
            );
          }
        });
      }

      // 5. Render Filtered Specific Markers (Food, Parking, Facilities, Places)
      markers.forEach((m) => {
        // Enforce strict category filter if specified
        if (filterCategory && m.category !== filterCategory) return;

        // Enforce dedicated layer visibility
        if (m.category === "food" && !layers.food) return;
        if (m.category === "parking" && !layers.parking) return;
        if (m.category === "facility" && !layers.facilities) return;
        if (m.category === "places" && !layers.places) return;
        if (m.category === "crowd" && !layers.crowd) return;

        const ptCoords = toLatLng(m.point);
        const isSelected = selectedId === m.id;

        // Specialized High-Definition Food Marker
        if (m.category === "food") {
          const isShortage = m.badge === "SHORTAGE";
          const badgeBg =
            m.badgeBg ||
            (m.badge === "SHORTAGE"
              ? "#ef4444"
              : m.badge === "HIGH DEMAND"
              ? "#ea580c"
              : m.badge === "LOW STOCK"
              ? "#f59e0b"
              : m.badge === "CLOSED"
              ? "#64748b"
              : "#10b981");

          const badgeTextColor = m.badge === "LOW STOCK" ? "#1c1917" : "#ffffff";

          const html = `
            <div class="cursor-pointer select-none transition-transform hover:scale-110 ${
              isSelected ? "scale-110 z-30" : "z-20"
            }" style="display:inline-block;">
              <div class="flex items-center gap-1.5 rounded-md px-2 py-0.5 shadow-md border font-sans ${
                isSelected
                  ? "bg-stone-900 text-white border-primary ring-2 ring-primary/60 font-bold"
                  : "bg-white/95 text-stone-900 border-stone-300 font-semibold"
              }" style="font-size: 10px; line-height: 1.1; white-space: nowrap;">
                <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background-color:${badgeBg}; ${
            isShortage ? "box-shadow: 0 0 8px #ef4444;" : ""
          }"></span>
                <span class="font-bold tracking-tight">${m.id}</span>
                <span style="background-color:${badgeBg}; color:${badgeTextColor}; border-radius:3px; padding:1px 4px; font-size:9px; font-weight:700; text-transform:uppercase;">
                  ${m.badge || "OPEN"}
                </span>
              </div>
            </div>
          `;

          const customIcon = L.divIcon({
            html,
            className: `food-marker-${m.id}`,
            iconSize: [110, 24],
            iconAnchor: [55, 12],
          });

          const marker = L.marker(ptCoords, { icon: customIcon }).addTo(map);

          if (m.label) {
            marker.bindTooltip(
              `<div class="text-xs font-sans p-1">
                <strong class="font-semibold">${m.label}</strong><br/>
                <span>Status: <b style="color:${badgeBg}">${m.badge || "OPEN"}</b></span><br/>
                ${m.details ? `<span class="text-muted-foreground">${m.details}</span><br/>` : ""}
                <span class="text-[10px] text-primary mt-1 block font-medium">Click to open Kitchen Intelligence Drawer</span>
              </div>`,
              { sticky: true }
            );
          }

          if (onMarkerClick) {
            marker.on("click", () => onMarkerClick(m.id));
          }
          return;
        }

        // Specialized High-Definition Parking Marker
        if (m.category === "parking") {
          const isCritical = m.badge === "NEAR CAPACITY" || m.badge === "FULL";
          const badgeBg =
            m.badgeBg ||
            (m.badge === "FULL"
              ? "#ef4444"
              : m.badge === "NEAR CAPACITY"
              ? "#f97316"
              : m.badge === "BUSY"
              ? "#3b82f6"
              : m.badge === "CLOSED"
              ? "#64748b"
              : "#10b981");

          const badgeTextColor = m.badge === "BUSY" ? "#ffffff" : "#ffffff";

          const html = `
            <div class="cursor-pointer select-none transition-transform hover:scale-110 ${
              isSelected ? "scale-110 z-30" : "z-20"
            }" style="display:inline-block;">
              <div class="flex items-center gap-1.5 rounded-md px-2 py-0.5 shadow-md border font-sans ${
                isSelected
                  ? "bg-stone-900 text-white border-primary ring-2 ring-primary/60 font-bold"
                  : "bg-white/95 text-stone-900 border-stone-300 font-semibold"
              }" style="font-size: 10px; line-height: 1.1; white-space: nowrap;">
                <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background-color:${badgeBg}; ${
            isCritical ? `box-shadow: 0 0 8px ${badgeBg};` : ""
          }"></span>
                <span class="font-bold tracking-tight">${m.id}</span>
                <span style="background-color:${badgeBg}; color:${badgeTextColor}; border-radius:3px; padding:1px 4px; font-size:9px; font-weight:700; text-transform:uppercase;">
                  ${m.badge || "AVAILABLE"}
                </span>
              </div>
            </div>
          `;

          const customIcon = L.divIcon({
            html,
            className: `parking-marker-${m.id}`,
            iconSize: [115, 24],
            iconAnchor: [57, 12],
          });

          const marker = L.marker(ptCoords, { icon: customIcon }).addTo(map);

          if (m.label) {
            marker.bindTooltip(
              `<div class="text-xs font-sans p-1">
                <strong class="font-semibold">${m.label} (${m.id})</strong><br/>
                <span>Operational Status: <b style="color:${badgeBg}">${m.badge || "AVAILABLE"}</b></span><br/>
                ${m.details ? `<span class="text-muted-foreground">${m.details}</span><br/>` : ""}
                <span class="text-[10px] text-primary mt-1 block font-medium">Click to inspect in Live Parking Drawer</span>
              </div>`,
              { sticky: true }
            );
          }

          if (onMarkerClick) {
            marker.on("click", () => onMarkerClick(m.id));
          }
          return;
        }

        // Specialized High-Definition Facility Marker
        if (m.category === "facility") {
          const isCritical = m.badge === "LONG QUEUE";
          const badgeBg =
            m.badgeBg ||
            (m.badge === "LONG QUEUE"
              ? "#ef4444"
              : m.badge === "BUSY"
              ? "#f59e0b"
              : m.badge === "OUT OF SERVICE"
              ? "#64748b"
              : m.badge === "UNKNOWN"
              ? "#8b5cf6"
              : "#10b981");

          const html = `
            <div class="cursor-pointer select-none transition-transform hover:scale-110 ${
              isSelected ? "scale-110 z-30" : "z-20"
            }" style="display:inline-block;">
              <div class="flex items-center gap-1.5 rounded-md px-2 py-0.5 shadow-md border font-sans ${
                isSelected
                  ? "bg-stone-900 text-white border-primary ring-2 ring-primary/60 font-bold"
                  : "bg-white/95 text-stone-900 border-stone-300 font-semibold"
              }" style="font-size: 10px; line-height: 1.1; white-space: nowrap;">
                <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background-color:${badgeBg}; ${
            isCritical ? `box-shadow: 0 0 8px ${badgeBg};` : ""
          }"></span>
                <span class="font-bold tracking-tight">${m.id}</span>
                <span style="background-color:${badgeBg}; color:#ffffff; border-radius:3px; padding:1px 4px; font-size:9px; font-weight:700; text-transform:uppercase;">
                  ${m.badge || "OPEN"}
                </span>
              </div>
            </div>
          `;

          const customIcon = L.divIcon({
            html,
            className: `facility-marker-${m.id}`,
            iconSize: [115, 24],
            iconAnchor: [57, 12],
          });

          const marker = L.marker(ptCoords, { icon: customIcon }).addTo(map);

          if (m.label) {
            marker.bindTooltip(
              `<div class="text-xs font-sans p-1">
                <strong class="font-semibold">${m.label} (${m.id})</strong><br/>
                <span>Operational State: <b style="color:${badgeBg}">${m.badge || "OPEN"}</b></span><br/>
                ${m.details ? `<span class="text-muted-foreground">${m.details}</span><br/>` : ""}
                <span class="text-[10px] text-primary mt-1 block font-medium">Click to inspect Facility Drawer</span>
              </div>`,
              { sticky: true }
            );
          }

          if (onMarkerClick) {
            marker.on("click", () => onMarkerClick(m.id));
          }
          return;
        }

        const radius = m.size === "lg" ? 8 : m.size === "md" ? 6 : 5;

        const circle = L.circleMarker(ptCoords, {
          radius,
          fillColor: m.color || "#2563eb",
          color: isSelected ? "#c75b12" : "#ffffff",
          weight: isSelected ? 3 : 2,
          fillOpacity: 0.9,
        }).addTo(map);

        if (m.label) {
          circle.bindTooltip(
            `<div class="text-xs font-sans"><b>${m.label}</b>${m.details ? `<br/><span class="text-muted-foreground">${m.details}</span>` : ""}</div>`,
            { sticky: true }
          );
        }

        if (onMarkerClick) {
          circle.on("click", () => onMarkerClick(m.id));
        }
      });

      leafletMapRef.current = map;
    });

    return () => {
      isMounted = false;
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, [mode, mapContainerId, geoFeatures, layers, zones, routes, markers, selectedId, movementActive]);

  const handleResetView = () => {
    if (leafletMapRef.current) {
      leafletMapRef.current.setView(center, zoom);
    }
  };

  const toggleMovement = () => {
    const next = !movementActive;
    if (onMovementModeChange) {
      onMovementModeChange(next);
    } else {
      setInternalMovement(next);
    }
  };

  return (
    <div className={cn("relative overflow-hidden rounded-xl border border-border/80 bg-card shadow-xs", className)} style={{ height }}>
      {/* Top Map Action Bar */}
      <div className="absolute top-2.5 right-2.5 z-20 flex flex-wrap items-center justify-end gap-2 max-w-[calc(100%-20px)]">
        {showLayerControls && (
          <MapLayerControl layers={layers} onChange={setLayers} allowedKeys={allowedLayers} />
        )}

        {/* Movement Mode Toggle Button (Only in Crowd Workspace) */}
        {showMovementControl && (
          <button
            type="button"
            onClick={toggleMovement}
            className={cn(
              "flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium shadow-md backdrop-blur-md transition-all select-none",
              movementActive
                ? "border-amber-500/80 bg-stone-900 text-amber-400 font-semibold ring-2 ring-amber-500/30"
                : "border-border/80 bg-card/95 text-muted-foreground hover:text-foreground"
            )}
            title="Toggle Directional Crowd Movement Flow Mode"
          >
            <Navigation className={cn("h-3.5 w-3.5", movementActive && "animate-pulse text-amber-400")} />
            <span>Movement Flow</span>
            {movementActive && (
              <span className="ml-1 rounded bg-amber-500/20 px-1 py-0.2 text-[9px] uppercase tracking-wider text-amber-300">
                Active
              </span>
            )}
          </button>
        )}

        {/* Mode & Reset Controls */}
        <div className="flex items-center rounded-lg border border-border/80 bg-card/95 p-1 shadow-md backdrop-blur-md">
          <button
            type="button"
            onClick={() => setMode("gis")}
            className={cn(
              "flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-all",
              mode === "gis" ? "bg-primary text-primary-foreground font-semibold" : "text-muted-foreground hover:text-foreground"
            )}
            title="OpenStreetMap GIS View"
          >
            <MapIcon className="h-3 w-3" />
            <span>GIS</span>
          </button>
          <button
            type="button"
            onClick={() => setMode("schematic")}
            className={cn(
              "flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-all",
              mode === "schematic" ? "bg-primary text-primary-foreground font-semibold" : "text-muted-foreground hover:text-foreground"
            )}
            title="Vector Schematic View"
          >
            <Layers className="h-3 w-3" />
            <span>Schematic</span>
          </button>
        </div>

        {mode === "gis" && (
          <button
            type="button"
            onClick={handleResetView}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/80 bg-card/95 text-muted-foreground shadow-md backdrop-blur-md hover:text-foreground transition-colors"
            title="Reset Map View"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Movement Mode Active Banner */}
      {showMovementControl && movementActive && (
        <div className="absolute top-2.5 left-12 z-20 flex items-center gap-1.5 rounded-md border border-amber-500/40 bg-stone-900/90 px-2.5 py-1 text-[11px] font-medium text-amber-300 shadow-md backdrop-blur-sm animate-in fade-in">
          <Activity className="h-3.5 w-3.5 text-amber-400 animate-spin" style={{ animationDuration: "3s" }} />
          <span>SIMULATED CROWD MOVEMENT DYNAMICS (DEMO)</span>
        </div>
      )}

      {/* GIS Leaflet Map Container */}
      {mode === "gis" && (
        <div id={mapContainerId} className="h-full w-full z-10" />
      )}

      {/* Vector Schematic Map View */}
      {mode === "schematic" && (
        <div className="h-full w-full relative">
          <svg viewBox="0 0 100 100" className="h-full w-full" preserveAspectRatio="xMidYMid meet">
            <defs>
              <pattern id="schematic-grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(0,0,0,0.04)" strokeWidth="0.2" />
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#schematic-grid)" />

            {/* River representation */}
            <path
              d="M 2 56 Q 18 47 34 51 Q 50 55 66 49 Q 82 43 98 47"
              fill="none"
              stroke="rgba(59, 130, 246, 0.4)"
              strokeWidth="3.2"
              strokeLinecap="round"
            />

            {/* Zone Polygons */}
            {layers.crowd &&
              zones.map((zone) => (
                <g key={zone.id}>
                  <polygon
                    points={zone.shape.map((p) => `${p.x},${p.y}`).join(" ")}
                    fill={crowdFill[zone.crowd] ?? "rgba(0,0,0,0.05)"}
                    stroke={selectedId === zone.id ? "#c75b12" : crowdStroke[zone.crowd] ?? "rgba(0,0,0,0.2)"}
                    strokeWidth={selectedId === zone.id ? "1.4" : "0.6"}
                    className={onZoneClick ? "cursor-pointer transition-all hover:opacity-85" : ""}
                    onClick={() => onZoneClick?.(zone.id)}
                  />
                  <text
                    x={zone.center.x}
                    y={zone.center.y}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize="2.8"
                    fontWeight="600"
                    fill="rgba(0,0,0,0.75)"
                    className="pointer-events-none select-none font-sans"
                  >
                    {zone.id}
                  </text>
                </g>
              ))}

            {/* Route lines */}
            {layers.routes &&
              routes.map((route, i) => (
                <polyline
                  key={i}
                  points={route.path.map((p) => `${p.x},${p.y}`).join(" ")}
                  fill="none"
                  stroke={route.color ?? "#94a3b8"}
                  strokeWidth="0.8"
                  strokeLinecap="round"
                  strokeDasharray={route.dashed ? "2 1.5" : undefined}
                />
              ))}

            {/* Movement Vectors in Schematic */}
            {movementActive &&
              DEMO_CROWD_VECTORS.map((vec, i) => {
                const fz = zones.find((z) => z.id === vec.from);
                const tz = zones.find((z) => z.id === vec.to);
                if (!fz || !tz) return null;
                return (
                  <line
                    key={i}
                    x1={fz.center.x}
                    y1={fz.center.y}
                    x2={tz.center.x}
                    y2={tz.center.y}
                    stroke="#f97316"
                    strokeWidth="0.9"
                    strokeDasharray="1.5 1"
                  />
                );
              })}

            {/* Markers */}
            {markers.map((m) => {
              if (filterCategory && m.category !== filterCategory) return null;
              if (m.category === "food" && !layers.food) return null;
              if (m.category === "parking" && !layers.parking) return null;
              if (m.category === "facility" && !layers.facilities) return null;
              if (m.category === "places" && !layers.places) return null;
              if (m.category === "crowd" && !layers.crowd) return null;

              const isSelected = selectedId === m.id;
              const r = m.size === "lg" ? 2.4 : m.size === "md" ? 1.8 : 1.3;
              return (
                <g
                  key={m.id}
                  className={onMarkerClick ? "cursor-pointer" : ""}
                  onClick={() => onMarkerClick?.(m.id)}
                >
                  <circle
                    cx={m.point.x}
                    cy={m.point.y}
                    r={r}
                    fill={m.color ?? "#c75b12"}
                    stroke={isSelected ? "#c75b12" : "white"}
                    strokeWidth={isSelected ? "0.6" : "0.35"}
                    className="transition-all hover:r-[2.6]"
                  />
                  {m.badge && (
                    <text
                      x={m.point.x}
                      y={m.point.y - 2.8}
                      textAnchor="middle"
                      fontSize="2"
                      fontWeight="700"
                      fill="#1c1917"
                      className="pointer-events-none select-none font-mono"
                    >
                      {m.id}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      )}

      {/* Embedded overlays / child panels */}
      {children}

      {/* Legend Badge */}
      {legend && (
        <div className="absolute bottom-2.5 left-2.5 z-20 rounded-md border border-border/80 bg-card/95 px-3 py-1.5 shadow-md backdrop-blur-md">
          {legend}
        </div>
      )}

      {/* Attribution footer */}
      <div className="absolute bottom-1.5 right-2 z-20 text-[10px] text-muted-foreground/60 select-none">
        {mode === "gis" ? "OpenStreetMap · Nashik Kumbh GIS" : "Godavari Basin Schematic · High Perf"}
      </div>
    </div>
  );
}

// Re-export MapLegend
interface MapLegendProps {
  items: { color: string; label: string }[];
}

export function MapLegend({ items }: MapLegendProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
      {items.map((item) => (
        <span key={item.label} className="flex items-center gap-1.5 text-muted-foreground">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
          <span>{item.label}</span>
        </span>
      ))}
    </div>
  );
}
