// Persistent Left Sidebar in Deep Navy Style
import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  UtensilsCrossed,
  Car,
  Building2,
  Route,
  Calendar,
  Compass,
  HeartHandshake,
  UserCheck,
  BarChart3,
  ShieldCheck,
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeVariant?: "warning" | "critical" | "default" | "engine";
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: "OPERATIONS",
    items: [
      { label: "Overview", to: "/admin", icon: LayoutDashboard },
    ],
  },
  {
    title: "LIVE INTELLIGENCE",
    items: [
      { label: "Crowd Intelligence", to: "/admin/crowd", icon: Users, badge: "HIGH", badgeVariant: "critical" },
    ],
  },
  {
    title: "PILGRIM SERVICES",
    items: [
      { label: "Food & Kitchens", to: "/admin/food", icon: UtensilsCrossed, badge: "5", badgeVariant: "warning" },
      { label: "Parking", to: "/admin/parking", icon: Car },
      { label: "Facilities", to: "/admin/facilities", icon: Building2 },
    ],
  },
  {
    title: "GUIDANCE",
    items: [
      { label: "Guidance Engine", to: "/admin/guidance", icon: Zap, badge: "ENGINE", badgeVariant: "engine" },
    ],
  },
  {
    title: "MOBILITY",
    items: [
      { label: "Routes", to: "/admin/routes", icon: Route, badge: "1 Closed", badgeVariant: "warning" },
    ],
  },
  {
    title: "PLACES & EVENTS",
    items: [
      { label: "Places", to: "/admin/places", icon: Compass },
      { label: "Events", to: "/admin/events", icon: Calendar },
    ],
  },
  {
    title: "FIELD OPERATIONS",
    items: [
      { label: "Volunteers", to: "/admin/volunteers", icon: HeartHandshake },
    ],
  },
  {
    title: "MANAGEMENT",
    items: [
      { label: "Users & Roles", to: "/admin/users", icon: UserCheck },
      { label: "Reports & Analytics", to: "/admin/reports", icon: BarChart3 },
      { label: "Audit Logs", to: "/admin/audit", icon: ShieldCheck },
      { label: "Settings", to: "/admin/settings", icon: Settings },
    ],
  },
];

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  className?: string;
}

export function Sidebar({ collapsed, onToggleCollapse, className }: SidebarProps) {
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  return (
    <aside
      className={cn(
        "flex flex-col shrink-0 select-none transition-all duration-200 border-r border-slate-800/80 bg-[#0a1128] text-slate-300 z-30 h-screen sticky top-0",
        collapsed ? "w-16" : "w-64",
        className
      )}
    >
      {/* Brand Header */}
      <div className="flex h-14 items-center justify-between px-4 border-b border-slate-800/80 bg-[#070d20]">
        {!collapsed ? (
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#c75b12] text-white shadow-sm font-black text-sm tracking-wider">
              अ
            </div>
            <div>
              <div className="flex items-center gap-1.5 leading-none">
                <span className="text-sm font-bold tracking-tight text-white">Anubhav</span>
                <span className="rounded bg-amber-500/10 px-1 py-0.5 text-[9px] font-semibold text-amber-400 border border-amber-500/20">
                  OPS
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">Kumbh Control Room</span>
            </div>
          </div>
        ) : (
          <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-md bg-[#c75b12] text-white font-bold text-sm">
            अ
          </div>
        )}

        <button
          onClick={onToggleCollapse}
          className="hidden md:flex h-6 w-6 items-center justify-center rounded text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-4 scrollbar-thin">
        {navSections.map((section) => (
          <div key={section.title} className="space-y-0.5">
            {!collapsed && (
              <div className="px-2.5 py-1 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                {section.title}
              </div>
            )}

            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.to === "/admin"
                  ? currentPath === "/admin" || currentPath === "/admin/"
                  : currentPath.startsWith(item.to);

              return (
                <Link
                  key={item.to}
                  to={item.to}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    "group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[12px] font-medium transition-all",
                    isActive
                      ? "bg-[#c75b12]/15 text-white font-semibold shadow-xs border-l-2 border-[#c75b12]"
                      : "text-slate-300 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0 transition-colors",
                      isActive ? "text-[#f97316]" : "text-slate-400 group-hover:text-slate-200"
                    )}
                  />

                  {!collapsed && (
                    <div className="flex flex-1 items-center justify-between truncate">
                      <span className="truncate">{item.label}</span>
                      {item.badge && (
                        <span
                          className={cn(
                            "ml-1.5 rounded-full px-1.5 py-0.2 text-[9px] font-bold uppercase",
                            item.badgeVariant === "critical"
                              ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                              : item.badgeVariant === "warning"
                                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                : item.badgeVariant === "engine"
                                  ? "bg-violet-500/20 text-violet-300 border border-violet-500/30"
                                  : "bg-slate-800 text-slate-300"
                          )}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer System Status Indicator */}
      <div className="border-t border-slate-800/80 p-3 bg-[#070d20]">
        {!collapsed ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-[10px] font-semibold text-emerald-400 tracking-wide">
                LIVE · NASHIK CELL
              </span>
            </div>
            <span className="text-[9px] text-slate-400 font-mono">12ms</span>
          </div>
        ) : (
          <div className="flex justify-center" title="LIVE · NASHIK CELL">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
          </div>
        )}
      </div>
    </aside>
  );
}
