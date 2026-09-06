// Route Detail Page
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getRoute, setRouteStatus } from "@/services";
import { PageHeader, MetricCard, MetricStrip, MapPanel, MapLegend, LoadingState } from "@/components/admin";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Ban, CheckCircle2, AlertTriangle, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/routes/$routeId")({ component: RouteDetailPage });

function RouteDetailPage() {
  const { routeId } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const routeQuery = useQuery({
    queryKey: ["route", routeId],
    queryFn: () => getRoute(routeId),
  });

  const updateStatus = useMutation({
    mutationFn: (status: "RECOMMENDED" | "CONGESTED" | "CLOSED" | "DIVERSION") =>
      setRouteStatus(routeId, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["route", routeId] });
      qc.invalidateQueries({ queryKey: ["routes"] });
      toast.success("Route status updated");
    },
  });

  if (routeQuery.isLoading) return <LoadingState />;
  const route = routeQuery.data;
  if (!route) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-lg font-semibold">Route not found</h2>
        <Button variant="outline" className="mt-4" onClick={() => navigate({ to: "/admin/routes" })}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Routes
        </Button>
      </div>
    );
  }

  const routeColor =
    route.status === "RECOMMENDED"
      ? "#4aa860"
      : route.status === "CONGESTED"
        ? "#c84040"
        : route.status === "CLOSED"
          ? "#888888"
          : "#c89030";

  return (
    <div className="space-y-5">
      <PageHeader
        title={route.name || route.id}
        subtitle={`Route ID: ${route.id} · Connects ${route.fromZone || route.from} to ${route.toZone || route.to}`}
        actions={
          <Button variant="outline" size="sm" onClick={() => navigate({ to: "/admin/routes" })}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Routes
          </Button>
        }
      />

      <MetricStrip>
        <MetricCard
          label="Status"
          value={<StatusBadge value={route.status} dot />}
          sublabel={`${route.updatedMinutesAgo}m ago`}
        />
        <MetricCard
          label="Current Crowd"
          value={<StatusBadge value={route.crowd} kind="crowd" />}
          sublabel="Real-time sensor feed"
        />
        <MetricCard label="Distance" value={`${route.distanceKm} km`} sublabel="Pedestrian path" />
        <MetricCard label="Estimated Walk" value={`${route.walkMinutes} min`} sublabel="Average pace" />
      </MetricStrip>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="rounded-lg border bg-card p-4">
            <h3 className="mb-3 text-sm font-semibold text-foreground">Route Trajectory</h3>
            <MapPanel
              routes={[{ path: route.path, color: routeColor, dashed: route.status === "CLOSED" || route.status === "DIVERSION" }]}
              markers={[
                { id: "start", point: route.path[0] ?? { x: 20, y: 50 }, label: route.fromZone || route.from, color: "#4aa860", size: "md" },
                { id: "end", point: route.path[route.path.length - 1] ?? { x: 80, y: 50 }, label: route.toZone || route.to, color: "#c75b12", size: "md" },
              ]}
              height="360px"
              legend={
                <MapLegend
                  items={[
                    { color: "#4aa860", label: `Start: ${route.fromZone || route.from}` },
                    { color: "#c75b12", label: `Destination: ${route.toZone || route.to}` },
                  ]}
                />
              }
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border bg-card p-4">
            <h3 className="mb-3 text-sm font-semibold text-foreground">Route Controls</h3>
            <p className="mb-4 text-xs text-muted-foreground">
              Override operational status for pilgrim navigation guidance across apps and digital displays.
            </p>
            <div className="grid grid-cols-1 gap-2">
              <Button
                variant={route.status === "RECOMMENDED" ? "default" : "outline"}
                size="sm"
                className="justify-start gap-2 text-xs"
                onClick={() => updateStatus.mutate("RECOMMENDED")}
              >
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                Set Recommended
              </Button>
              <Button
                variant={route.status === "CONGESTED" ? "default" : "outline"}
                size="sm"
                className="justify-start gap-2 text-xs"
                onClick={() => updateStatus.mutate("CONGESTED")}
              >
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Set Congested
              </Button>
              <Button
                variant={route.status === "DIVERSION" ? "default" : "outline"}
                size="sm"
                className="justify-start gap-2 text-xs"
                onClick={() => updateStatus.mutate("DIVERSION")}
              >
                <RefreshCw className="h-4 w-4 text-blue-500" />
                Set Diversion
              </Button>
              <Button
                variant={route.status === "CLOSED" ? "destructive" : "outline"}
                size="sm"
                className="justify-start gap-2 text-xs"
                onClick={() => updateStatus.mutate("CLOSED")}
              >
                <Ban className="h-4 w-4" />
                Close Route
              </Button>
            </div>
          </div>

          <div className="rounded-lg border bg-card p-4">
            <h3 className="mb-2 text-sm font-semibold text-foreground">Route Details</h3>
            <dl className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b">
                <dt className="text-muted-foreground">From Zone</dt>
                <dd className="font-medium">{route.fromZone || route.from}</dd>
              </div>
              <div className="flex justify-between py-1 border-b">
                <dt className="text-muted-foreground">To Zone</dt>
                <dd className="font-medium">{route.toZone || route.to}</dd>
              </div>
              <div className="flex justify-between py-1 border-b">
                <dt className="text-muted-foreground">Waypoints Count</dt>
                <dd className="font-medium">{route.path.length}</dd>
              </div>
              <div className="flex justify-between py-1">
                <dt className="text-muted-foreground">Last Status Change</dt>
                <dd className="font-medium">{route.updatedMinutesAgo} min ago</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
