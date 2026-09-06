// Reports & Analytics
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getDashboardStats, getSeries, getCrowdZones, getKitchens, getParking } from "@/services";
import { PageHeader, MetricCard, MetricStrip, LoadingState } from "@/components/admin";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Download, FileText, Share2, BarChart3, TrendingUp, Users, Utensils, Car, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/reports/")({
  component: ReportsPage,
});

function ReportsPage() {
  const [timeRange, setTimeRange] = useState("TODAY");
  const stats = useQuery({ queryKey: ["dashboard-stats"], queryFn: getDashboardStats });
  const series = useQuery({ queryKey: ["series"], queryFn: getSeries });
  const zones = useQuery({ queryKey: ["crowd-zones"], queryFn: getCrowdZones });
  const kitchens = useQuery({ queryKey: ["kitchens"], queryFn: getKitchens });
  const parking = useQuery({ queryKey: ["parking"], queryFn: getParking });

  if (stats.isLoading || series.isLoading) return <LoadingState />;

  const sData = series.data;
  const crowdSeries = sData?.crowd ?? [];
  const foodSeries = sData?.food ?? [];
  const parkingSeries = sData?.parking ?? [];

  const maxCrowd = Math.max(...crowdSeries.map((d: any) => d.pilgrims ?? d.value ?? 100), 100);

  const handleExport = (format: string) => {
    toast.success(`Exporting ${format} shift report for Nashik Kumbh Command...`);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Operations Reports & Executive Analytics"
        subtitle="End-of-shift debriefs, multi-domain throughput metrics, and predictive trend reports"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => handleExport("CSV")}>
              <Download className="h-3.5 w-3.5" /> CSV Data
            </Button>
            <Button
              size="sm"
              className="gap-1.5 text-xs bg-primary text-primary-foreground"
              onClick={() => handleExport("PDF")}
            >
              <FileText className="h-3.5 w-3.5" /> Shift Debrief PDF
            </Button>
          </div>
        }
      />

      {/* Range filter bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card p-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground">Reporting Window:</span>
          {["TODAY", "SHAHI_SNAN_1", "LAST_7_DAYS", "SEASON_TOTAL"].map((r) => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className={`rounded px-2.5 py-1 text-xs font-medium transition-all ${
                timeRange === r
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {r === "TODAY"
                ? "Today (Live Shift)"
                : r === "SHAHI_SNAN_1"
                  ? "Shahi Snan Peak Day"
                  : r === "LAST_7_DAYS"
                    ? "Last 7 Days"
                    : "Season Aggregate"}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
          <span>Operational Efficiency: <strong className="text-foreground">96.4%</strong></span>
        </div>
      </div>

      <MetricStrip>
        <MetricCard
          label="Total Day Footfall"
          value="1,428,500"
          icon={<Users className="h-4 w-4" />}
          sublabel="Peak throughput 11:30 AM"
          variant="info"
        />
        <MetricCard
          label="Prasadam Meals Served"
          value="342,800"
          icon={<Utensils className="h-4 w-4" />}
          sublabel="Zero stockout events"
          variant="success"
        />
        <MetricCard
          label="Parking Vehicle Turns"
          value="48,200"
          icon={<Car className="h-4 w-4" />}
          sublabel="Avg hold 3.1 hours"
        />
        <MetricCard
          label="Mean Incident Time"
          value="12.4 min"
          icon={<ShieldAlert className="h-4 w-4" />}
          sublabel="-3.2 min vs target"
          variant="success"
        />
      </MetricStrip>

      {/* Analytics Charts Grid */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Crowd footfall hourly chart */}
        <div className="rounded-lg border bg-card p-4">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Pilgrim Hourly Inflow & Density</h3>
              <p className="text-xs text-muted-foreground">Sensor aggregates across Ram Kund and Ghat perimeters</p>
            </div>
            <Badge variant="outline" className="text-[10px]">Real-time CCTV/IoT</Badge>
          </div>
          <div className="h-56 w-full flex items-end gap-2 pt-4">
            {crowdSeries.map((point: any, idx: number) => {
              const val = point.pilgrims ?? point.value ?? 50;
              const heightPct = Math.max(12, Math.round((val / maxCrowd) * 100));
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1 group">
                  <span className="text-[9px] font-medium text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                    {(val / 1000).toFixed(0)}k
                  </span>
                  <div
                    className="w-full rounded-t bg-primary/80 transition-all group-hover:bg-primary"
                    style={{ height: `${heightPct}%` }}
                  />
                  <span className="text-[9px] text-muted-foreground whitespace-nowrap overflow-hidden">
                    {point.hour || `${idx}:00`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Food Supply vs Demand chart */}
        <div className="rounded-lg border bg-card p-4">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Food Kitchen Supply vs Demand</h3>
              <p className="text-xs text-muted-foreground">Prasadam buffer surplus maintaining zero deficit</p>
            </div>
            <div className="flex gap-2 text-[10px]">
              <span className="flex items-center gap-1 text-emerald-500">
                <span className="h-2 w-2 rounded-full bg-emerald-500" /> Supplied
              </span>
              <span className="flex items-center gap-1 text-amber-500">
                <span className="h-2 w-2 rounded-full bg-amber-500" /> Demand
              </span>
            </div>
          </div>
          <div className="h-56 w-full flex items-end gap-2 pt-4">
            {foodSeries.map((point: any, idx: number) => {
              const sup = point.supplied ?? point.value ?? 80;
              const dem = point.demand ?? Math.round(sup * 0.85);
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                  <div className="flex w-full items-end justify-center gap-1 h-44">
                    <div
                      className="w-1/2 rounded-t bg-emerald-500/80 hover:bg-emerald-500"
                      style={{ height: `${Math.min(100, sup)}%` }}
                    />
                    <div
                      className="w-1/2 rounded-t bg-amber-500/80 hover:bg-amber-500"
                      style={{ height: `${Math.min(100, dem)}%` }}
                    />
                  </div>
                  <span className="text-[9px] text-muted-foreground">{point.hour || `${idx}:00`}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Zone Performance Table */}
      <div className="rounded-lg border bg-card p-4">
        <h3 className="mb-1 text-sm font-semibold text-foreground">Sector Breakdown & Congestion Index</h3>
        <p className="mb-3 text-xs text-muted-foreground">Aggregated sector health scores for high-command briefings</p>
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-2 pr-4 font-medium text-muted-foreground">Zone Sector</th>
                <th className="pb-2 pr-4 font-medium text-muted-foreground">Peak Density</th>
                <th className="pb-2 pr-4 font-medium text-muted-foreground">Incidents Logged</th>
                <th className="pb-2 pr-4 font-medium text-muted-foreground">Avg Wait Time</th>
                <th className="pb-2 pr-4 font-medium text-muted-foreground">Medical Interventions</th>
                <th className="pb-2 font-medium text-muted-foreground">Clearance Status</th>
              </tr>
            </thead>
            <tbody>
              {(zones.data ?? []).map((z) => (
                <tr key={z.id} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="py-2.5 pr-4">
                    <div className="font-semibold text-foreground">{z.name}</div>
                    <div className="text-[10px] text-muted-foreground">{z.id}</div>
                  </td>
                  <td className="py-2.5 pr-4 font-medium">
                    {z.pilgrims.toLocaleString()} pilgrims ({z.crowd})
                  </td>
                  <td className="py-2.5 pr-4">{z.crowd === "PEAK" ? "14" : z.crowd === "HIGH" ? "8" : "2"}</td>
                  <td className="py-2.5 pr-4">{z.crowd === "PEAK" ? "42 min" : z.crowd === "HIGH" ? "24 min" : "6 min"}</td>
                  <td className="py-2.5 pr-4">{z.crowd === "PEAK" ? "11" : "3"}</td>
                  <td className="py-2.5">
                    <Badge variant={z.crowd === "PEAK" ? "destructive" : "outline"} className="text-[10px]">
                      {z.crowd === "PEAK" ? "Heavy Queue" : "Normal Flow"}
                    </Badge>
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
