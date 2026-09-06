// Guidance Engine Hub — 5-Tab Unified Guidance Control
// Tabs: Active Guidance | Automated Guidance | Rules & Thresholds | Verified Advisories | Overrides
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getActiveGuidanceBoard,
  getAllAutomatedGuidance,
  getGuidanceRules,
  getAlerts,
  getAllOverrides,
  dismissGuidance,
  promoteGuidanceToAdvisory,
  toggleGuidanceRule,
  removeGuidanceOverride,
  addGuidanceOverride,
  simulateRouteDecision,
  updateGuidanceRule,
} from "@/services";
import { PageHeader, MetricCard, MetricStrip, LoadingState } from "@/components/admin";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import {
  Zap,
  Bot,
  SlidersHorizontal,
  ShieldCheck,
  ShieldOff,
  CheckCircle2,
  XCircle,
  ArrowUpCircle,
  AlertTriangle,
  Activity,
  Eye,
  Ban,
  Play,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import type {
  AutomatedGuidance,
  GuidanceOverride,
  GuidanceRule,
  OpsAlert,
  ResolvedGuidance,
  DecisionTrace,
  GuidanceTier,
} from "@/types";

export const Route = createFileRoute("/admin/guidance/")(
  {
    component: GuidanceEnginePage,
  }
);

type TabId = "active" | "automated" | "rules" | "advisories" | "overrides";

const TAB_DEFS: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "active", label: "Active Guidance", icon: Activity },
  { id: "automated", label: "Automated Guidance", icon: Bot },
  { id: "rules", label: "Rules & Thresholds", icon: SlidersHorizontal },
  { id: "advisories", label: "Verified Advisories", icon: ShieldCheck },
  { id: "overrides", label: "Overrides", icon: ShieldOff },
];

/* ========================================================================== */
/*  TIER BADGES                                                                */
/* ========================================================================== */

function TierBadge({ tier }: { tier: GuidanceTier }) {
  if (tier === "VERIFIED")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/15 px-2 py-0.5 text-[10px] font-bold text-blue-400 border border-blue-500/30">
        🔵 Verified Advisory
      </span>
    );
  if (tier === "OVERRIDE")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 px-2 py-0.5 text-[10px] font-bold text-rose-400 border border-rose-500/30">
        🔴 Active Override
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-500/30">
      🟡 Automated Guidance
    </span>
  );
}

/* ========================================================================== */
/*  TAB 1: ACTIVE GUIDANCE — Unified Real-Time Board                          */
/* ========================================================================== */

