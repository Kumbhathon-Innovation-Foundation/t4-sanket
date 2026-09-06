// Settings & System Configuration
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/admin";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import {
  Sliders,
  Bell,
  Database,
  MapPin,
  RefreshCw,
  Save,
  CheckCircle2,
  SlidersHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import { resetStore } from "@/services/mock/store";
import { useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/admin/settings/")({
  component: SettingsPage,
});

function SettingsPage() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<"general" | "thresholds" | "sensors" | "integrations">("general");

  // State settings
  const [refreshRate, setRefreshRate] = useState("10");
  const [crowdHighThreshold, setCrowdHighThreshold] = useState("75");
  const [crowdPeakThreshold, setCrowdPeakThreshold] = useState("90");
  const [foodWarningThreshold, setFoodWarningThreshold] = useState("80");
  const [parkingAlertThreshold, setParkingAlertThreshold] = useState("85");
  const [pushNotifications, setPushNotifications] = useState(true);
  const [vmsBridge, setVmsBridge] = useState(true);
  const [paBridge, setPaBridge] = useState(false);

  const handleSave = () => {
    toast.success("Operations control settings updated successfully");
  };

  const handleResetDemo = () => {
    resetStore();
    qc.invalidateQueries();
    toast.success("Simulation environment reset to baseline Kumbh scenario");
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Command Center Settings"
        subtitle="System parameters, operational alert thresholds, telemetry feeds, and external integrations"
        actions={
          <Button size="sm" className="gap-2 bg-primary text-primary-foreground" onClick={handleSave}>
            <Save className="h-4 w-4" /> Save Configuration
          </Button>
        }
      />

      {/* Tabs */}
      <div className="flex border-b border-border">
        {[
          { id: "general", label: "General & Identity", icon: Sliders },
          { id: "thresholds", label: "Alert Thresholds", icon: SlidersHorizontal },
          { id: "sensors", label: "Telemetry & Simulation", icon: Database },
          { id: "integrations", label: "Broadcast Gateways", icon: Bell },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition-all ${
                active
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "general" && (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border bg-card p-5 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Operational Deployment Info</h3>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Event Designation</label>
              <input
                type="text"
                readOnly
                value="Nashik Trimbakeshwar Kumbh Mela 2027"
                className="w-full rounded border bg-muted/40 px-3 py-1.5 text-xs font-medium text-foreground"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Command Post Center</label>
              <input
                type="text"
                readOnly
                value="Main Police Control Room, Old Agra Road, Nashik"
                className="w-full rounded border bg-muted/40 px-3 py-1.5 text-xs font-medium text-foreground"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Active Shift Operational Phase</label>
              <div className="flex items-center gap-2">
                <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                  Phase 1 · Peak Inflow Shift
                </Badge>
                <span className="text-xs text-muted-foreground">06:00 - 14:00 IST</span>
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-card p-5 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Nashik Geographic Data Layer</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b">
                <span className="text-muted-foreground">GeoJSON Source</span>
                <span className="font-mono text-foreground font-medium">data/nashik-all.geojson</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="text-muted-foreground">Total Indexed Features</span>
                <span className="font-semibold text-foreground">12,128 features</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="text-muted-foreground">Ghats & Holding Polygons</span>
                <span className="text-foreground">100 active zones</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="text-muted-foreground">CCTV & Surveillance Nodes</span>
                <span className="text-foreground">4,079 cameras</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Emergency Corridors</span>
                <span className="text-foreground">67 routes mapped</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "thresholds" && (
        <div className="rounded-lg border bg-card p-5 space-y-5">
          <h3 className="text-sm font-semibold text-foreground">Automated Incident Trigger Thresholds</h3>
          <p className="text-xs text-muted-foreground">
            Configure algorithmic boundaries at which automated warnings and rerouting triggers are dispatched.
          </p>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Crowd HIGH Level Threshold (% Capacity)</label>
              <input
                type="number"
                value={crowdHighThreshold}
                onChange={(e) => setCrowdHighThreshold(e.target.value)}
                className="w-full rounded border bg-background px-3 py-1.5 text-xs"
              />
              <span className="text-[11px] text-muted-foreground">Triggers warning status and volunteer standby.</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Crowd PEAK Level Threshold (% Capacity)</label>
              <input
                type="number"
                value={crowdPeakThreshold}
                onChange={(e) => setCrowdPeakThreshold(e.target.value)}
                className="w-full rounded border bg-background px-3 py-1.5 text-xs"
              />
              <span className="text-[11px] text-muted-foreground">Triggers automated perimeter holding gates & diversions.</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Food Prasadam Warning Threshold (%)</label>
              <input
                type="number"
                value={foodWarningThreshold}
                onChange={(e) => setFoodWarningThreshold(e.target.value)}
                className="w-full rounded border bg-background px-3 py-1.5 text-xs"
              />
              <span className="text-[11px] text-muted-foreground">Alerts Central Annakshetra when stock drops below estimated demand.</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Parking Overflow Divert Trigger (%)</label>
              <input
                type="number"
                value={parkingAlertThreshold}
                onChange={(e) => setParkingAlertThreshold(e.target.value)}
                className="w-full rounded border bg-background px-3 py-1.5 text-xs"
              />
              <span className="text-[11px] text-muted-foreground">Automatically directs incoming vehicle flow to secondary outer lots.</span>
            </div>
          </div>
        </div>
      )}

      {activeTab === "sensors" && (
        <div className="rounded-lg border bg-card p-5 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Telemetry & Data Synchronization</h3>
              <p className="text-xs text-muted-foreground">Polling rates for IoT sensor streams and simulated state.</p>
            </div>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={handleResetDemo}>
              <RefreshCw className="h-3.5 w-3.5" /> Reset Scenario Seed
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Control Room Polling Cadence</label>
              <select
                value={refreshRate}
                onChange={(e) => setRefreshRate(e.target.value)}
                className="w-full rounded border bg-background px-3 py-1.5 text-xs"
              >
                <option value="5">Every 5 seconds (Real-time)</option>
                <option value="10">Every 10 seconds (Balanced)</option>
                <option value="30">Every 30 seconds (Eco mode)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Live Telemetry Mode</label>
              <div className="flex items-center gap-2 pt-1">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs text-foreground font-medium">In-Memory Store Active (Fast Mock CRUD)</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Zero cold starts, rapid mutation testing, ready for Supabase client integration in Phase 2.
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === "integrations" && (
        <div className="rounded-lg border bg-card p-5 space-y-4">
          <h3 className="text-sm font-semibold text-foreground">External Gateway Bridges</h3>
          <p className="text-xs text-muted-foreground">Connected broadcast infrastructure and status</p>

          <div className="divide-y text-xs">
            <div className="flex items-center justify-between py-3">
              <div>
                <div className="font-semibold text-foreground">Kumbh Saathi Pilgrim App Push Gateway</div>
                <div className="text-muted-foreground">FCM & APNS bridge to 1.2M active pilgrim devices</div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-emerald-600 bg-emerald-500/10">Connected</Badge>
                <input
                  type="checkbox"
                  checked={pushNotifications}
                  onChange={(e) => setPushNotifications(e.target.checked)}
                  className="rounded"
                />
              </div>
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <div className="font-semibold text-foreground">Variable Message Signs (VMS) Highway Bridge</div>
                <div className="text-muted-foreground">Highway authority digital signage along NH-3 and Ring Road</div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-emerald-600 bg-emerald-500/10">Connected</Badge>
                <input
                  type="checkbox"
                  checked={vmsBridge}
                  onChange={(e) => setVmsBridge(e.target.checked)}
                  className="rounded"
                />
              </div>
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <div className="font-semibold text-foreground">Godavari Ghats Public Address Audio System</div>
                <div className="text-muted-foreground">Audio broadcasts across 14 Ghat sectors with Hindi/Marathi/English TTS</div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-amber-600 bg-amber-500/10">Standby</Badge>
                <input
                  type="checkbox"
                  checked={paBridge}
                  onChange={(e) => setPaBridge(e.target.checked)}
                  className="rounded"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
