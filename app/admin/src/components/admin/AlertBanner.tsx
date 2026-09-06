import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { ShieldAlert, AlertTriangle, Info, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AlertBannerProps {
  severity?: "critical" | "warning" | "info";
  title: string;
  message: string;
  actionText?: string;
  onAction?: () => void;
  dismissible?: boolean;
  className?: string;
}

export function AlertBanner({
  severity = "warning",
  title,
  message,
  actionText,
  onAction,
  dismissible = true,
  className,
}: AlertBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const config = {
    critical: {
      bg: "bg-rose-50 dark:bg-rose-950/40",
      border: "border-rose-200 dark:border-rose-800/60",
      text: "text-rose-900 dark:text-rose-200",
      subtext: "text-rose-700 dark:text-rose-300",
      icon: ShieldAlert,
      iconColor: "text-rose-600 dark:text-rose-400",
    },
    warning: {
      bg: "bg-amber-50 dark:bg-amber-950/40",
      border: "border-amber-200 dark:border-amber-800/60",
      text: "text-amber-900 dark:text-amber-200",
      subtext: "text-amber-700 dark:text-amber-300",
      icon: AlertTriangle,
      iconColor: "text-amber-600 dark:text-amber-400",
    },
    info: {
      bg: "bg-sky-50 dark:bg-sky-950/40",
      border: "border-sky-200 dark:border-sky-800/60",
      text: "text-sky-900 dark:text-sky-200",
      subtext: "text-sky-700 dark:text-sky-300",
      icon: Info,
      iconColor: "text-sky-600 dark:text-sky-400",
    },
  }[severity];

  const Icon = config.icon;

  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-lg border px-4 py-3 text-xs shadow-xs transition-all",
        config.bg,
        config.border,
        className
      )}
    >
      <div className="flex items-start gap-2.5">
        <Icon className={cn("h-4 w-4 shrink-0 mt-0.5", config.iconColor)} />
        <div>
          <span className={cn("font-semibold", config.text)}>{title} — </span>
          <span className={config.subtext}>{message}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 pl-3">
        {actionText && onAction && (
          <Button
            variant="outline"
            size="sm"
            onClick={onAction}
            className="h-6 px-2.5 text-[11px] font-medium bg-white/70 dark:bg-black/30 border-current"
          >
            {actionText}
          </Button>
        )}
        {dismissible && (
          <button
            onClick={() => setDismissed(true)}
            className="text-muted-foreground hover:text-foreground transition-colors p-0.5"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
