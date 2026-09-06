// Reusable metric card for KPI display
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { ReactNode } from "react";

interface MetricCardProps {
  label: string;
  value: string | number | ReactNode;
  icon?: ReactNode;
  trend?: "up" | "down" | "stable";
  trendLabel?: string;
  sublabel?: string;
  variant?: "default" | "warning" | "critical" | "success" | "info";
  className?: string;
}

const variantStyles = {
  default: "border-border",
  warning: "border-ops-warning/30 bg-ops-warning/5",
  critical: "border-ops-critical/30 bg-ops-critical/5",
  success: "border-ops-stable/30 bg-ops-stable/5",
  info: "border-sky-500/30 bg-sky-500/5",
};

export function MetricCard({
  label,
  value,
  icon,
  trend,
  trendLabel,
  sublabel,
  variant = "default",
  className,
}: MetricCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1 rounded-lg border bg-card p-4 transition-shadow hover:shadow-sm",
        variantStyles[variant],
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        {icon && <span className="text-muted-foreground/50">{icon}</span>}
      </div>
      <div className="flex items-end gap-2">
        <span className="text-2xl font-semibold tracking-tight text-foreground">
          {typeof value === "number" ? value.toLocaleString() : value}
        </span>
        {trend && (
          <span
            className={cn(
              "flex items-center gap-0.5 text-[11px] font-medium pb-0.5",
              trend === "up" && "text-ops-critical",
              trend === "down" && "text-ops-stable",
              trend === "stable" && "text-muted-foreground",
            )}
          >
            {trend === "up" && <TrendingUp className="h-3 w-3" />}
            {trend === "down" && <TrendingDown className="h-3 w-3" />}
            {trend === "stable" && <Minus className="h-3 w-3" />}
            {trendLabel}
          </span>
        )}
      </div>
      {sublabel && (
        <span className="text-[11px] text-muted-foreground">
          {sublabel}
        </span>
      )}
    </div>
  );
}

interface MetricStripProps {
  children: ReactNode;
  className?: string;
}

export function MetricStrip({ children, className }: MetricStripProps) {
  return (
    <div className={cn("grid gap-3", className)} style={{ gridTemplateColumns: `repeat(auto-fit, minmax(160px, 1fr))` }}>
      {children}
    </div>
  );
}
