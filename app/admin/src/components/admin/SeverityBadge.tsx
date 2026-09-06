import { cn } from "@/lib/utils";
import { AlertCircle, AlertTriangle, Info, CheckCircle2, ShieldAlert } from "lucide-react";

export type SeverityLevel = "CRITICAL" | "HIGH" | "WARNING" | "INFO" | "NORMAL";

interface SeverityBadgeProps {
  severity: SeverityLevel | string;
  label?: string;
  size?: "sm" | "md";
  showIcon?: boolean;
  className?: string;
}

export function SeverityBadge({
  severity,
  label,
  size = "sm",
  showIcon = true,
  className,
}: SeverityBadgeProps) {
  const norm = String(severity).toUpperCase();

  let styles = "bg-slate-100 text-slate-700 border-slate-200";
  let Icon = Info;

  if (norm === "CRITICAL") {
    styles = "bg-rose-50 text-rose-700 border-rose-200/80 font-semibold";
    Icon = ShieldAlert;
  } else if (norm === "HIGH") {
    styles = "bg-amber-50 text-amber-800 border-amber-200/80 font-medium";
    Icon = AlertTriangle;
  } else if (norm === "WARNING") {
    styles = "bg-amber-50/70 text-amber-700 border-amber-200/60";
    Icon = AlertCircle;
  } else if (norm === "INFO") {
    styles = "bg-sky-50 text-sky-700 border-sky-200";
    Icon = Info;
  } else if (norm === "NORMAL") {
    styles = "bg-emerald-50 text-emerald-700 border-emerald-200";
    Icon = CheckCircle2;
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-medium transition-colors select-none",
        size === "sm" ? "text-[11px] leading-tight" : "text-xs py-1",
        styles,
        className
      )}
    >
      {showIcon && <Icon className={cn("shrink-0", size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5")} />}
      <span>{label ?? norm}</span>
    </span>
  );
}
