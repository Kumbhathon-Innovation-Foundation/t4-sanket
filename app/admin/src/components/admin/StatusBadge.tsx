// Reusable status badge component
import { cn } from "@/lib/utils";
import type { CrowdLevel, OpStatus, AlertSeverity, Confidence, DataQuality } from "@/types";

type BadgeKind = "crowd" | "status" | "severity" | "confidence" | "quality" | "generic";

interface StatusBadgeProps {
  value: string;
  kind?: BadgeKind;
  size?: "sm" | "md";
  className?: string;
  dot?: boolean;
}

const crowdColors: Record<CrowdLevel, string> = {
  LOW: "bg-crowd-low/10 text-crowd-low border-crowd-low/20",
  MODERATE: "bg-crowd-moderate/10 text-crowd-moderate border-crowd-moderate/20",
  HIGH: "bg-crowd-high/10 text-crowd-high border-crowd-high/20",
  PEAK: "bg-crowd-peak/10 text-crowd-peak border-crowd-peak/20",
};

const statusColors: Record<OpStatus, string> = {
  STABLE: "bg-ops-stable/10 text-ops-stable border-ops-stable/20",
  WARNING: "bg-ops-warning/10 text-ops-warning border-ops-warning/20",
  CRITICAL: "bg-ops-critical/10 text-ops-critical border-ops-critical/20",
  CLOSED: "bg-ops-closed/10 text-ops-closed border-ops-closed/20",
};

const severityColors: Record<AlertSeverity, string> = {
  INFORMATION: "bg-blue-50 text-blue-600 border-blue-200",
  INFO: "bg-blue-50 text-blue-600 border-blue-200",
  WARNING: "bg-ops-warning/10 text-ops-warning border-ops-warning/20",
  HIGH: "bg-ops-critical/10 text-ops-critical border-ops-critical/20",
  CRITICAL: "bg-ops-critical/15 text-ops-critical border-ops-critical/30",
};

const dotColors: Record<string, string> = {
  LOW: "bg-crowd-low",
  MODERATE: "bg-crowd-moderate",
  HIGH: "bg-crowd-high",
  PEAK: "bg-crowd-peak",
  STABLE: "bg-ops-stable",
  WARNING: "bg-ops-warning",
  CRITICAL: "bg-ops-critical",
  CLOSED: "bg-ops-closed",
  INFORMATION: "bg-blue-500",
  ACTIVE: "bg-ops-stable",
  AVAILABLE: "bg-ops-stable",
  ASSIGNED: "bg-saffron",
  OFFLINE: "bg-ops-closed",
  OPEN: "bg-ops-stable",
  NEEDS_ATTENTION: "bg-ops-warning",
  FULL: "bg-ops-critical",
  RECOMMENDED: "bg-ops-stable",
  CONGESTED: "bg-ops-critical",
  DIVERSION: "bg-ops-warning",
  VERIFIED: "bg-ops-stable",
  PENDING: "bg-ops-warning",
  FULFILLED: "bg-blue-500",
  LIVE: "bg-ops-stable",
  ESTIMATED: "bg-ops-warning",
  PREDICTED: "bg-blue-500",
  STALE: "bg-ops-closed",
  SIMULATED: "bg-saffron",
};

function getColorClass(kind: BadgeKind, value: string): string {
  if (kind === "crowd") return crowdColors[value as CrowdLevel] ?? "bg-muted text-muted-foreground border-border";
  if (kind === "status") return statusColors[value as OpStatus] ?? "bg-muted text-muted-foreground border-border";
  if (kind === "severity") return severityColors[value as AlertSeverity] ?? "bg-muted text-muted-foreground border-border";
  return "bg-muted text-muted-foreground border-border";
}

export function StatusBadge({ value, kind = "generic", size = "sm", className, dot = false }: StatusBadgeProps) {
  const display = value.replace(/_/g, " ");

  if (dot) {
    return (
      <span className={cn("inline-flex items-center gap-1.5 text-[12px] font-medium text-foreground", className)}>
        <span className={cn("h-2 w-2 rounded-full", dotColors[value] ?? "bg-muted-foreground")} />
        {display}
      </span>
    );
  }

  const colorClass = kind !== "generic" ? getColorClass(kind, value) : "bg-muted text-muted-foreground border-border";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border font-medium",
        size === "sm" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-[11px]",
        colorClass,
        className,
      )}
    >
      {display}
    </span>
  );
}

