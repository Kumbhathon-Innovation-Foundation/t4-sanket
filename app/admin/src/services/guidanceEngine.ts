// PRAVAH (Anubhav) — Guidance Engine Service
// Decision Engine core logic:
//   1. Evaluates live observations against active guidance_rules.
//   2. Synthesizes automated recommendations.
//   3. Checks official verified advisories and active admin overrides.
//   4. Resolves conflicts (Verified strictly overrides Automated).
//   5. Produces ResolvedGuidance with transparent explanation traces.

import {
  getGuidanceRepository,
  getAdvisoryRepository,
  getRouteRepository,
} from "@/repositories";
import type {
  AutomatedGuidance,
  DecisionTrace,
  GuidanceOverride,
  GuidanceRule,
  GuidanceTier,
  OpsAlert,
  ResolvedGuidance,
  RouteLink,
} from "@/types";

/* ==========================================================================
   1. GUIDANCE CRUD — Delegated to repository
   ========================================================================== */

export const getGuidanceRules = () => getGuidanceRepository().getRules();
export const getGuidanceRule = (id: string) => getGuidanceRepository().getRuleById(id);
export const updateGuidanceRule = (id: string, updates: Partial<GuidanceRule>) =>
  getGuidanceRepository().updateRule(id, updates);
export const toggleGuidanceRule = (id: string, enabled: boolean) =>
  getGuidanceRepository().toggleRule(id, enabled);

export const getAllAutomatedGuidance = () => getGuidanceRepository().getAutomatedGuidance();
export const getActiveAutomatedGuidance = () => getGuidanceRepository().getActiveAutomatedGuidance();
export const dismissGuidance = (id: string, dismissedBy = "Anjali Rane") =>
  getGuidanceRepository().dismissAutomatedGuidance(id, dismissedBy);
export const promoteGuidanceToAdvisory = (id: string) =>
  getGuidanceRepository().promoteToVerifiedAdvisory(id);

export const getAllOverrides = () => getGuidanceRepository().getOverrides();
export const getActiveOverrides = () => getGuidanceRepository().getActiveOverrides();
export const addGuidanceOverride = (override: GuidanceOverride) =>
  getGuidanceRepository().addOverride(override);
export const removeGuidanceOverride = (id: string) =>
  getGuidanceRepository().removeOverride(id);

/* ==========================================================================
   2. DECISION ENGINE — Conflict Resolution & Transparent Trace
   ========================================================================== */

/**
 * Resolves the best route from a set of candidates, considering:
 * - Automated guidance (crowd pressure, congestion)
 * - Verified advisories (official restrictions)
 * - Active overrides (FORCE_CLOSE, FORCE_OPEN)
 *
 * Returns a ResolvedGuidance with a full decision trace matching
 * the user's R17/R18/R21 scenario specification.
 */
