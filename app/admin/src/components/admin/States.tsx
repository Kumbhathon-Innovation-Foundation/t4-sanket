// Reusable state components
import { cn } from "@/lib/utils";
import { Loader2, AlertCircle, InboxIcon, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

// Loading state
interface LoadingStateProps {
  message?: string;
  className?: string;
}

export function LoadingState({ message = "Loading data…", className }: LoadingStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground", className)}>
      <Loader2 className="h-6 w-6 animate-spin text-saffron" />
      <span className="text-[13px]">{message}</span>
    </div>
  );
}

// Table skeleton
export function TableSkeleton({ rows = 5, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-2 py-4">
      <div className="flex gap-3">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-3">
          {Array.from({ length: cols }).map((_, i) => (
            <Skeleton key={i} className="h-8 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

// Empty state
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon = <InboxIcon className="h-10 w-10" />,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 py-16 text-center", className)}>
      <div className="text-muted-foreground/30">{icon}</div>
      <div>
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        {description && <p className="mt-0.5 text-[12px] text-muted-foreground/70">{description}</p>}
      </div>
      {action}
    </div>
  );
}

// Error state
interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  message = "Something went wrong loading this data.",
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 py-16 text-center", className)}>
      <AlertCircle className="h-8 w-8 text-ops-critical/50" />
      <p className="text-[13px] text-muted-foreground">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

// Stale data banner
interface StaleDataBannerProps {
  minutes: number;
  className?: string;
}

export function StaleDataBanner({ minutes, className }: StaleDataBannerProps) {
  if (minutes < 15) return null;
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-md border px-3 py-1.5 text-[12px]",
        minutes > 30
          ? "border-ops-warning/30 bg-ops-warning/5 text-ops-warning"
          : "border-border bg-muted/50 text-muted-foreground",
        className,
      )}
    >
      <Clock className="h-3.5 w-3.5" />
      Data last updated {minutes} minutes ago
    </div>
  );
}
