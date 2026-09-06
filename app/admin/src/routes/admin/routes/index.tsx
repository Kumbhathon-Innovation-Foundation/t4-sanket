// Routes & Closures
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getRoutes, setRouteStatus } from "@/services";
import { PageHeader, MetricCard, MetricStrip, MapPanel, MapLegend, PriorityPanel, LoadingState } from "@/components/admin";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { FilterBar, SearchInput } from "@/components/admin/FilterBar";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Route as RouteIcon, ArrowRight, Ban, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/routes/")({ component: RoutesPage });

function RoutesPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const routes = useQuery({ queryKey: ["routes"], queryFn: getRoutes });
  const updateStatus = useMutation({ mutationFn: ({ id, status }: { id: string; status: "RECOMMENDED" | "CONGESTED" | "CLOSED" | "DIVERSION" }) => setRouteStatus(id, status), onSuccess: () => { qc.invalidateQueries({ queryKey: ["routes"] }); toast.success("Route status updated"); } });

  if (routes.isLoading) return <LoadingState />;
  const all = routes.data ?? [];
  const filtered = all.filter((r) => !search || (r.name || r.id).toLowerCase().includes(search.toLowerCase()));
  const closedRoutes = all.filter((r) => r.status === "CLOSED");
  const congestedRoutes = all.filter((r) => r.status === "CONGESTED");

  return (
    <div className="space-y-5">
      <PageHeader title="Routes & Closures" subtitle="Manage pilgrim routes, diversions and closures" />
      <MetricStrip>
        <MetricCard label="Total Routes" value={all.length} icon={<RouteIcon className="h-4 w-4" />} />
        <MetricCard label="Recommended" value={all.filter((r) => r.status === "RECOMMENDED").length} variant="success" />
        <MetricCard label="Congested" value={congestedRoutes.length} variant={congestedRoutes.length > 0 ? "warning" : "default"} />
        <MetricCard label="Closed" value={closedRoutes.length} variant={closedRoutes.length > 0 ? "critical" : "default"} />
      </MetricStrip>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <MapPanel
            routes={all.map((r) => ({ path: r.path, color: r.status === "RECOMMENDED" ? "#4aa860" : r.status === "CONGESTED" ? "#c84040" : r.status === "CLOSED" ? "#888" : "#c89030", dashed: r.status === "CLOSED" || r.status === "DIVERSION" }))}
            height="320px"
            legend={<MapLegend items={[{ color: "#4aa860", label: "Recommended" }, { color: "#c84040", label: "Congested" }, { color: "#888", label: "Closed" }, { color: "#c89030", label: "Diversion" }]} />}
          />
        </div>
        <PriorityPanel title="Active Conditions" items={[...closedRoutes, ...congestedRoutes].map((r) => ({ id: r.id, title: r.name || r.id, subtitle: `${r.status} · ${r.fromZone || r.from} → ${r.toZone || r.to}`, severity: r.status === "CLOSED" ? "critical" as const : "warning" as const }))} />
      </div>
      <div className="rounded-lg border bg-card p-4">
        <FilterBar className="mb-3"><SearchInput value={search} onChange={setSearch} placeholder="Search routes…" className="w-56" /></FilterBar>
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead><tr className="border-b text-left"><th className="pb-2 pr-4 font-medium text-muted-foreground">Route</th><th className="pb-2 pr-4 font-medium text-muted-foreground">From</th><th className="pb-2 pr-4 font-medium text-muted-foreground">To</th><th className="pb-2 pr-4 font-medium text-muted-foreground">Distance</th><th className="pb-2 pr-4 font-medium text-muted-foreground">Walk</th><th className="pb-2 pr-4 font-medium text-muted-foreground">Status</th><th className="pb-2 pr-4 font-medium text-muted-foreground">Crowd</th><th className="pb-2 font-medium text-muted-foreground">Actions</th></tr></thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="py-2.5 pr-4"><div className="font-medium">{r.id}</div><div className="text-[11px] text-muted-foreground">{r.name || r.id}</div></td>
                  <td className="py-2.5 pr-4 text-muted-foreground">{r.fromZone || r.from}</td>
                  <td className="py-2.5 pr-4 text-muted-foreground">{r.toZone || r.to}</td>
                  <td className="py-2.5 pr-4">{r.distanceKm} km</td>
                  <td className="py-2.5 pr-4">{r.walkMinutes ?? r.walkingMinutes} min</td>
                  <td className="py-2.5 pr-4"><StatusBadge value={r.status} dot /></td>
                  <td className="py-2.5 pr-4"><StatusBadge value={r.crowd} kind="crowd" /></td>
                  <td className="py-2.5">
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" className="h-7 text-[11px]" onClick={() => navigate({ to: `/admin/routes/${r.id}` })} title="View Route Detail">
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                      {r.status !== "CLOSED" && <Button variant="ghost" size="sm" className="h-7 text-[11px]" onClick={() => updateStatus.mutate({ id: r.id, status: "CLOSED" })} title="Close Route"><Ban className="h-3 w-3 text-red-500" /></Button>}
                      {r.status === "CLOSED" && <Button variant="ghost" size="sm" className="h-7 text-[11px]" onClick={() => updateStatus.mutate({ id: r.id, status: "RECOMMENDED" })} title="Reopen Route"><RefreshCw className="h-3 w-3 text-emerald-500" /></Button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