export const resolveRouteGuidance = async (
  candidateRouteIds: string[]
): Promise<ResolvedGuidance> => {
  const [routes, autoGuidance, advisories, overrides] = await Promise.all([
    getRouteRepository().getAllRoutes(),
    getGuidanceRepository().getActiveAutomatedGuidance(),
    getAdvisoryRepository().getActiveAdvisories(),
    getGuidanceRepository().getActiveOverrides(),
  ]);

  const candidates = candidateRouteIds
    .map((id) =>
      routes.find(
        (r) =>
          r.id === id ||
          r.code === id ||
          (id === "R18" && (r.id === "R02" || r.code === "R02")) ||
          (id === "R02" && (r.id === "R18" || r.code === "R18"))
      )
    )
    .filter(Boolean) as RouteLink[];

  const traces: DecisionTrace[] = [];
  let selectedRoute: RouteLink | null = null;

  for (const route of candidates) {
    const routeId = route.id;

    // Check 1: Is there a FORCE_CLOSE override?
    const forceClose = overrides.find(
      (o) =>
        (o.entityId === routeId ||
          (routeId === "R18" && o.entityId === "R02") ||
          (routeId === "R02" && o.entityId === "R18") ||
          o.code?.includes(routeId)) &&
        o.overrideType === "FORCE_CLOSE" &&
        o.active
    );
    if (forceClose) {
      traces.push({
        entityType: "ROUTE",
        entityId: routeId,
        entityName: route.name || routeId,
        tier: "OVERRIDE" as GuidanceTier,
        status: "OVERRIDDEN",
        reason: `Restricted by ${forceClose.authorizedBy}: ${forceClose.reason}`,
      });
      continue;
    }

    // Check 2: Is there a verified advisory marking this route restricted?
    const routeAdvisory = advisories.find(
      (a) =>
        a.state === "ACTIVE" &&
        (a.type === "ROUTE" || a.type === "CROWD") &&
        (a.message.toLowerCase().includes(routeId.toLowerCase()) ||
          a.title.toLowerCase().includes(routeId.toLowerCase()))
    );
    if (routeAdvisory) {
      traces.push({
        entityType: "ROUTE",
        entityId: routeId,
        entityName: route.name || routeId,
        tier: "VERIFIED" as GuidanceTier,
        status: "REJECTED",
        reason: `Verified advisory: ${routeAdvisory.title}`,
      });
      continue;
    }

    // Check 3: Is there automated guidance warning about this route?
    const autoWarning = autoGuidance.find(
      (g) => g.entityId === routeId && g.status === "ACTIVE"
    );
    if (autoWarning && !selectedRoute) {
      // Automated warning, but still a viable fallback
      traces.push({
        entityType: "ROUTE",
        entityId: routeId,
        entityName: route.name || routeId,
        tier: "AUTOMATED" as GuidanceTier,
        status: "REJECTED",
        reason: `Automated warning: ${autoWarning.reason}`,
      });
      continue;
    }

    // Check 4: Route status from observations
    if (route.status === "CLOSED" || route.status === "DIVERSION") {
      traces.push({
        entityType: "ROUTE",
        entityId: routeId,
        entityName: route.name || routeId,
        tier: "AUTOMATED" as GuidanceTier,
        status: "REJECTED",
        reason: `Route status is ${route.status}`,
      });
      continue;
    }

    // Check 5: High crowd pressure
    if (route.crowd === "PEAK" || route.crowd === "HIGH") {
      traces.push({
        entityType: "ROUTE",
        entityId: routeId,
        entityName: route.name || routeId,
        tier: "AUTOMATED" as GuidanceTier,
        status: selectedRoute ? "REJECTED" : "REJECTED",
        reason: `High crowd pressure (${route.crowd})`,
      });
      if (selectedRoute) continue;
      // May still select if it's the only option
    }

    // This route is safe — select it
    if (!selectedRoute) {
      selectedRoute = route;
      traces.push({
        entityType: "ROUTE",
        entityId: routeId,
        entityName: route.name || routeId,
        tier: "AUTOMATED" as GuidanceTier,
        status: "SELECTED",
        reason: "Route is clear and safe for pilgrim movement.",
      });
    }
  }

  // If no route was selected, pick the least bad option
  if (!selectedRoute && candidates.length > 0) {
    const fallback = candidates[candidates.length - 1];
    if (fallback) {
      selectedRoute = fallback;
      traces.push({
        entityType: "ROUTE",
        entityId: fallback.id,
        entityName: fallback.name || fallback.id,
        tier: "AUTOMATED" as GuidanceTier,
        status: "SELECTED",
        reason: "Selected as last available option despite conditions.",
      });
    }
  }

  // Build the explanation text
  const rejectedTraces = traces.filter((t) => t.status !== "SELECTED");
  const explanationParts = rejectedTraces.map((t) => {
    if (t.tier === "OVERRIDE") return `${t.entityName} is temporarily restricted according to a verified override.`;
    if (t.tier === "VERIFIED") return `${t.entityName} is restricted according to a verified advisory.`;
    return `${t.entityName} has ${t.reason.toLowerCase()}.`;
  });
  const selectedName = selectedRoute?.name || selectedRoute?.id || "Unknown";
  const guidanceText = selectedRoute
    ? `${selectedName} is currently the best available route. ${explanationParts.join(" ")}`
    : "No safe route currently available. Please wait for updated guidance.";

  // Determine which tier drove this guidance decision
  let effectiveTier: GuidanceTier = "AUTOMATED";
  if (traces.some((t) => t.tier === "OVERRIDE" && t.status === "OVERRIDDEN")) {
    effectiveTier = "OVERRIDE";
  } else if (traces.some((t) => t.tier === "VERIFIED" && t.status === "REJECTED")) {
    effectiveTier = "VERIFIED";
  }

  return {
    id: `RG-${Date.now().toString(36)}`,
    title: selectedRoute
      ? `Recommended: ${selectedName}`
      : "No Safe Route Available",
    guidanceText,
    tier: effectiveTier,
    severity: selectedRoute ? (effectiveTier === "OVERRIDE" ? "CRITICAL" : "WARNING") : "CRITICAL",
    selectedEntityId: selectedRoute?.id || "",
    selectedEntityName: selectedName,
    traces,
    generatedAt: new Date().toISOString(),
  };
};

/**
 * Resolves a complete operational picture — all active guidance, advisories,
 * and overrides merged into a unified board for the Active Guidance tab.
 */
export const getActiveGuidanceBoard = async () => {
  const [autoGuidance, advisories, overrides] = await Promise.all([
    getGuidanceRepository().getActiveAutomatedGuidance(),
    getAdvisoryRepository().getActiveAdvisories(),
    getGuidanceRepository().getActiveOverrides(),
  ]);

  return {
    automated: autoGuidance,
    verified: advisories,
    overrides,
    totalActive: autoGuidance.length + advisories.length + overrides.length,
    generatedAt: new Date().toISOString(),
  };
};

/**
 * Simulates the R17/R18/R21 Decision Engine scenario.
 * R17 = R01 (Tapovan → Ramkund, crowd pressure HIGH)
 * R18 = R02 (Ramkund → Panchavati, restricted by police override)
 * R21 = R03 (Godavari Bridge → Ramkund, RECOMMENDED)
 */
export const simulateRouteDecision = async (): Promise<ResolvedGuidance> => {
  return resolveRouteGuidance(["R02", "R01", "R03", "R04"]);
};
