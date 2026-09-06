// Create Alert / Broadcast
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createAlert } from "@/services";
import { PageHeader } from "@/components/admin";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { ArrowLeft, Radio, Send, Bell, ShieldAlert, Volume2, Smartphone } from "lucide-react";
import { toast } from "sonner";
import type { OpsAlert, AlertSeverity } from "@/types";

interface AlertSearchParams {
  zoneId?: string | undefined;
  severity?: AlertSeverity | undefined;
  title?: string | undefined;
}

export const Route = createFileRoute("/admin/alerts/create")({
  validateSearch: (search: Record<string, unknown>): AlertSearchParams => ({
    zoneId: typeof search["zoneId"] === "string" ? (search["zoneId"] as string) : undefined,
    severity: typeof search["severity"] === "string" ? (search["severity"] as AlertSeverity) : undefined,
    title: typeof search["title"] === "string" ? (search["title"] as string) : undefined,
  }),
  component: CreateAlertPage,
});

function CreateAlertPage() {
  const navigate = useNavigate();
  const searchParams = Route.useSearch();
  const qc = useQueryClient();

  const [title, setTitle] = useState(
    searchParams.title || (searchParams.zoneId ? `Elevated Crowd Surge Advisory for ${searchParams.zoneId}` : "")
  );
  const [message, setMessage] = useState(
    searchParams.zoneId
      ? `High pedestrian influx reported at ${searchParams.zoneId}. Marshals are advising caution and directing devotees to alternate corridors.`
      : ""
  );
  const [severity, setSeverity] = useState<AlertSeverity>(searchParams.severity || "WARNING");
  const [type, setType] = useState<OpsAlert["type"]>("CROWD");
  const [zoneId, setZoneId] = useState(searchParams.zoneId || "Z07");
  const [channels, setChannels] = useState<string[]>([
    "PILGRIM_APP",
    "VOLUNTEER_RADIO",
    "DIGITAL_SIGNAGE",
  ]);

  const toggleChannel = (ch: string) => {
    setChannels((prev) =>
      prev.includes(ch) ? prev.filter((x) => x !== ch) : [...prev, ch]
    );
  };

  const publishMutation = useMutation({
    mutationFn: async () => {
      const newAlert: OpsAlert = {
        id: `ALT-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
        title,
        message,
        type,
        severity,
        audience: channels,
        zoneId: zoneId === "CITY_WIDE" ? undefined : zoneId,
        state: "ACTIVE",
        createdMinutesAgo: 0,
      };
      return createAlert(newAlert);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["alerts"] });
      toast.success("Alert broadcasted successfully across selected channels!");
      navigate({ to: "/admin/alerts" });
    },
    onError: () => {
      toast.error("Failed to broadcast alert");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      toast.error("Please enter a title and message");
      return;
    }
    publishMutation.mutate();
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Broadcast Emergency Alert"
        subtitle="Publish instantaneous push alerts, digital signs, and control room warnings"
        actions={
          <Button variant="outline" size="sm" onClick={() => navigate({ to: "/admin/alerts" })}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Cancel
          </Button>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-6 rounded-lg border bg-card p-6">
        {/* Severity selection */}
        <div>
          <label className="mb-2 block text-xs font-semibold text-foreground">Alert Severity Level</label>
          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setSeverity("INFO")}
              className={`flex flex-col items-center rounded-lg border p-3 text-center transition-all ${
                severity === "INFO"
                  ? "border-blue-500 bg-blue-500/10 text-blue-600 font-semibold"
                  : "border-border hover:bg-muted/50"
              }`}
            >
              <Bell className="mb-1 h-5 w-5" />
              <span className="text-xs">Informational</span>
            </button>
            <button
              type="button"
              onClick={() => setSeverity("WARNING")}
              className={`flex flex-col items-center rounded-lg border p-3 text-center transition-all ${
                severity === "WARNING"
                  ? "border-amber-500 bg-amber-500/10 text-amber-600 font-semibold"
                  : "border-border hover:bg-muted/50"
              }`}
            >
              <Radio className="mb-1 h-5 w-5" />
              <span className="text-xs">Warning / Advisory</span>
            </button>
            <button
              type="button"
              onClick={() => setSeverity("CRITICAL")}
              className={`flex flex-col items-center rounded-lg border p-3 text-center transition-all ${
                severity === "CRITICAL"
                  ? "border-red-500 bg-red-500/10 text-red-600 font-semibold"
                  : "border-border hover:bg-muted/50"
              }`}
            >
              <ShieldAlert className="mb-1 h-5 w-5" />
              <span className="text-xs">Critical Emergency</span>
            </button>
          </div>
        </div>

        {/* Category & Zone */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold text-foreground">Category</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as OpsAlert["type"])}
              className="w-full rounded border bg-background px-3 py-2 text-xs"
            >
              <option value="GENERAL">General Operational</option>
              <option value="CROWD">Crowd Density / Surge</option>
              <option value="FOOD">Food / Kitchen Shortage</option>
              <option value="ROUTE">Route Closure / Diversion</option>
              <option value="FACILITY">Medical / Sanitation Facility</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-foreground">Target Zone</label>
            <select
              value={zoneId}
              onChange={(e) => setZoneId(e.target.value)}
              className="w-full rounded border bg-background px-3 py-2 text-xs"
            >
              <option value="CITY_WIDE">Entire Nashik Kumbh Area (All Zones)</option>
              <option value="Z01">Zone 01 — Trimbakeshwar Approach</option>
              <option value="Z02">Zone 02 — Tapovan Corridor</option>
              <option value="Z03">Zone 03 — Panchavati North</option>
              <option value="Z04">Zone 04 — Ramkund Ghat Belt</option>
              <option value="Z05">Zone 05 — Gadge Maharaj Bridge</option>
              <option value="Z06">Zone 06 — Sadhugram Sector B</option>
              <option value="Z07">Zone 07 — Kushavarta Feeder</option>
              <option value="Z08">Zone 08 — Main Snan Ghat</option>
            </select>
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="mb-1 block text-xs font-semibold text-foreground">Broadcast Headline / Title</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Temporary Diversion at Ram Kund North Steps"
            className="w-full rounded border bg-background px-3 py-2 text-xs"
          />
        </div>

        {/* Message body */}
        <div>
          <label className="mb-1 block text-xs font-semibold text-foreground">Detailed Message / Pilgrim Instructions</label>
          <textarea
            required
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Provide clear, concise guidance in plain language for pilgrims and field officers..."
            className="w-full rounded border bg-background px-3 py-2 text-xs"
          />
        </div>

        {/* Delivery Channels */}
        <div>
          <label className="mb-2 block text-xs font-semibold text-foreground">Broadcast Channels</label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 text-xs">
            {[
              { id: "PILGRIM_APP", label: "Pilgrim App Push", icon: Smartphone },
              { id: "VOLUNTEER_RADIO", label: "Volunteer Mesh", icon: Radio },
              { id: "DIGITAL_SIGNAGE", label: "VMS Highway Signs", icon: Bell },
              { id: "PA_SYSTEM", label: "Ghat PA Audio", icon: Volume2 },
            ].map((ch) => {
              const Icon = ch.icon;
              const active = channels.includes(ch.id);
              return (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => toggleChannel(ch.id)}
                  className={`flex items-center gap-2 rounded border p-2.5 transition-all text-left ${
                    active
                      ? "border-primary bg-primary/10 text-primary font-medium"
                      : "border-border text-muted-foreground hover:bg-muted/40"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{ch.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Preview box */}
        <div className="rounded-lg border border-dashed border-border bg-muted/20 p-4">
          <div className="mb-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Broadcast Preview
          </div>
          <div className="rounded-md border bg-card p-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground">{title || "Alert Headline"}</span>
              <span className="text-[10px] uppercase font-semibold text-amber-500">{severity}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {message || "The advisory message content will appear here across recipient devices."}
            </p>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => navigate({ to: "/admin/alerts" })}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={publishMutation.isPending}
            className="gap-2 bg-primary text-primary-foreground"
          >
            <Send className="h-4 w-4" />
            {publishMutation.isPending ? "Broadcasting..." : "Send Live Broadcast"}
          </Button>
        </div>
      </form>
    </div>
  );
}
