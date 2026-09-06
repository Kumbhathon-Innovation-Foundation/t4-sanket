import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export type TrendDirection = "INCREASING" | "DECREASING" | "STABLE" | "UP" | "DOWN";

interface TrendIndicatorProps {
  trend: TrendDirection | string;
  value?: string | number;
  label?: string;
  className?: string;
  inverse?: boolean; // When true, increasing is bad (e.g. crowd density, deficit)
}

export function TrendIndicator({
  trend,
  value,
  label,
  className,
  inverse = true,
}: TrendIndicatorProps) {
  const norm = String(trend).toUpperCase();
  const isUp = norm === "INCREASING" || norm === "UP";
  const isDown = norm === "DECREASING" || norm === "DOWN";

  // If inverse is true (typical for ops like crowd), increasing is warning/critical
  const color = isUp
    ? inverse
      ? "text-rose-600 dark:text-rose-400"
      : "text-emerald-600 dark:text-emerald-400"
    : isDown
      ? inverse
        ? "text-emerald-600 dark:text-emerald-400"
        : "text-rose-600 dark:text-rose-400"
      : "text-muted-foreground";

  const Icon = isUp ? TrendingUp : isDown ? TrendingDown : Minus;
  const displayText = label ?? (isUp ? "Increasing" : isDown ? "Decreasing" : "Stable");

  return (
    <span className={cn("inline-flex items-center gap-1 text-[11px] font-medium select-none", color, className)}>
      <Icon className="h-3 w-3 shrink-0" />
      <span>
        {displayText}
        {value ? ` (${value})` : ""}
      </span>
    </span>
  );
}
