import React from "react";
import { cn } from "@/lib/utils";
import { CheckCircle2, Clock, AlertCircle } from "lucide-react";

export interface TimelineItem {
  id: string;
  title: string;
  subtitle?: string;
  time: string;
  status?: "completed" | "active" | "pending" | "warning";
  details?: React.ReactNode;
}

interface TimelineProps {
  items: TimelineItem[];
  className?: string;
}

export function Timeline({ items, className }: TimelineProps) {
  return (
    <div className={cn("relative pl-6 space-y-6", className)}>
      {/* Continuous vertical line */}
      <div className="absolute left-2.5 top-2 bottom-2 w-0.5 bg-border" />

      {items.map((item, idx) => {
        const isCompleted = item.status === "completed";
        const isActive = item.status === "active";
        const isWarning = item.status === "warning";

        return (
          <div key={item.id || idx} className="relative group">
            {/* Dot / Icon */}
            <div
              className={cn(
                "absolute -left-6 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-background ring-4 ring-background",
                isCompleted && "text-emerald-600",
                isActive && "text-primary ring-primary/20",
                isWarning && "text-amber-500",
                !isCompleted && !isActive && !isWarning && "text-muted-foreground"
              )}
            >
              {isCompleted ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : isWarning ? (
                <AlertCircle className="h-4 w-4" />
              ) : (
                <Clock className="h-4 w-4" />
              )}
            </div>

            {/* Content */}
            <div className="text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground">{item.title}</span>
                <span className="text-[11px] font-mono text-muted-foreground">{item.time}</span>
              </div>
              {item.subtitle && <p className="mt-0.5 text-muted-foreground">{item.subtitle}</p>}
              {item.details && <div className="mt-2">{item.details}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
