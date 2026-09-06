import React from "react";
import { AlertTriangle, Info, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "default";
  loading?: boolean;
}

export function ConfirmationDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm Action",
  cancelText = "Cancel",
  variant = "default",
  loading = false,
}: ConfirmationDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-xs animate-in fade-in" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-xl animate-in zoom-in-95 duration-150">
        <div className="flex items-start gap-3">
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
              variant === "danger"
                ? "bg-rose-100 text-rose-600"
                : variant === "warning"
                  ? "bg-amber-100 text-amber-600"
                  : "bg-primary/10 text-primary"
            }`}
          >
            {variant === "danger" ? (
              <AlertTriangle className="h-4 w-4" />
            ) : variant === "warning" ? (
              <AlertTriangle className="h-4 w-4" />
            ) : (
              <Info className="h-4 w-4" />
            )}
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-foreground">{title}</h3>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{description}</p>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose} disabled={loading} className="text-xs">
            {cancelText}
          </Button>
          <Button
            size="sm"
            onClick={onConfirm}
            disabled={loading}
            className={`text-xs ${
              variant === "danger"
                ? "bg-rose-600 hover:bg-rose-700 text-white"
                : variant === "warning"
                  ? "bg-amber-600 hover:bg-amber-700 text-white"
                  : "bg-primary text-primary-foreground"
            }`}
          >
            {loading ? "Processing..." : confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}
