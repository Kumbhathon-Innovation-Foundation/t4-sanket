// Top Navigation Header
import React, { useState } from "react";
import { Breadcrumbs } from "./Breadcrumbs";
import { Search, Bell, ShieldCheck, User, Radio, ExternalLink, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface TopBarProps {
  onSearchClick?: () => void;
}

export function TopBar({ onSearchClick }: TopBarProps) {
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="sticky top-0 z-20 flex h-14 w-full items-center justify-between border-b border-border bg-card/95 px-5 backdrop-blur-md">
      {/* Left: Dynamic Breadcrumb Hierarchy */}
      <div className="flex items-center gap-3">
        <Breadcrumbs />
      </div>

      {/* Right: Global Search, Live Telemetry, Notifications & Admin Profile */}
      <div className="flex items-center gap-3">
        {/* Global search trigger with shortcut key */}
        <button
          type="button"
          onClick={onSearchClick}
          className="flex h-8 w-64 items-center justify-between rounded-lg border border-border bg-muted/30 px-3 text-xs text-muted-foreground hover:bg-muted/60 transition-colors shadow-2xs"
        >
          <div className="flex items-center gap-2">
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Search zones, routes, alerts...</span>
          </div>
          <kbd className="hidden sm:inline-flex rounded border border-border/80 bg-background px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
            ⌘K
          </kbd>
        </button>

        {/* Live System Status Badge */}
        <div className="hidden lg:flex items-center gap-2 rounded-lg border border-emerald-200/80 bg-emerald-50/70 px-2.5 py-1 text-[11px] text-emerald-800">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="font-semibold">TELEMETRY ACTIVE</span>
          <span className="text-[10px] text-emerald-600 font-mono">10s cadence</span>
        </div>

        {/* Notification Bell with Flyout */}
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-foreground"
            title="Operational Notifications"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
            </span>
          </Button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl border border-border bg-card p-3 shadow-xl animate-in zoom-in-95 z-50">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <span className="text-xs font-semibold text-foreground">Operational Broadcasts</span>
                <Badge variant="outline" className="text-[10px] bg-rose-50 text-rose-700 border-rose-200">
                  2 Critical
                </Badge>
              </div>
              <div className="py-2 space-y-2 text-xs">
                <div className="rounded-md border border-rose-100 bg-rose-50/60 p-2 text-rose-900">
                  <div className="font-semibold text-[11px]">Zone 08 (Ram Kund North)</div>
                  <div className="text-[11px] text-rose-700">Crowd density reached PEAK. Automatic barrier diversion suggested.</div>
                  <div className="mt-1 text-[9px] text-rose-500 font-mono">4 mins ago</div>
                </div>
                <div className="rounded-md border border-amber-100 bg-amber-50/60 p-2 text-amber-900">
                  <div className="font-semibold text-[11px]">Kitchen K12 Deficit</div>
                  <div className="text-[11px] text-amber-700">860 meals deficit reported at Tapovan Sadhu Gram.</div>
                  <div className="mt-1 text-[9px] text-amber-500 font-mono">12 mins ago</div>
                </div>
              </div>
              <div className="pt-1.5 border-t border-border text-center">
                <a href="/admin/alerts" className="text-[11px] font-medium text-primary hover:underline">
                  View all active alerts →
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Administrator Profile Menu */}
        <div className="flex items-center gap-2 pl-2 border-l border-border">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">
            AR
          </div>
          <div className="hidden md:flex flex-col text-left leading-none">
            <span className="text-xs font-semibold text-foreground">Anjali Rane</span>
            <span className="text-[10px] text-muted-foreground mt-0.5">Operations Head</span>
          </div>
        </div>
      </div>
    </header>
  );
}
