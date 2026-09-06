// Priority panel — highlighted cards for critical conditions
import { cn } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";
import type { ReactNode } from "react";

interface PriorityItem {
  id: string;
  title: string;
  subtitle: string;
  severity: "warning" | "critical" | "info";
  onClick?: () => void;
}

interface PriorityPanelProps {
  title?: string;
  items: PriorityItem[];
  className?: string;
  emptyMessage?: string;
}

const severityClasses = {
  critical: "border-ops-critical/20 bg-ops-critical/5",
  warning: "border-ops-warning/20 bg-ops-warning/5",
  info: "border-blue-200 bg-blue-50",
};

const severityDot = {
  critical: "bg-ops-critical",
  warning: "bg-ops-warning",
  info: "bg-blue-500",
};

export function PriorityPanel({ title = "Priority Conditions", items, className, emptyMessage }: PriorityPanelProps) {
  return (
    <div className={cn("rounded-lg border border-border bg-card p-4", className)}>
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="h-4 w-4 text-ops-warning" />
        <span className="text-[13px] font-semibold text-foreground">{title}</span>
        {items.length > 0 && (
          <span className="ml-auto rounded-full bg-ops-critical/10 px-1.5 py-0.5 text-[10px] font-semibold text-ops-critical">
            {items.length}
          </span>
        )}
      </div>
      {items.length === 0 ? (
        <p className="text-[12px] text-muted-foreground">{emptyMessage ?? "No priority conditions"}</p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className={cn(
                "flex items-center gap-3 rounded-md border px-3 py-2 transition-colors",
                severityClasses[item.severity],
                item.onClick && "cursor-pointer hover:opacity-80",
              )}
              onClick={item.onClick}
            >
              <span className={cn("h-2 w-2 shrink-0 rounded-full", severityDot[item.severity])} />
              <div className="min-w-0 flex-1">
                <span className="text-[12px] font-medium text-foreground">{item.title}</span>
                <span className="ml-2 text-[11px] text-muted-foreground">{item.subtitle}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

