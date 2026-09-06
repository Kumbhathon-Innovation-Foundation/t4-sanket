import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

const routeNameMap: Record<string, string> = {
  admin: "Operations",
  crowd: "Crowd Intelligence",
  food: "Food & Kitchens",
  shortages: "Shortages",
  parking: "Parking Management",
  facilities: "Facilities",
  places: "Places & Discover",
  routes: "Routes & Closures",
  events: "Events & Peaks",
  volunteers: "Volunteers",
  alerts: "Alerts & Broadcasts",
  create: "New Alert",
  users: "Users & Roles",
  reports: "Reports & Analytics",
  audit: "Audit Logs",
  settings: "Settings",
};

interface BreadcrumbsProps {
  className?: string;
  customTrail?: { label: string; to?: string }[];
}

export function Breadcrumbs({ className, customTrail }: BreadcrumbsProps) {
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;

  if (customTrail && customTrail.length > 0) {
    return (
      <nav aria-label="Breadcrumb" className={cn("flex items-center space-x-1 text-[12px] text-muted-foreground", className)}>
        <Link to="/admin" className="hover:text-foreground transition-colors flex items-center gap-1">
          <Home className="h-3 w-3" />
        </Link>
        {customTrail.map((crumb, idx) => {
          const isLast = idx === customTrail.length - 1;
          return (
            <div key={idx} className="flex items-center space-x-1">
              <ChevronRight className="h-3 w-3 text-muted-foreground/60" />
              {crumb.to && !isLast ? (
                <Link to={crumb.to} className="hover:text-foreground transition-colors">
                  {crumb.label}
                </Link>
              ) : (
                <span className="font-medium text-foreground">{crumb.label}</span>
              )}
            </div>
          );
        })}
      </nav>
    );
  }

  const segments = pathname.split("/").filter(Boolean);

  return (
    <nav aria-label="Breadcrumb" className={cn("flex items-center space-x-1 text-[12px] text-muted-foreground", className)}>
      <Link to="/admin" className="hover:text-foreground transition-colors flex items-center gap-1" title="Overview">
        <Home className="h-3 w-3" />
      </Link>
      {segments.map((seg, idx) => {
        const path = `/${segments.slice(0, idx + 1).join("/")}`;
        const isLast = idx === segments.length - 1;
        const name = routeNameMap[seg.toLowerCase()] || seg.replace(/^ZONE-/, "").replace(/^K-/, "Kitchen ");

        return (
          <div key={path} className="flex items-center space-x-1">
            <ChevronRight className="h-3 w-3 text-muted-foreground/60" />
            {isLast ? (
              <span className="font-medium text-foreground">{name}</span>
            ) : (
              <Link to={path} className="hover:text-foreground transition-colors">
                {name}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
