// Event Detail
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getEvent } from "@/services";
import { PageHeader, MapPanel, LoadingState } from "@/components/admin";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Bell, Edit } from "lucide-react";

export const Route = createFileRoute("/admin/events/$eventId")({ component: EventDetail });

function EventDetail() {
  const { eventId } = Route.useParams();
  const navigate = useNavigate();
  const event = useQuery({ queryKey: ["event", eventId], queryFn: () => getEvent(eventId) });

  if (event.isLoading) return <LoadingState />;
  const e = event.data;
  if (!e) return <div className="py-16 text-center text-muted-foreground">Event not found</div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3"><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate({ to: "/admin/events" })}><ArrowLeft className="h-4 w-4" /></Button><PageHeader title={e.name} subtitle={`${e.type || "Event"} · ${e.date}`} actions={<div className="flex gap-2"><Button variant="outline" size="sm"><Edit className="mr-1 h-3.5 w-3.5" /> Edit</Button><Button variant="outline" size="sm" onClick={() => navigate({ to: "/admin/alerts/create", search: { zoneId: e.affectedZoneIds?.[0], severity: "INFORMATION", title: `Event: ${e.name}` } as any })}><Bell className="mr-1 h-3.5 w-3.5" /> Create Alert</Button></div>} /></div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-card p-3"><span className="text-[10px] font-medium uppercase text-muted-foreground">Date</span><div className="mt-1 text-sm font-semibold">{e.date}</div></div>
        <div className="rounded-lg border bg-card p-3"><span className="text-[10px] font-medium uppercase text-muted-foreground">Schedule</span><div className="mt-1 text-sm font-semibold">{e.start} – {e.end}</div><div className="text-[11px] text-muted-foreground">Peak at {e.peak}</div></div>
        <div className="rounded-lg border bg-card p-3"><span className="text-[10px] font-medium uppercase text-muted-foreground">Expected Crowd</span><div className="mt-1 text-lg font-semibold">{e.expectedCrowd.toLocaleString()}</div></div>
        <div className="rounded-lg border bg-card p-3"><span className="text-[10px] font-medium uppercase text-muted-foreground">Published</span><div className="mt-1 text-sm font-semibold">{e.published ? "Yes" : "Draft"}</div></div>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-lg border bg-card p-4">
            <span className="text-[13px] font-semibold mb-2 block">Affected Zones</span>
            <div className="flex flex-wrap gap-1.5">{e.affectedZoneIds.map((z) => <StatusBadge key={z} value={z} size="md" />)}</div>
          </div>
          {e.notes && <div className="rounded-lg border bg-card p-4"><span className="text-[13px] font-semibold mb-2 block">Notes</span><p className="text-[13px] text-muted-foreground">{e.notes}</p></div>}
        </div>
        {/* Timeline */}
        <div className="rounded-lg border bg-card p-4">
          <span className="text-[13px] font-semibold mb-3 block">Event Timeline</span>
          <div className="space-y-4">
            <div className="flex gap-3"><div className="flex flex-col items-center"><div className="h-3 w-3 rounded-full bg-saffron/30 border-2 border-saffron" /><div className="w-px flex-1 bg-border" /></div><div><p className="text-[12px] font-medium">Pre-Peak Phase</p><p className="text-[11px] text-muted-foreground">{e.start} — Crowd management begins</p></div></div>
            <div className="flex gap-3"><div className="flex flex-col items-center"><div className="h-3 w-3 rounded-full bg-ops-critical/30 border-2 border-ops-critical" /><div className="w-px flex-1 bg-border" /></div><div><p className="text-[12px] font-medium">Peak Phase</p><p className="text-[11px] text-muted-foreground">{e.peak} — Maximum crowd density</p></div></div>
            <div className="flex gap-3"><div className="flex flex-col items-center"><div className="h-3 w-3 rounded-full bg-ops-stable/30 border-2 border-ops-stable" /></div><div><p className="text-[12px] font-medium">Post-Peak Phase</p><p className="text-[11px] text-muted-foreground">{e.end} — Crowd dispersal</p></div></div>
          </div>
        </div>
      </div>
    </div>
  );
}
