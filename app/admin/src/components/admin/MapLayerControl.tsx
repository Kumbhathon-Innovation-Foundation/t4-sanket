import { Layers, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MapLayersState {
  crowd: boolean;
  parking: boolean;
  food: boolean;
  facilities: boolean;
  routes: boolean;
  places?: boolean;
  gisNashik?: boolean;
}

interface MapLayerControlProps {
  layers: MapLayersState;
  onChange: (layers: MapLayersState) => void;
  className?: string | undefined;
  allowedKeys?: (keyof MapLayersState)[] | undefined;
}

export function MapLayerControl({ layers, onChange, className, allowedKeys }: MapLayerControlProps) {
  const toggle = (key: keyof MapLayersState) => {
    onChange({ ...layers, [key]: !layers[key] });
  };

  const layerConfig: { key: keyof MapLayersState; label: string; color: string }[] = [
    { key: "food", label: "Kitchens & Food Points", color: "#16a34a" },
    { key: "crowd", label: "Crowd Zones", color: "#c75b12" },
    { key: "routes", label: "Routes & Closures", color: "#ea580c" },
    { key: "parking", label: "Parking", color: "#2563eb" },
    { key: "facilities", label: "Facilities", color: "#9333ea" },
    { key: "places", label: "Places & Ghats", color: "#d97706" },
  ];

  const visibleConfig = allowedKeys
    ? layerConfig.filter((item) => allowedKeys.includes(item.key))
    : layerConfig;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-1.5 rounded-lg border border-border/80 bg-card/95 p-1.5 shadow-md backdrop-blur-md select-none",
        className
      )}
    >
      <div className="flex items-center gap-1 px-1.5 text-[11px] font-semibold text-muted-foreground">
        <Layers className="h-3 w-3" />
        <span>Layers:</span>
      </div>

      {visibleConfig.map((item) => {
        const active = !!layers[item.key];
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => toggle(item.key)}
            className={cn(
              "flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-all",
              active
                ? "bg-muted text-foreground font-semibold shadow-2xs"
                : "text-muted-foreground/80 hover:text-foreground hover:bg-muted/40"
            )}
          >
            <span
              className={cn(
                "h-2 w-2 rounded-full transition-opacity",
                active ? "opacity-100 ring-2 ring-background" : "opacity-40"
              )}
              style={{ backgroundColor: item.color }}
            />
            <span>{item.label}</span>
            {active && <Check className="h-2.5 w-2.5 text-primary ml-0.5" />}
          </button>
        );
      })}
    </div>
  );
}