function ActiveGuidanceTab() {
  const qc = useQueryClient();
  const boardQuery = useQuery({
    queryKey: ["guidance", "board"],
    queryFn: getActiveGuidanceBoard,
    refetchInterval: 10000,
  });

  const [decisionResult, setDecisionResult] = useState<ResolvedGuidance | null>(null);
  const [simulating, setSimulating] = useState(false);

  const runSimulation = async () => {
    setSimulating(true);
    try {
      const result = await simulateRouteDecision();
      setDecisionResult(result);
      toast.success("Decision Engine simulation complete");
    } catch (e) {
      toast.error("Simulation failed");
    }
    setSimulating(false);
  };

  if (boardQuery.isLoading) return <LoadingState />;
  const board = boardQuery.data;
  if (!board) return <div className="text-muted-foreground p-4">No guidance data available.</div>;

  const isR18Overridden = board.overrides.some(
    (o) => (o.entityId === "R18" || o.entityId === "R02" || o.code === "OVR_STAGE_VIP") && o.active
  );

  const toggleStageOverride = async () => {
    if (isR18Overridden) {
      const targets = board.overrides.filter(
        (o) => (o.entityId === "R18" || o.entityId === "R02" || o.code === "OVR_STAGE_VIP") && o.active
      );
      for (const target of targets) {
        await removeGuidanceOverride(target.id);
      }
      qc.invalidateQueries({ queryKey: ["guidance"] });
      toast.success("Police override cleared: Route R18 reopened ✅");
    } else {
      await addGuidanceOverride({
        id: "OVR-R18-VIP",
        code: "OVR_STAGE_VIP",
        entityType: "ROUTE",
        entityId: "R18",
        overrideType: "FORCE_CLOSE",
        reason: "VIP Procession underway. Route R18 restricted per Police SP Vikram Patil.",
        authorizedBy: "SP Vikram Patil",
        authorityRole: "Superintendent of Police, Nashik",
        active: true,
      });
      await addGuidanceOverride({
        id: "OVR-R02-VIP",
        code: "OVR_STAGE_VIP_R02",
        entityType: "ROUTE",
        entityId: "R02",
        overrideType: "FORCE_CLOSE",
        reason: "VIP Procession underway. Route R02 restricted per Police SP Vikram Patil.",
        authorizedBy: "SP Vikram Patil",
        authorityRole: "Superintendent of Police, Nashik",
        active: true,
      });
      qc.invalidateQueries({ queryKey: ["guidance"] });
      toast.error("🚨 Tactical Override Activated: Route R18 FORCE-CLOSED by SP Vikram Patil");
    }
  };

  return (
    <div className="space-y-5">
      {/* 🔴 STAGE DEMO CONTROLLER HERO BANNER */}
      <div className="rounded-xl border border-violet-500/30 bg-gradient-to-r from-violet-950/40 via-background to-card p-4 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-violet-400 animate-ping" />
            <span className="text-[12px] font-bold uppercase tracking-wider text-violet-300">
              Live Stage Demonstration Controller
            </span>
            <Badge variant="outline" className="text-[10px] border-violet-400/40 text-violet-300">
              STAGE HERO
            </Badge>
          </div>
          <p className="text-[11px] text-muted-foreground max-w-xl leading-relaxed">
            Click the button below during the pitch to trigger an immediate tactical override on Route R18. Watch ANUBHAV AI instantly divert pilgrims to Route R21 in real time!
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Button
            size="sm"
            onClick={toggleStageOverride}
            className={`gap-2 font-semibold transition-all duration-300 shadow-md ${
              isR18Overridden
                ? "bg-emerald-600 hover:bg-emerald-700 text-white animate-pulse"
                : "bg-rose-600 hover:bg-rose-700 text-white"
            }`}
          >
            {isR18Overridden ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                <span>🟢 Override Active (Click to Reopen R18)</span>
              </>
            ) : (
              <>
                <Ban className="h-4 w-4" />
                <span>⚡ 1-Click: Force-Close Route R18 (VIP Order)</span>
              </>
            )}
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => window.open("/pilgrim", "_blank")}
            className="gap-1.5 text-[11px] border-violet-500/40 text-violet-200 hover:bg-violet-950/40"
          >
            📱 Open Pilgrim App
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.open("/kisko", "_blank")}
            className="gap-1.5 text-[11px] border-blue-500/40 text-blue-200 hover:bg-blue-950/40"
          >
            🖥️ Open KISKO Kiosk
          </Button>
        </div>
      </div>

      {/* Summary Strip */}
      <MetricStrip>
        <MetricCard
          label="🟡 Automated"
          value={board.automated.length}
          icon={<Bot className="h-4 w-4" />}
          variant={board.automated.length > 0 ? "warning" : "default"}
          sublabel="Engine-generated"
        />
        <MetricCard
          label="🔵 Verified"
          value={board.verified.length}
          icon={<ShieldCheck className="h-4 w-4" />}
          variant={board.verified.length > 0 ? "critical" : "default"}
          sublabel="Authority-issued"
        />
        <MetricCard
          label="🔴 Overrides"
          value={board.overrides.length}
          icon={<ShieldOff className="h-4 w-4" />}
          variant={board.overrides.length > 0 ? "warning" : "default"}
          sublabel="Tactical directives"
        />
        <MetricCard
          label="Total Active"
          value={board.totalActive}
          icon={<Activity className="h-4 w-4" />}
          variant="default"
          sublabel="All tiers combined"
        />
      </MetricStrip>

      {/* Unified Board */}
      <div className="grid gap-3">
        {board.automated.map((g) => (
          <div key={g.id} className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <TierBadge tier="AUTOMATED" />
                  <span className="text-[10px] text-muted-foreground font-mono">{g.code}</span>
                </div>
                <div className="text-[13px] font-semibold text-foreground">{g.title}</div>
                <div className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{g.guidanceText}</div>
                <div className="text-[10px] text-amber-400/80 mt-1.5 font-mono">⚡ {g.reason}</div>
              </div>
              <StatusBadge value={g.severity} kind="severity" dot />
            </div>
          </div>
        ))}

        {board.verified.map((a) => (
          <div key={a.id} className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <TierBadge tier="VERIFIED" />
                  <span className="text-[10px] text-muted-foreground font-mono">{a.id}</span>
                </div>
                <div className="text-[13px] font-semibold text-foreground">{a.title}</div>
                <div className="text-[11px] text-muted-foreground mt-1">{a.message}</div>
              </div>
              <StatusBadge value={a.severity} kind="severity" dot />
            </div>
          </div>
        ))}

        {board.overrides.map((o) => (
          <div key={o.id} className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <TierBadge tier="OVERRIDE" />
                  <span className="text-[10px] text-muted-foreground font-mono">{o.code}</span>
                </div>
                <div className="text-[13px] font-semibold text-foreground">
                  {o.overrideType.replace(/_/g, " ")} — {o.entityType} {o.entityId}
                </div>
                <div className="text-[11px] text-muted-foreground mt-1">{o.reason}</div>
                <div className="text-[10px] text-rose-400/80 mt-1.5">
                  Authorized by <span className="font-semibold">{o.authorizedBy}</span>
                  {o.authorityRole ? ` (${o.authorityRole})` : ""}
                </div>
              </div>
              <Badge variant="outline" className="text-[10px] shrink-0">{o.overrideType.replace(/_/g, " ")}</Badge>
            </div>
          </div>
        ))}
      </div>

      {/* Route Decision Simulation */}
      <div className="rounded-lg border bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-[13px] font-bold text-foreground flex items-center gap-2">
              <Play className="h-4 w-4 text-violet-400" />
              Route Decision Engine Simulation
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              Simulates conflict resolution: Verified overrides Automated, traces the full decision path.
            </div>
          </div>
          <Button
            size="sm"
            onClick={runSimulation}
            disabled={simulating}
            className="gap-2 bg-violet-600 hover:bg-violet-700 text-white"
          >
            <Play className="h-3.5 w-3.5" />
            {simulating ? "Simulating…" : "Run Simulation"}
          </Button>
        </div>

        {decisionResult && (
          <div className="space-y-3 animate-in fade-in-50 slide-in-from-top-2 duration-300">
            <div className="rounded-lg border border-violet-500/20 bg-violet-500/5 p-4">
              <div className="text-[12px] font-bold text-violet-300 mb-1">{decisionResult.title}</div>
              <div className="text-[11px] text-foreground leading-relaxed">{decisionResult.guidanceText}</div>
            </div>

            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Decision Trace</div>
            <div className="space-y-1.5">
              {decisionResult.traces.map((trace, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-3 rounded-md px-3 py-2 text-[11px] border ${
                    trace.status === "SELECTED"
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                      : trace.status === "OVERRIDDEN"
                        ? "border-rose-500/30 bg-rose-500/10 text-rose-300"
                        : "border-amber-500/30 bg-amber-500/10 text-amber-300"
                  }`}
                >
                  <span className="shrink-0 font-bold w-5">
                    {trace.status === "SELECTED" ? "✅" : trace.status === "OVERRIDDEN" ? "❌" : "⚠️"}
                  </span>
                  <span className="font-semibold shrink-0 w-20">{trace.entityId}</span>
                  <span className="font-medium shrink-0 w-16">{trace.entityName?.split(" ")[0] || ""}</span>
                  <ChevronRight className="h-3 w-3 shrink-0 opacity-40" />
                  <span className="flex-1">{trace.reason}</span>
                  <TierBadge tier={trace.tier} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ========================================================================== */
/*  TAB 2: AUTOMATED GUIDANCE — Engine-Generated Feed                         */
/* ========================================================================== */

function AutomatedGuidanceTab() {
  const qc = useQueryClient();
  const guidanceQuery = useQuery({
    queryKey: ["guidance", "automated"],
    queryFn: getAllAutomatedGuidance,
  });

  const dismissMutation = useMutation({
    mutationFn: (id: string) => dismissGuidance(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["guidance"] });
      toast.success("Guidance dismissed");
    },
  });

  const promoteMutation = useMutation({
    mutationFn: (id: string) => promoteGuidanceToAdvisory(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["guidance"] });
      qc.invalidateQueries({ queryKey: ["alerts"] });
      toast.success("Promoted to Verified Advisory ✅");
    },
  });

  if (guidanceQuery.isLoading) return <LoadingState />;
  const items = guidanceQuery.data ?? [];

  return (
    <div className="space-y-3">
      {items.length === 0 && (
        <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
          <Bot className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <div className="text-[13px] font-medium">No automated guidance generated</div>
          <div className="text-[11px] mt-1">The engine will generate recommendations when thresholds are crossed.</div>
        </div>
      )}

      {items.map((g) => (
        <div
          key={g.id}
          className={`rounded-lg border p-4 transition-all ${
            g.status === "ACTIVE"
              ? "border-amber-500/20 bg-card"
              : g.status === "PROMOTED_TO_VERIFIED"
                ? "border-blue-500/20 bg-blue-500/5 opacity-70"
                : "border-muted bg-muted/30 opacity-50"
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <TierBadge tier="AUTOMATED" />
                <Badge variant="outline" className="text-[9px]">{g.sourceModule}</Badge>
                <span className="text-[10px] text-muted-foreground">{g.entityType} {g.entityId}</span>
                <StatusBadge value={g.status} dot />
              </div>
              <div className="text-[13px] font-semibold text-foreground">{g.title}</div>
              <div className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{g.guidanceText}</div>

              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[10px]">
                <span className="text-amber-400 font-mono">⚡ {g.reason}</span>
                {g.recommendedAction && (
                  <span className="text-emerald-400">→ {g.recommendedAction}</span>
                )}
              </div>

              {g.metricSnapshot && Object.keys(g.metricSnapshot).length > 0 && (
                <div className="flex gap-2 mt-2">
                  {Object.entries(g.metricSnapshot).map(([key, val]) => (
                    <span key={key} className="rounded bg-muted px-1.5 py-0.5 text-[9px] font-mono text-muted-foreground">
                      {key}: {String(val)}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {g.status === "ACTIVE" && (
              <div className="flex flex-col gap-1.5 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-[10px] gap-1 text-blue-400 hover:text-blue-300 border-blue-500/30"
                  onClick={() => promoteMutation.mutate(g.id)}
                  disabled={promoteMutation.isPending}
                >
                  <ArrowUpCircle className="h-3 w-3" />
                  Promote to Verified
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-[10px] gap-1 text-muted-foreground hover:text-foreground"
                  onClick={() => dismissMutation.mutate(g.id)}
                  disabled={dismissMutation.isPending}
                >
                  <XCircle className="h-3 w-3" />
                  Dismiss
                </Button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 mt-2 pt-2 border-t border-border/30 text-[10px] text-muted-foreground">
            <span>Confidence: <span className="font-semibold text-foreground">{g.confidence}</span></span>
            <span>•</span>
            <span>Generated {new Date(g.generatedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>
            {g.zoneId && <><span>•</span><span>Zone {g.zoneId}</span></>}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ========================================================================== */
/*  TAB 3: RULES & THRESHOLDS — Configuration Console                         */
/* ========================================================================== */

function RulesTab() {
  const qc = useQueryClient();
  const rulesQuery = useQuery({
    queryKey: ["guidance", "rules"],
    queryFn: getGuidanceRules,
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) => toggleGuidanceRule(id, enabled),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["guidance"] });
      toast.success("Rule updated");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<GuidanceRule> }) => updateGuidanceRule(id, updates),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["guidance"] });
      toast.success("Threshold updated");
    },
  });

  if (rulesQuery.isLoading) return <LoadingState />;
  const rules = rulesQuery.data ?? [];

  const moduleColors: Record<string, string> = {
    CROWD: "text-amber-400 bg-amber-500/10 border-amber-500/30",
    PARKING: "text-blue-400 bg-blue-500/10 border-blue-500/30",
    FACILITY: "text-green-400 bg-green-500/10 border-green-500/30",
    ROUTE: "text-violet-400 bg-violet-500/10 border-violet-500/30",
    FOOD: "text-orange-400 bg-orange-500/10 border-orange-500/30",
  };

  return (
    <div className="space-y-3">
      <div className="rounded-lg border bg-card p-4">
        <div className="text-[12px] font-bold text-foreground mb-1">Threshold Configuration</div>
        <div className="text-[11px] text-muted-foreground">
          Configure when the Guidance Engine triggers automated recommendations. Adjust thresholds with the sliders or toggle rules on/off.
        </div>
      </div>

      {rules.map((rule) => (
        <div
          key={rule.id}
          className={`rounded-lg border p-4 transition-all ${rule.enabled ? "bg-card" : "bg-muted/30 opacity-60"}`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <Badge
                  variant="outline"
                  className={`text-[9px] font-bold ${moduleColors[rule.module] || ""}`}
                >
                  {rule.module}
                </Badge>
                <span className="text-[10px] text-muted-foreground font-mono">{rule.code}</span>
                <StatusBadge value={rule.severity} kind="severity" dot />
              </div>

              <div className="text-[13px] font-semibold text-foreground">{rule.name}</div>
              {rule.description && (
                <div className="text-[11px] text-muted-foreground mt-1">{rule.description}</div>
              )}

              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground">Metric:</span>
                  <span className="text-[11px] font-mono font-medium text-foreground">{rule.conditionMetric}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground">Condition:</span>
                  <span className="text-[11px] font-mono font-bold text-amber-400">{rule.operator} {rule.thresholdValue}</span>
                </div>
                {rule.durationSeconds > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground">Duration:</span>
                    <span className="text-[11px] font-mono font-medium text-foreground">{rule.durationSeconds}s</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground">Action:</span>
                  <span className="text-[11px] font-medium text-violet-400">{rule.actionType.replace(/_/g, " ")}</span>
                </div>
              </div>

              {/* Threshold Slider */}
              {rule.conditionMetric.includes("percent") || rule.conditionMetric.includes("minutes") ? (
                <div className="mt-3">
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                    <span>Threshold Value</span>
                    <span className="font-mono font-bold text-foreground">{rule.thresholdValue}</span>
                  </div>
                  <input
                    type="range"
                    min={rule.conditionMetric.includes("minutes") ? 1 : 10}
                    max={rule.conditionMetric.includes("minutes") ? 60 : 100}
                    step={rule.conditionMetric.includes("minutes") ? 1 : 5}
                    value={rule.thresholdValue}
                    onChange={(e) => {
                      const newVal = Number(e.target.value);
                      updateMutation.mutate({
                        id: rule.id,
                        updates: { thresholdValue: newVal },
                      });
                    }}
                    className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-slate-700 accent-amber-500"
                    disabled={!rule.enabled}
                  />
                </div>
              ) : null}
            </div>

            {/* Toggle */}
            <button
              onClick={() => toggleMutation.mutate({ id: rule.id, enabled: !rule.enabled })}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 transition-colors duration-200 ${
                rule.enabled
                  ? "border-emerald-500 bg-emerald-500"
                  : "border-slate-600 bg-slate-700"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition-transform duration-200 ${
                  rule.enabled ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ========================================================================== */
/*  TAB 4: VERIFIED ADVISORIES — Authority-Issued Official Guidance           */
/* ========================================================================== */

function VerifiedAdvisoriesTab() {
  const alertsQuery = useQuery({
    queryKey: ["alerts"],
    queryFn: getAlerts,
  });

  if (alertsQuery.isLoading) return <LoadingState />;
  const all = alertsQuery.data ?? [];

  return (
    <div className="space-y-3">
      <div className="rounded-lg border bg-blue-500/5 border-blue-500/20 p-4">
        <div className="text-[12px] font-bold text-blue-400 mb-1 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4" />
          Verified Advisories
        </div>
        <div className="text-[11px] text-muted-foreground">
          Official advisories issued by Police, District Administration, or authorized operators.
          These carry <span className="font-bold text-blue-400">strict priority</span> over all automated guidance.
        </div>
      </div>

      {all.length === 0 && (
        <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
          <ShieldCheck className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <div className="text-[13px] font-medium">No advisories currently active</div>
        </div>
      )}

      {all.map((a) => (
        <div key={a.id} className="rounded-lg border border-blue-500/20 bg-card p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <TierBadge tier="VERIFIED" />
                <Badge variant="outline" className="text-[9px]">{a.type}</Badge>
                <span className="text-[10px] text-muted-foreground">{a.id}</span>
              </div>
              <div className="text-[13px] font-semibold text-foreground">{a.title}</div>
              <div className="text-[11px] text-muted-foreground mt-1">{a.message}</div>

              <div className="flex flex-wrap gap-2 mt-2">
                <StatusBadge value={a.severity} kind="severity" dot />
                <StatusBadge value={a.state} dot />
                {a.zoneId && (
                  <span className="rounded bg-muted px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground">
                    Zone {a.zoneId}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-1 mt-2">
                {a.audience.map((aud) => (
                  <span key={aud} className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[9px] font-medium text-blue-400 border border-blue-500/20">
                    {aud}
                  </span>
                ))}
              </div>
            </div>
            <div className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">
              {a.createdMinutesAgo === 0 ? "Just now" : `${a.createdMinutesAgo}m ago`}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ========================================================================== */
/*  TAB 5: OVERRIDES — Tactical Control Console                               */
/* ========================================================================== */

function OverridesTab() {
  const qc = useQueryClient();
  const overridesQuery = useQuery({
    queryKey: ["guidance", "overrides"],
    queryFn: getAllOverrides,
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => removeGuidanceOverride(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["guidance"] });
      toast.success("Override deactivated");
    },
  });

  if (overridesQuery.isLoading) return <LoadingState />;
  const overrides = overridesQuery.data ?? [];

  const typeIcons: Record<string, typeof Ban> = {
    FORCE_CLOSE: Ban,
    FORCE_OPEN: CheckCircle2,
    SUPPRESS_AUTO_GUIDANCE: Eye,
    FORCE_RECOMMEND: ArrowUpCircle,
  };

  return (
    <div className="space-y-3">
      <div className="rounded-lg border bg-rose-500/5 border-rose-500/20 p-4">
        <div className="text-[12px] font-bold text-rose-400 mb-1 flex items-center gap-2">
          <ShieldOff className="h-4 w-4" />
          Tactical Overrides
        </div>
        <div className="text-[11px] text-muted-foreground">
          Admin-issued directives that force or suppress engine behavior. Overrides take the
          highest priority when the Decision Engine resolves conflicts.
        </div>
      </div>

      {overrides.length === 0 && (
        <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
          <ShieldOff className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <div className="text-[13px] font-medium">No overrides currently active</div>
        </div>
      )}

      {overrides.map((o) => {
        const OverrideIcon = typeIcons[o.overrideType] || Ban;
        return (
          <div
            key={o.id}
            className={`rounded-lg border p-4 ${o.active ? "border-rose-500/20 bg-card" : "border-muted bg-muted/30 opacity-50"}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <TierBadge tier="OVERRIDE" />
                  <Badge variant="outline" className="text-[9px] gap-1">
                    <OverrideIcon className="h-2.5 w-2.5" />
                    {o.overrideType.replace(/_/g, " ")}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground font-mono">{o.code}</span>
                </div>

                <div className="text-[13px] font-semibold text-foreground">
                  {o.entityType} {o.entityId} — {o.overrideType.replace(/_/g, " ")}
                </div>
                <div className="text-[11px] text-muted-foreground mt-1">{o.reason}</div>

                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[10px]">
                  <span className="text-rose-400">
                    By: <span className="font-semibold">{o.authorizedBy}</span>
                    {o.authorityRole ? ` (${o.authorityRole})` : ""}
                  </span>
                  {o.zoneId && <span className="text-muted-foreground">Zone {o.zoneId}</span>}
                  {o.expiresAt && (
                    <span className="text-muted-foreground">
                      Expires: {new Date(o.expiresAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  )}
                </div>
              </div>

              {o.active && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-[10px] gap-1 text-rose-400 hover:text-rose-300"
                  onClick={() => removeMutation.mutate(o.id)}
                  disabled={removeMutation.isPending}
                >
                  <XCircle className="h-3 w-3" />
                  Deactivate
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ========================================================================== */
/*  MAIN PAGE                                                                  */
/* ========================================================================== */

function GuidanceEnginePage() {
  const [activeTab, setActiveTab] = useState<TabId>("active");

  return (
    <div className="space-y-5">
      <PageHeader
        title="Guidance Engine"
        subtitle="Automated guidance, decision resolution, and tactical override control"
      />

      {/* Tab Bar */}
      <div className="flex items-center gap-1 rounded-lg border bg-card p-1 overflow-x-auto">
        {TAB_DEFS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 rounded-md px-3 py-2 text-[12px] font-medium transition-all whitespace-nowrap ${
                isActive
                  ? "bg-primary/10 text-primary shadow-sm border border-primary/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === "active" && <ActiveGuidanceTab />}
        {activeTab === "automated" && <AutomatedGuidanceTab />}
        {activeTab === "rules" && <RulesTab />}
        {activeTab === "advisories" && <VerifiedAdvisoriesTab />}
        {activeTab === "overrides" && <OverridesTab />}
      </div>
    </div>
  );
}
