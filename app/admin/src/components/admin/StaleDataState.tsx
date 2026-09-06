import { cn } from "@/lib/utils";
import { Clock, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StaleDataStateProps {
  updatedMinutesAgo: number;
  onRefresh?: () => void;
  thresholdMinutes?: number;
  className?: string;
}

export function StaleDataState({
  updatedMinutesAgo,
  onRefresh,
  thresholdMinutes = 5,
  className,
}: StaleDataStateProps) {
  if (updatedMinutesAgo < thresholdMinutes) return null;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border border-amber-300/80 bg-amber-50/90 px-2.5 py-1 text-[11px] text-amber-900 shadow-2xs backdrop-blur-xs select-none",
        className
      )}
    >
      <Clock className="h-3 w-3 text-amber-600 shrink-0" />
      <span>
        Telemetry last synced <strong>{updatedMinutesAgo}m ago</strong> (Potential staleness)
      </span>
      {onRefresh && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onRefresh}
          className="h-5 px-1 text-[10px] text-amber-900 hover:text-amber-950 hover:bg-amber-100/60 ml-1"
        >
          <RefreshCw className="h-2.5 w-2.5 mr-1" /> Refresh
        </Button>
      )}
    </div>
  );
}
