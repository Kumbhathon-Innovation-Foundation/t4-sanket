// Events & Peaks
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getEvents } from "@/services";
import { PageHeader, MetricCard, MetricStrip, LoadingState } from "@/components/admin";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { FilterBar, SearchInput } from "@/components/admin/FilterBar";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Calendar, Plus, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/admin/events/")({ component: EventsPage });

function EventsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const events = useQuery({ queryKey: ["events"], queryFn: getEvents });

  if (events.isLoading) return <LoadingState />;
  const all = events.data ?? [];
  const filtered = all.filter((e) => !search || e.name.toLowerCase().includes(search.toLowerCase()));
  const published = all.filter((e) => e.published).length;
  const totalExpected = all.reduce((a, e) => a + e.expectedCrowd, 0);

  return (
    <div className="space-y-5">
      <PageHeader title="Events & Peaks" subtitle="Manage ritual events, snan days and crowd-peak planning" actions={<Button size="sm" className="bg-saffron hover:bg-saffron/90 text-saffron-foreground"><Plus className="mr-1.5 h-3.5 w-3.5" /> Add Event</Button>} />
      <MetricStrip>
        <MetricCard label="Total Events" value={all.length} icon={<Calendar className="h-4 w-4" />} />
        <MetricCard label="Published" value={published} />
        <MetricCard label="Expected Crowd" value={totalExpected} />
        <MetricCard label="Zones Affected" value={[...new Set(all.flatMap((e) => e.affectedZoneIds))].length} />
      </MetricStrip>
      <div className="rounded-lg border bg-card p-4">
        <FilterBar className="mb-3"><SearchInput value={search} onChange={setSearch} placeholder="Search events…" className="w-56" /></FilterBar>
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead><tr className="border-b text-left"><th className="pb-2 pr-4 font-medium text-muted-foreground">Event</th><th className="pb-2 pr-4 font-medium text-muted-foreground">Date</th><th className="pb-2 pr-4 font-medium text-muted-foreground">Peak</th><th className="pb-2 pr-4 font-medium text-muted-foreground">Expected Crowd</th><th className="pb-2 pr-4 font-medium text-muted-foreground">Zones</th><th className="pb-2 pr-4 font-medium text-muted-foreground">Published</th><th className="pb-2"></th></tr></thead>
            <tbody>
              {filtered.map((e) => (
                <tr key={e.id} className="border-b border-border/50 hover:bg-muted/30 cursor-pointer" onClick={() => navigate({ to: "/admin/events/$eventId", params: { eventId: e.id } })}>
                  <td className="py-2.5 pr-4"><div className="font-medium">{e.name}</div><div className="text-[11px] text-muted-foreground">{e.type || "Event"}</div></td>
                  <td className="py-2.5 pr-4 text-muted-foreground">{e.date}</td>
                  <td className="py-2.5 pr-4 text-muted-foreground">{e.start}–{e.end} (peak {e.peak})</td>
                  <td className="py-2.5 pr-4 font-medium">{e.expectedCrowd.toLocaleString()}</td>
                  <td className="py-2.5 pr-4 text-muted-foreground">{e.affectedZoneIds.join(", ")}</td>
                  <td className="py-2.5 pr-4">{e.published ? <span className="text-ops-stable text-[11px]">Published</span> : <span className="text-muted-foreground text-[11px]">Draft</span>}</td>
                  <td className="py-2.5"><Button variant="ghost" size="sm" className="h-7"><ArrowRight className="h-3 w-3" /></Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
