// Food & Kitchens Operations Control Room & Management Hub
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getKitchens,
  getShortages,
  getCrowdZones,
  getSeries,
  verifyShortage,
  closeKitchen,
} from "@/services";
import {
  PageHeader,
  MetricCard,
  MetricStrip,
  MapPanel,
  MapLegend,
  StatusBadge,
  SeverityBadge,
  FilterBar,
  SearchInput,
  SelectFilter,
  KitchenIntelligenceDrawer,
  UpdateStockModal,
  AddKitchenModal,
  DonateModal,
  EditKitchenModal,
  FlagShortageModal,
  LoadingState,
} from "@/components/admin";
import { Button } from "@/components/ui/button";
import { useState, useMemo, useEffect } from "react";
import {
  Utensils,
  AlertTriangle,
  ArrowRight,
  Plus,
  TrendingUp,
  Package,
  Clock,
  ShieldAlert,
  Flame,
  CheckCircle2,
  ChevronRight,
  Eye,
  RotateCcw,
  Sparkles,
  Heart,
  Calculator,
  Building2,
  Phone,
  User,
  MapPin,
  FileText,
  Layers,
  ArrowUpRight,
  SlidersHorizontal,
} from "lucide-react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";
import { toast } from "sonner";
import type { Kitchen, Shortage, Zone } from "@/types";

export const Route = createFileRoute("/admin/food/")({
  component: FoodKitchensPage,
});

function FoodKitchensPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  // Active Hub Tab
  const [activeTab, setActiveTab] = useState<"OPERATIONS" | "REGISTRY" | "FORECASTING" | "DONORS" | "SHORTAGES">("OPERATIONS");

  // Filters & search state
  const [search, setSearch] = useState("");
  const [zoneFilter, setZoneFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [shortageFilter, setShortageFilter] = useState<"ALL" | "DEFICIT_ONLY" | "SURPLUS_ONLY">("ALL");
  const [updatedFilter, setUpdatedFilter] = useState("ALL");

  // Selection & Modal state
  const [selectedKitchenId, setSelectedKitchenId] = useState<string | null>(null);
  const [focusedKitchenId, setFocusedKitchenId] = useState<string | undefined>(undefined);
  const [stockModalKitchen, setStockModalKitchen] = useState<Kitchen | null>(null);
  const [editModalKitchen, setEditModalKitchen] = useState<Kitchen | null>(null);
  const [donateModalData, setDonateModalData] = useState<{ shortage: Shortage; kitchen: Kitchen | null } | null>(null);
  const [flagShortageOpen, setFlagShortageOpen] = useState(false);
  const [addKitchenOpen, setAddKitchenOpen] = useState(false);

  // Freshness timer
  const [secondsAgo, setSecondsAgo] = useState(18);

  useEffect(() => {
    const t = setInterval(() => setSecondsAgo((prev) => prev + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // Data Queries
  const kitchensQuery = useQuery({ queryKey: ["kitchens"], queryFn: getKitchens });
  const shortagesQuery = useQuery({ queryKey: ["shortages"], queryFn: getShortages });
  const zonesQuery = useQuery({ queryKey: ["zones"], queryFn: getCrowdZones });
  const seriesQuery = useQuery({ queryKey: ["series"], queryFn: getSeries });

  // Shortage verification mutation
  const verifyMutation = useMutation({
    mutationFn: (id: string) => verifyShortage(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["shortages"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast.success("Shortage verified & priority logistics escalation activated.");
    },
  });

  // Close kitchen mutation
  const closeMutation = useMutation({
    mutationFn: (id: string) => closeKitchen(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["kitchens"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast.info("Kitchen facility marked as CLOSED.");
    },
  });

  const allKitchens = kitchensQuery.data ?? [];
  const allShortages = shortagesQuery.data ?? [];
  const allZones = zonesQuery.data ?? [];
  const foodSeries = seriesQuery.data?.food ?? [];

  // Operational aggregate metrics
  const activeKitchens = allKitchens.filter((k) => k.status !== "CLOSED").length;
  const totalMeals = allKitchens.reduce((a, k) => a + k.mealsAvailable, 0);
  const totalDemand = allKitchens.reduce((a, k) => a + k.estimatedDemand, 0);
  const totalCapacity = allKitchens.reduce((a, k) => a + (k.capacity || 4000), 0);
  const totalDeficit = allKitchens.reduce((a, k) => {
    const diff = k.estimatedDemand - k.mealsAvailable;
    return diff > 0 ? a + diff : a;
  }, 0);
  const criticalShortages = allShortages.filter(
    (s) => s.severity === "CRITICAL" && s.verification !== "FULFILLED"
  );
  const totalFundsPledged = allShortages.reduce((a, s) => a + (s.fundsRaised || 0), 0);

  // Filtered Kitchens
  const filteredKitchens = allKitchens.filter((k) => {
    if (search) {
      const q = search.toLowerCase();
      if (!k.name.toLowerCase().includes(q) && !k.id.toLowerCase().includes(q) && !k.operator.toLowerCase().includes(q)) {
        return false;
      }
    }
    if (zoneFilter !== "ALL" && k.zoneId !== zoneFilter) return false;
    if (statusFilter !== "ALL" && k.status !== statusFilter) return false;
    if (shortageFilter === "DEFICIT_ONLY" && k.mealsAvailable >= k.estimatedDemand) return false;
    if (shortageFilter === "SURPLUS_ONLY" && k.mealsAvailable < k.estimatedDemand) return false;
    if (updatedFilter === "UNDER_5" && k.updatedMinutesAgo > 5) return false;
    if (updatedFilter === "UNDER_15" && k.updatedMinutesAgo > 15) return false;
    if (updatedFilter === "OVER_30" && k.updatedMinutesAgo <= 30) return false;
    return true;
  });

  // Ranking for Critical Shortages: Rank by deficit, demand pressure, and crowd impact
  const rankedShortages = useMemo(() => {
    const list = allKitchens
      .filter((k) => k.mealsAvailable < k.estimatedDemand && k.status !== "CLOSED")
      .map((k) => {
        const def = k.estimatedDemand - k.mealsAvailable;
        const pressurePct = Math.round((k.mealsAvailable / k.estimatedDemand) * 100);
        const hostZone = allZones.find((z) => z.id === k.zoneId);
        const crowdSeverity = hostZone ? hostZone.crowd : "LOW";
        const matchingShortage = allShortages.find((s) => s.kitchenId === k.id);
        return {
          kitchen: k,
          zone: hostZone,
          deficit: def,
          coveragePct: pressurePct,
          crowdSeverity,
          shortageRecord: matchingShortage,
        };
      });

    return list.sort((a, b) => {
      const crowdScore = { PEAK: 4, HIGH: 3, MODERATE: 2, LOW: 1 };
      const scoreA = a.deficit + (crowdScore[a.crowdSeverity] || 1) * 200;
      const scoreB = b.deficit + (crowdScore[b.crowdSeverity] || 1) * 200;
      return scoreB - scoreA;
    });
  }, [allKitchens, allZones, allShortages]);

  // DONOR FEED: Sorted strictly by SEVERITY (not popularity), then deficit volume
  const severitySortedDonorFeed = useMemo(() => {
    const items = allShortages
      .filter((s) => s.verification !== "FULFILLED")
      .map((s) => {
        const k = allKitchens.find((item) => item.id === s.kitchenId);
        const z = allZones.find((item) => item.id === s.zoneId);
        const target = s.targetFunds || s.mealsRequired * (s.costPerMeal || 35);
        const raised = s.fundsRaised || 0;
        const fundedPct = Math.min(100, Math.round((raised / target) * 100));
        return {
          shortage: s,
          kitchen: k,
          zone: z,
          targetFunds: target,
          fundsRaised: raised,
          fundedPct,
        };
      });

    return items.sort((a, b) => {
      const severityOrder: Record<string, number> = { CRITICAL: 3, WARNING: 2, STABLE: 1, CLOSED: 0 };
      const sevDiff = (severityOrder[b.shortage.severity] || 1) - (severityOrder[a.shortage.severity] || 1);
      if (sevDiff !== 0) return sevDiff;
      return b.shortage.mealsRequired - a.shortage.mealsRequired;
    });
  }, [allShortages, allKitchens, allZones]);

  // ZONE-WISE DEMAND FORECASTING MATRIX
  const zoneForecastingMatrix = useMemo(() => {
    const consumptionFactor = 0.38; // standard Kumbh empirical consumption ratio
    return allZones.map((z) => {
      const projectedDemand = Math.round(z.pilgrims * consumptionFactor);
      const kitchensInZone = allKitchens.filter((k) => k.zoneId === z.id && k.status !== "CLOSED");
      const availableMeals = kitchensInZone.reduce((acc, k) => acc + k.mealsAvailable, 0);
      const totalCap = kitchensInZone.reduce((acc, k) => acc + (k.capacity || 4000), 0);
      const balance = availableMeals - projectedDemand;

      let recommendation = "Stock buffered. Normal distribution.";
      if (balance < -2000) {
        recommendation = `CRITICAL DEFICIT (-${Math.abs(balance).toLocaleString()} meals). Cross-zone buffer reallocation required immediately.`;
      } else if (balance < 0) {
        recommendation = `Low supply buffer. Transfer standby consignments from surplus sectors.`;
      } else if (balance > 1500) {
        recommendation = `Surplus buffer (+${balance.toLocaleString()} meals). Designated standby replenishment source.`;
      }

      return {
        zone: z,
        projectedDemand,
        kitchensCount: kitchensInZone.length,
        availableMeals,
        totalCapacity: totalCap,
        balance,
        recommendation,
      };
    });
  }, [allZones, allKitchens]);

  if (kitchensQuery.isLoading || shortagesQuery.isLoading) return <LoadingState />;

  // Selected kitchen for drawer
  const selectedKitchen = allKitchens.find((k) => k.id === selectedKitchenId) || null;
  const selectedKitchenZone = selectedKitchen
    ? allZones.find((z) => z.id === selectedKitchen.zoneId) || null
    : null;

  // Nearby kitchens for drawer
  const nearbyKitchens = selectedKitchen
    ? allKitchens.filter((k) => k.id !== selectedKitchen.id).slice(0, 3)
    : [];

  // Kitchen markers communicate: OPEN, LOW STOCK, HIGH DEMAND, SHORTAGE, CLOSED
  const getKitchenMarkerMeta = (k: Kitchen) => {
    if (k.status === "CLOSED") {
      return {
        badge: "CLOSED" as const,
        label: "Closed",
        color: "#64748b",
        badgeBg: "#64748b",
      };
    }
    const def = k.estimatedDemand - k.mealsAvailable;
    if (k.status === "CRITICAL" || def > 500) {
      return {
        badge: "SHORTAGE" as const,
        label: "Shortage",
        color: "#ef4444",
        badgeBg: "#ef4444",
      };
    }
    if (k.estimatedDemand >= 2100 && k.mealsAvailable < k.estimatedDemand * 1.05) {
      return {
        badge: "HIGH DEMAND" as const,
        label: "High Demand",
        color: "#ea580c",
        badgeBg: "#ea580c",
      };
    }
    if (k.status === "WARNING" || def > 0 || k.mealsAvailable < k.estimatedDemand * 1.15) {
      return {
        badge: "LOW STOCK" as const,
        label: "Low Stock",
        color: "#f59e0b",
        badgeBg: "#f59e0b",
      };
    }
    return {
      badge: "OPEN" as const,
      label: "Open",
      color: "#10b981",
      badgeBg: "#10b981",
    };
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-foreground font-sans">
              Food & Kitchens
            </h1>
            <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              OPERATIONS & REGISTRY HUB
            </span>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Monitor food availability, supply pressure, capacity registry, demand forecasting and donor sponsorships.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFlagShortageOpen(true)}
            className="text-xs gap-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/20"
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>Flag Ground Shortage</span>
          </Button>

          <Button
            size="sm"
            onClick={() => setAddKitchenOpen(true)}
            className="text-xs gap-1.5 bg-primary text-primary-foreground font-semibold"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Register & Pin Kitchen</span>
          </Button>

          <div className="flex items-center gap-2 rounded-lg border border-border/80 bg-card/90 px-3 py-1.5 text-xs shadow-2xs">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground font-mono text-[11px]">
              {secondsAgo < 60 ? `Updated ${secondsAgo}s ago` : `Updated ${Math.floor(secondsAgo / 60)}m ago`}
            </span>
            <button
              type="button"
              onClick={() => {
                setSecondsAgo(0);
                qc.invalidateQueries({ queryKey: ["kitchens"] });
                qc.invalidateQueries({ queryKey: ["shortages"] });
                toast.success("Food telemetry & registry refreshed");
              }}
              className="ml-1 text-primary hover:text-primary/80 transition-colors"
              title="Manual Telemetry Refresh"
            >
              <RotateCcw className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>

      {/* TOP OPERATIONAL STRIP */}
      <MetricStrip>
        <MetricCard
          label="Active Kitchens"
          value={`${activeKitchens} / ${allKitchens.length}`}
          icon={<Utensils className="h-4 w-4 text-primary" />}
          sublabel={`${totalCapacity.toLocaleString()} daily capacity`}
        />
        <MetricCard
          label="Meals Available"
          value={totalMeals.toLocaleString()}
          icon={<Package className="h-4 w-4 text-emerald-500" />}
          sublabel="Current aggregate inventory"
        />
        <MetricCard
          label="Estimated Demand"
          value={totalDemand.toLocaleString()}
          icon={<TrendingUp className="h-4 w-4 text-blue-500" />}
          sublabel="Projected hourly demand"
        />
        <MetricCard
          label="Current Deficit"
          value={totalDeficit > 0 ? `-${totalDeficit.toLocaleString()}` : "0"}
          icon={<AlertTriangle className="h-4 w-4 text-rose-500" />}
          sublabel={totalDeficit > 0 ? "Immediate supply needed" : "Demand fully buffered"}
          variant={totalDeficit > 500 ? "critical" : totalDeficit > 0 ? "warning" : "default"}
        />
        <MetricCard
          label="Critical Shortages"
          value={criticalShortages.length}
          icon={<ShieldAlert className="h-4 w-4 text-rose-600" />}
          sublabel={`₹${totalFundsPledged.toLocaleString()} pledged by donors`}
          variant={criticalShortages.length > 0 ? "critical" : "default"}
        />
      </MetricStrip>

      {/* WORKSPACE NAVIGATION TABS */}
      <div className="flex items-center gap-1.5 border-b border-border/80 pb-1 text-xs overflow-x-auto">
        {[
          { id: "OPERATIONS", label: "Operations & Live Map", icon: MapPin },
          { id: "REGISTRY", label: "Kitchen Registry & Capacities", icon: Building2 },
          { id: "FORECASTING", label: "Zone Demand Forecasting", icon: Calculator },
          { id: "DONORS", label: "Donor Feed (Severity Sorted)", icon: Heart },
          { id: "SHORTAGES", label: "Shortages & Ground Verification", icon: ShieldAlert },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 font-medium transition-all whitespace-nowrap ${
                isActive
                  ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
              {tab.id === "DONORS" && criticalShortages.length > 0 && (
                <span className="ml-1 rounded-full bg-rose-500 px-1.5 py-0.2 text-[10px] font-bold text-white">
                  {criticalShortages.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: OPERATIONS & LIVE MAP */}
      {activeTab === "OPERATIONS" && (
        <div className="space-y-5">
          <div className="grid gap-5 lg:grid-cols-12 items-start">
            {/* Dominant Food Geographic Map (8 columns / 68%) */}
            <div className="lg:col-span-8 space-y-2">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Food Operations Map · Dedicated Kitchen GIS
                  </span>
                  <span className="text-[10px] rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-mono px-1.5 py-0.2 font-semibold">
                    Food Locations Only
                  </span>
                </div>

                {selectedKitchen && (
                  <span className="text-xs font-semibold text-primary">
                    Selected: {selectedKitchen.name} ({selectedKitchen.id})
                  </span>
                )}
              </div>

              {/* Map shows ONLY food locations in accordance with user requirement */}
              <MapPanel
                filterCategory="food"
                showMovementControl={false}
                allowedLayers={["food", "crowd", "parking", "facilities"]}
                markers={allKitchens.map((k) => {
                  const meta = getKitchenMarkerMeta(k);
                  const def = k.estimatedDemand - k.mealsAvailable;
                  return {
                    id: k.id,
                    point: k.point,
                    label: `${k.name} (${k.id})`,
                    details:
                      def > 0
                        ? `Deficit: -${def.toLocaleString()} meals · Demand: ${k.estimatedDemand.toLocaleString()}`
                        : `Available: ${k.mealsAvailable.toLocaleString()} meals · Capacity: ${(k.capacity || 4000).toLocaleString()} · ${k.operator}`,
                    color: meta.color,
                    badge: meta.badge,
                    badgeBg: meta.badgeBg,
                    category: "food" as const,
                    size: (k.id === selectedKitchenId ? "lg" : "md") as "lg" | "md",
                  };
                })}
                selectedId={selectedKitchenId || undefined}
                onMarkerClick={(id) => {
                  setSelectedKitchenId(id);
                  setFocusedKitchenId(id);
                }}
                height="540px"
                initialLayers={{
                  food: true,
                  crowd: false,
                  routes: false,
                  parking: false,
                  facilities: false,
                  places: false,
                }}
                legend={
                  <MapLegend
                    items={[
                      { color: "#10b981", label: "Open / Normal" },
                      { color: "#f59e0b", label: "Low Stock" },
                      { color: "#ea580c", label: "High Demand" },
                      { color: "#ef4444", label: "Shortage Deficit" },
                      { color: "#64748b", label: "Closed" },
                    ]}
                  />
                }
              />
            </div>

            {/* SHORTAGE PRIORITY PANEL (4 columns / 32%) */}
            <div className="lg:col-span-4 space-y-3">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-1.5">
                  <Flame className="h-4 w-4 text-rose-600" />
                  <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                    Critical Food Shortages
                  </span>
                </div>
                <span className="text-[10px] text-muted-foreground font-mono">Ranked by Deficit & Crowd</span>
              </div>

              <div className="space-y-2.5">
                {rankedShortages.length > 0 ? (
                  rankedShortages.map((item, idx) => {
                    const k = item.kitchen;
                    const isSelected = selectedKitchenId === k.id;
                    return (
                      <div
                        key={k.id}
                        onClick={() => {
                          setSelectedKitchenId(k.id);
                          setFocusedKitchenId(k.id);
                        }}
                        className={`cursor-pointer rounded-xl border p-3.5 transition-all hover:shadow-md select-none ${
                          isSelected
                            ? "border-primary bg-primary/5 ring-2 ring-primary/40"
                            : item.deficit > 500
                            ? "border-rose-300 bg-rose-50/40 dark:bg-rose-950/20 hover:border-rose-400"
                            : "border-amber-300 bg-amber-50/40 dark:bg-amber-950/20 hover:border-amber-400"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-stone-900 text-white font-mono text-[10px] font-bold">
                              0{idx + 1}
                            </span>
                            <div>
                              <h4 className="text-xs font-bold text-foreground">{k.id} · {k.name}</h4>
                              <p className="text-[11px] text-muted-foreground">{k.operator}</p>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="inline-block rounded px-1.5 py-0.5 text-[10px] font-bold uppercase bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                              -{item.deficit} MEALS
                            </span>
                            <span className="block mt-0.5 font-mono text-[11px] text-muted-foreground font-semibold">
                              {item.coveragePct}% coverage
                            </span>
                          </div>
                        </div>

                        <div className="mt-2.5 flex items-center justify-between border-t border-border/50 pt-2 text-[11px]">
                          <span className="text-muted-foreground flex items-center gap-1">
                            Host: <b className="text-foreground">{k.zoneId}</b> ({item.crowdSeverity} crowd)
                          </span>
                          <span className="text-primary font-semibold flex items-center gap-0.5 hover:underline">
                            Inspect <ChevronRight className="h-3 w-3" />
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="rounded-xl border border-dashed border-border bg-muted/20 p-6 text-center text-xs text-muted-foreground">
                    <CheckCircle2 className="h-6 w-6 text-emerald-500 mx-auto mb-1.5" />
                    No active kitchen shortages detected. All facilities adequately supplied.
                  </div>
                )}
              </div>

              {/* Quick Action Box */}
              <div className="rounded-xl border border-border/80 bg-muted/30 p-3.5 text-xs space-y-2">
                <span className="text-[11px] font-semibold text-foreground uppercase tracking-wider block">
                  Logistics Dispatch Actions
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-[11px] h-8 gap-1"
                    onClick={() => {
                      const target = allKitchens.find((k) => k.id === "K12") || allKitchens[0];
                      if (target) setStockModalKitchen(target);
                    }}
                  >
                    <Package className="h-3 w-3 text-primary" /> Stock K12
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-[11px] h-8 gap-1 text-rose-600 hover:text-rose-700"
                    onClick={() =>
                      navigate({
                        to: "/admin/alerts/create",
                        search: { zoneId: "Z07", severity: "CRITICAL", title: "Meal Deficit Alert: Kitchen K12" },
                      })
                    }
                  >
                    <ShieldAlert className="h-3 w-3" /> Broadcast Alert
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* SUPPLY VS DEMAND PROGRESSION CHART */}
          {foodSeries.length > 0 && (
            <div className="rounded-xl border border-border/80 bg-card p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Supply vs Projected Demand Progression</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Hourly aggregate annakshetra preparation volume vs footfall demand curves across Godavari Basin
                  </p>
                </div>
                <span className="rounded bg-muted px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
                  Basin Aggregate
                </span>
              </div>

              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={foodSeries}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                    <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                    <Tooltip
                      contentStyle={{
                        fontSize: 12,
                        borderRadius: 8,
                        border: "1px solid #e2e8f0",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                      }}
                      formatter={(val: any, name: any) => [
                        `${Number(val).toLocaleString()} meals`,
                        name === "value" ? "Demand" : "Supply Available",
                      ]}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
                      formatter={(val: any) => (val === "value" ? "Projected Demand" : "Meals Available (Supply)")}
                    />
                    <Bar dataKey="value" name="value" fill="#c75b12" opacity={0.35} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="secondary" name="secondary" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: KITCHEN REGISTRY & CAPACITIES */}
      {activeTab === "REGISTRY" && (
        <div className="rounded-xl border border-border/80 bg-card shadow-xs overflow-hidden">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/80 px-5 py-3.5 bg-muted/20">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Annakshetra Registry & Facility Directory</h3>
              <p className="text-xs text-muted-foreground">
                Official directory with preparation capacities, operator trust details, and emergency coordinator contacts
              </p>
            </div>

            <Button
              size="sm"
              onClick={() => setAddKitchenOpen(true)}
              className="text-xs gap-1.5 bg-primary text-primary-foreground font-semibold"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Register New Annakshetra</span>
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border/80 bg-muted/40 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3">Kitchen</th>
                  <th className="px-4 py-3">Zone</th>
                  <th className="px-4 py-3">Operator Trust</th>
                  <th className="px-4 py-3">Daily Capacity</th>
                  <th className="px-4 py-3">Available</th>
                  <th className="px-4 py-3">Coordinator Contact</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {allKitchens.map((k) => (
                  <tr key={k.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3 font-semibold text-foreground">
                      <div className="flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded bg-emerald-500/10 text-emerald-600 font-mono text-[10px] font-bold">
                          {k.id}
                        </span>
                        <span>{k.name}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3 font-mono font-semibold text-muted-foreground">
                      {k.zoneId}
                    </td>

                    <td className="px-4 py-3 text-muted-foreground font-medium">
                      {k.operator}
                    </td>

                    <td className="px-4 py-3 font-mono font-bold text-foreground">
                      {(k.capacity || 4000).toLocaleString()} <span className="text-[10px] font-normal text-muted-foreground">meals/day</span>
                    </td>

                    <td className="px-4 py-3 font-mono font-semibold text-foreground">
                      {k.mealsAvailable.toLocaleString()}
                    </td>

                    <td className="px-4 py-3 text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <User className="h-3 w-3 text-primary" />
                        <span className="font-medium text-foreground">{k.contactPerson || "Field Coord"}</span>
                      </div>
                      <span className="text-[10px] font-mono text-muted-foreground block pl-4">
                        {k.contactPhone || "+91 98230 00000"}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <StatusBadge value={k.status} kind="status" />
                    </td>

                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-[11px] gap-1"
                          onClick={() => {
                            setSelectedKitchenId(k.id);
                            setFocusedKitchenId(k.id);
                          }}
                        >
                          <Eye className="h-3 w-3" /> Inspect
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 px-2 text-[11px] gap-1"
                          onClick={() => setEditModalKitchen(k)}
                        >
                          <Building2 className="h-3 w-3 text-primary" /> Edit
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: ZONE-WISE DEMAND FORECASTING MATRIX */}
      {activeTab === "FORECASTING" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-border/80 bg-card p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Calculator className="h-4 w-4 text-primary" />
                  Zone-Wise Demand Forecasting Engine
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Real-time mathematical model calculating meal demand: <code className="font-mono text-primary font-bold">Demand = Zone Footfall × 0.38 meals/person/hr</code>
                </p>
              </div>

              <span className="rounded bg-primary/10 text-primary font-mono text-xs px-2.5 py-1 font-semibold">
                Formula: Footfall × 0.38
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-border/80 bg-muted/40 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Sector</th>
                    <th className="px-4 py-3">Active Pilgrims (Footfall)</th>
                    <th className="px-4 py-3">Hourly Projected Demand</th>
                    <th className="px-4 py-3">Kitchens</th>
                    <th className="px-4 py-3">Current Meals Available</th>
                    <th className="px-4 py-3">Net Balance</th>
                    <th className="px-5 py-3">Operational Reallocation Advice</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {zoneForecastingMatrix.map((item) => {
                    const isDeficit = item.balance < 0;
                    return (
                      <tr key={item.zone.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-foreground">{item.zone.id}</div>
                          <div className="text-[10px] text-muted-foreground">{item.zone.name}</div>
                        </td>

                        <td className="px-4 py-3 font-mono font-bold text-foreground">
                          {item.zone.pilgrims.toLocaleString()}
                        </td>

                        <td className="px-4 py-3 font-mono font-semibold text-foreground">
                          {item.projectedDemand.toLocaleString()} <span className="text-[10px] text-muted-foreground">meals/hr</span>
                        </td>

                        <td className="px-4 py-3 font-mono">
                          {item.kitchensCount} facilities
                        </td>

                        <td className="px-4 py-3 font-mono font-bold text-emerald-600">
                          {item.availableMeals.toLocaleString()}
                        </td>

                        <td className="px-4 py-3 font-mono font-bold">
                          {isDeficit ? (
                            <span className="text-rose-600 dark:text-rose-400">
                              -{Math.abs(item.balance).toLocaleString()} meals
                            </span>
                          ) : (
                            <span className="text-emerald-600">
                              +{item.balance.toLocaleString()} buffer
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-3">
                          <span
                            className={`inline-block rounded px-2 py-0.5 text-[11px] leading-relaxed ${
                              item.balance < -2000
                                ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-semibold"
                                : item.balance < 0
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-medium"
                                : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            }`}
                          >
                            {item.recommendation}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: DONOR FEED (SORTED STRICTLY BY SEVERITY, NOT POPULARITY) */}
      {activeTab === "DONORS" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-border/80 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-rose-600 fill-rose-500/20" />
                <h3 className="text-sm font-semibold text-foreground">
                  Direct-to-Shortage Philanthropic Donor Feed
                </h3>
                <span className="rounded-full bg-rose-500/10 text-rose-700 dark:text-rose-300 font-mono text-[10px] px-2 py-0.2 font-bold uppercase">
                  Strictly Ranked by Need Severity
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Critical deficits prioritized ahead of popular shrines. Donors sponsor verified emergency meal shortfalls directly.
              </p>
            </div>

            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3 py-1.5 text-xs text-right">
              <span className="text-[10px] text-muted-foreground block font-medium">Total Pledged Contributions</span>
              <span className="font-mono text-base font-bold text-emerald-600">₹{totalFundsPledged.toLocaleString()}</span>
            </div>
          </div>

          <div className="grid gap-3.5 md:grid-cols-2">
            {severitySortedDonorFeed.map((item) => {
              const s = item.shortage;
              const k = item.kitchen;
              return (
                <div
                  key={s.id}
                  className={`rounded-xl border p-4.5 space-y-3 transition-all ${
                    s.severity === "CRITICAL"
                      ? "border-rose-300 bg-rose-50/30 dark:bg-rose-950/20 shadow-xs"
                      : "border-border/80 bg-card"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-xs">{s.id}</span>
                        <SeverityBadge severity={s.severity} />
                        <span className="rounded bg-muted px-1.5 py-0.2 text-[10px] font-mono text-muted-foreground">
                          Zone {s.zoneId}
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-foreground mt-1">{k?.name || `Kitchen ${s.kitchenId}`}</h4>
                      <p className="text-xs text-muted-foreground">{k?.operator}</p>
                    </div>

                    <div className="text-right">
                      <span className="text-rose-600 font-mono font-bold text-sm block">
                        -{s.mealsRequired.toLocaleString()} MEALS
                      </span>
                      <span className="text-[11px] text-muted-foreground font-mono">
                        Target: ₹{item.targetFunds.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Verification Note */}
                  <div className="rounded-md border border-border/70 bg-background/80 p-2.5 text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground block text-[11px] mb-0.5">
                      Ground Verification ({s.verifiedBy || "Field Coord"}):
                    </span>
                    <p className="italic text-[11px] leading-relaxed">
                      "{s.verificationNotes || "Physical deficit confirmed; immediate ration replenishment requested."}"
                    </p>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-mono">
                      <span className="text-muted-foreground">Funded Progress: ₹{item.fundsRaised.toLocaleString()}</span>
                      <span className="font-bold text-foreground">{item.fundedPct}% Met</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full bg-emerald-500 transition-all duration-500"
                        style={{ width: `${item.fundedPct}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-border/60 pt-2.5">
                    <span className="text-[11px] text-muted-foreground">Unit Cost: ₹{s.costPerMeal || 35} / meal</span>
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs gap-1.5 h-8"
                      onClick={() => setDonateModalData({ shortage: s, kitchen: k || null })}
                    >
                      <Heart className="h-3.5 w-3.5 fill-white" />
                      <span>Sponsor Meals</span>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 5: SHORTAGES & GROUND VERIFICATION */}
      {activeTab === "SHORTAGES" && (
        <div className="rounded-xl border border-border/80 bg-card shadow-xs overflow-hidden">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/80 px-5 py-3.5 bg-muted/20">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Ground Shortage Reports & Volunteer Verification</h3>
              <p className="text-xs text-muted-foreground">
                Triage queue of reported deficits with volunteer reporter observations and priority verification
              </p>
            </div>

            <Button
              size="sm"
              onClick={() => setFlagShortageOpen(true)}
              className="text-xs gap-1.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold"
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>Flag Ground Shortage</span>
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border/80 bg-muted/40 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3">Report ID</th>
                  <th className="px-4 py-3">Kitchen / Sector</th>
                  <th className="px-4 py-3">Shortfall (Meals)</th>
                  <th className="px-4 py-3">Severity</th>
                  <th className="px-4 py-3">Verification</th>
                  <th className="px-4 py-3">Ground Observation Notes</th>
                  <th className="px-4 py-3">Reported</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {allShortages.map((s) => {
                  const k = allKitchens.find((item) => item.id === s.kitchenId);
                  return (
                    <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-3 font-mono font-bold text-foreground">
                        {s.id}
                      </td>

                      <td className="px-4 py-3">
                        <span className="font-semibold text-foreground">{k?.name || s.kitchenId}</span>
                        <span className="text-muted-foreground block text-[10px] font-mono">Zone {s.zoneId}</span>
                      </td>

                      <td className="px-4 py-3 font-mono font-bold text-rose-600">
                        -{s.mealsRequired.toLocaleString()}
                      </td>

                      <td className="px-4 py-3">
                        <SeverityBadge severity={s.severity} />
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                            s.verification === "VERIFIED"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                              : s.verification === "FULFILLED"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                              : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                          }`}
                        >
                          {s.verification}
                        </span>
                      </td>

                      <td className="px-4 py-3 max-w-xs text-muted-foreground">
                        <span className="font-semibold text-foreground text-[11px] block">{s.verifiedBy || "Volunteer"}</span>
                        <span className="text-[11px] line-clamp-1 italic">{s.verificationNotes || "Deficit noted by field team."}</span>
                      </td>

                      <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">
                        {s.reportedMinutesAgo}m ago
                      </td>

                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {s.verification === "PENDING" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-[11px] border-amber-400 bg-amber-50/50 hover:bg-amber-100 text-amber-900"
                              onClick={() => verifyMutation.mutate(s.id)}
                            >
                              <CheckCircle2 className="h-3 w-3 mr-1" /> Verify
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-[11px] text-emerald-600 hover:text-emerald-700"
                            onClick={() => setDonateModalData({ shortage: s, kitchen: k || null })}
                          >
                            <Heart className="h-3 w-3 mr-1" /> Sponsor
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECONDARY FOOD TABLE (Shared across operations) */}
      {activeTab === "OPERATIONS" && (
        <div className="rounded-xl border border-border/80 bg-card shadow-xs overflow-hidden">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/80 px-5 py-3.5 bg-muted/20">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-foreground">Annakshetra & Kitchen Roster</h3>
              <span className="rounded bg-muted px-2 py-0.5 text-[10px] font-mono text-muted-foreground">
                {filteredKitchens.length} Facilities
              </span>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-wrap items-center gap-2">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Search kitchen or operator..."
                className="w-48 h-8 text-xs"
              />

              <SelectFilter
                value={zoneFilter}
                onChange={setZoneFilter}
                options={[
                  { value: "ALL", label: "All Sectors" },
                  ...allZones.map((z) => ({ value: z.id, label: `${z.id} — ${z.name}` })),
                ]}
              />

              <SelectFilter
                value={statusFilter}
                onChange={setStatusFilter}
                options={[
                  { value: "ALL", label: "All Statuses" },
                  { value: "STABLE", label: "Stable / Open" },
                  { value: "WARNING", label: "Warning (Low Stock)" },
                  { value: "CRITICAL", label: "Critical Shortage" },
                  { value: "CLOSED", label: "Closed" },
                ]}
              />

              <SelectFilter
                value={shortageFilter}
                onChange={(val) => setShortageFilter(val as any)}
                options={[
                  { value: "ALL", label: "All Balances" },
                  { value: "DEFICIT_ONLY", label: "Deficit Only" },
                  { value: "SURPLUS_ONLY", label: "Surplus Only" },
                ]}
              />

              <SelectFilter
                value={updatedFilter}
                onChange={setUpdatedFilter}
                options={[
                  { value: "ALL", label: "All Telemetry" },
                  { value: "UNDER_5", label: "Updated < 5m ago" },
                  { value: "UNDER_15", label: "Updated < 15m ago" },
                  { value: "OVER_30", label: "Stale (> 30m ago)" },
                ]}
              />

              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch("");
                  setZoneFilter("ALL");
                  setStatusFilter("ALL");
                  setShortageFilter("ALL");
                  setUpdatedFilter("ALL");
                }}
                className="h-8 text-xs text-muted-foreground hover:text-foreground"
              >
                Reset
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border/80 bg-muted/40 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3">Kitchen</th>
                  <th className="px-4 py-3">Zone</th>
                  <th className="px-4 py-3">Available</th>
                  <th className="px-4 py-3">Demand</th>
                  <th className="px-4 py-3">Deficit</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Updated</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredKitchens.map((k) => {
                  const def = k.estimatedDemand - k.mealsAvailable;
                  const isSelected = selectedKitchenId === k.id;
                  return (
                    <tr
                      key={k.id}
                      onClick={() => {
                        setSelectedKitchenId(k.id);
                        setFocusedKitchenId(k.id);
                      }}
                      className={`cursor-pointer transition-colors hover:bg-muted/30 ${
                        isSelected ? "bg-primary/5 font-medium" : ""
                      }`}
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <span className="flex h-5 w-5 items-center justify-center rounded bg-emerald-500/10 text-emerald-600 font-mono text-[10px] font-bold">
                            {k.id}
                          </span>
                          <div>
                            <span className="font-semibold text-foreground">{k.name}</span>
                            <span className="text-muted-foreground block text-[10px]">{k.operator}</span>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3 font-mono font-semibold text-muted-foreground">
                        {k.zoneId}
                      </td>

                      <td className="px-4 py-3 font-mono font-bold text-foreground">
                        {k.mealsAvailable.toLocaleString()}
                      </td>

                      <td className="px-4 py-3 font-mono text-muted-foreground">
                        {k.estimatedDemand.toLocaleString()}
                      </td>

                      <td className="px-4 py-3 font-mono">
                        {def > 0 ? (
                          <span className="font-bold text-rose-600 dark:text-rose-400">
                            -{def.toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-emerald-600 font-medium">Surplus (+{Math.abs(def).toLocaleString()})</span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <StatusBadge value={k.status} kind="status" />
                      </td>

                      <td className="px-4 py-3 text-muted-foreground font-mono text-[11px]">
                        {k.updatedMinutesAgo === 0 ? "42s ago" : `${k.updatedMinutesAgo}m ago`}
                      </td>

                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-[11px] gap-1"
                            onClick={() => {
                              setSelectedKitchenId(k.id);
                              setFocusedKitchenId(k.id);
                            }}
                          >
                            <Eye className="h-3 w-3" /> Inspect
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-2 text-[11px] gap-1"
                            onClick={() => setStockModalKitchen(k)}
                          >
                            <Package className="h-3 w-3 text-primary" /> Stock
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Kitchen Intelligence Drawer */}
      <KitchenIntelligenceDrawer
        kitchen={selectedKitchen}
        zone={selectedKitchenZone}
        shortages={allShortages}
        nearbyKitchens={nearbyKitchens}
        isOpen={!!selectedKitchenId}
        onClose={() => setSelectedKitchenId(null)}
        onUpdateStock={(k) => setStockModalKitchen(k)}
        onVerifyShortage={(shortageId) => verifyMutation.mutate(shortageId)}
        onCreateAlert={(k, z) =>
          navigate({
            to: "/admin/alerts/create",
            search: {
              zoneId: k.zoneId,
              severity: k.status === "CRITICAL" ? "CRITICAL" : "WARNING",
              title: `Meal Supply Shortage at ${k.id} (${k.name})`,
            },
          })
        }
        onCloseKitchen={(k) => closeMutation.mutate(k.id)}
        onViewDetail={(kId) => navigate({ to: "/admin/food/$kitchenId", params: { kitchenId: kId } })}
        onDonate={(shortage, k) => setDonateModalData({ shortage, kitchen: k })}
      />

      {/* Update Stock Modal */}
      <UpdateStockModal
        kitchen={stockModalKitchen}
        isOpen={!!stockModalKitchen}
        onClose={() => setStockModalKitchen(null)}
      />

      {/* Add Kitchen Modal with Map Pinning */}
      <AddKitchenModal
        isOpen={addKitchenOpen}
        onClose={() => setAddKitchenOpen(false)}
        zones={allZones}
        onKitchenCreated={(newKitchen) => {
          setSelectedKitchenId(newKitchen.id);
          setFocusedKitchenId(newKitchen.id);
          setActiveTab("OPERATIONS");
        }}
      />

      {/* Edit Kitchen Registry Modal */}
      <EditKitchenModal
        kitchen={editModalKitchen}
        zones={allZones}
        isOpen={!!editModalKitchen}
        onClose={() => setEditModalKitchen(null)}
      />

      {/* Direct-to-Shortage Donate Modal */}
      <DonateModal
        shortage={donateModalData?.shortage || null}
        kitchen={donateModalData?.kitchen || null}
        isOpen={!!donateModalData}
        onClose={() => setDonateModalData(null)}
      />

      {/* Flag Ground Shortage Modal */}
      <FlagShortageModal
        kitchens={allKitchens}
        zones={allZones}
        isOpen={flagShortageOpen}
        onClose={() => setFlagShortageOpen(false)}
      />
    </div>
  );
}
