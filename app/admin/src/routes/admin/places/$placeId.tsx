// Place Detail / CMS
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPlace, savePlace, setPlacePublished } from "@/services";
import { PageHeader, MapPanel, LoadingState } from "@/components/admin";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, Eye, EyeOff, Archive } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/places/$placeId")({ component: PlaceDetail });

function PlaceDetail() {
  const { placeId } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const place = useQuery({ queryKey: ["place", placeId], queryFn: () => getPlace(placeId) });
  const publish = useMutation({ mutationFn: (pub: boolean) => setPlacePublished(placeId, pub), onSuccess: () => { qc.invalidateQueries({ queryKey: ["place", placeId] }); qc.invalidateQueries({ queryKey: ["places"] }); toast.success("Place updated"); } });

  if (place.isLoading) return <LoadingState />;
  const p = place.data;
  if (!p) return <div className="py-16 text-center text-muted-foreground">Place not found</div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3"><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate({ to: "/admin/places" })}><ArrowLeft className="h-4 w-4" /></Button><PageHeader title={p.name} subtitle={`${p.category} · Zone ${p.zoneId}`} actions={<div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => publish.mutate(!p.published)}>{p.published ? <><EyeOff className="mr-1 h-3.5 w-3.5" /> Unpublish</> : <><Eye className="mr-1 h-3.5 w-3.5" /> Publish</>}</Button></div>} /></div>
      <div className="grid gap-5 lg:grid-cols-3">
        {/* Content */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-lg border bg-card p-4 space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <div><span className="text-[10px] font-medium uppercase text-muted-foreground">Category</span><div className="mt-1"><StatusBadge value={p.category} /></div></div>
              <div><span className="text-[10px] font-medium uppercase text-muted-foreground">Verification</span><div className="mt-1"><StatusBadge value={p.verification} dot /></div></div>
              <div><span className="text-[10px] font-medium uppercase text-muted-foreground">Languages</span><div className="mt-1 flex gap-1">{p.languages.map((l) => <Badge key={l} variant="outline" className="text-[10px]">{l}</Badge>)}</div></div>
            </div>
          </div>
          <div className="rounded-lg border bg-card p-4 space-y-3">
            <h3 className="text-[13px] font-semibold">Content</h3>
            <div><label className="text-[11px] font-medium text-muted-foreground">Short Description</label><p className="mt-1 text-[13px]">{p.shortDescription}</p></div>
            <div><label className="text-[11px] font-medium text-muted-foreground">Historical Significance</label><p className="mt-1 text-[13px]">{p.historicalSignificance}</p></div>
            <div><label className="text-[11px] font-medium text-muted-foreground">60-Second Story</label><p className="mt-1 text-[13px] italic">{p.sixtySecondStory}</p></div>
            <div><label className="text-[11px] font-medium text-muted-foreground">Cultural Context</label><p className="mt-1 text-[13px]">{p.culturalContext}</p></div>
            <div><label className="text-[11px] font-medium text-muted-foreground">Visitor Information</label><p className="mt-1 text-[13px]">{p.visitorInformation}</p></div>
          </div>
        </div>
        {/* Sidebar */}
        <div className="space-y-4">
          <MapPanel markers={[{ id: p.id, point: p.point, label: p.name, color: "#c75b12", size: "lg" }]} height="220px" />
          <div className="rounded-lg border bg-card p-4">
            <span className="text-[13px] font-semibold mb-2 block">Coordinates</span>
            <p className="text-[12px] text-muted-foreground font-mono">{p.coordinates}</p>
          </div>
          {/* Pilgrim preview */}
          <div className="rounded-lg border-2 border-dashed border-saffron/30 bg-saffron/5 p-4">
            <span className="text-[11px] font-semibold uppercase text-saffron mb-2 block">Pilgrim Preview</span>
            <div className="text-[13px] font-semibold">{p.name}</div>
            <p className="mt-1 text-[12px] text-muted-foreground">{p.shortDescription}</p>
            <div className="mt-2 rounded-md bg-card p-2 text-[11px] italic text-foreground/80">"{p.sixtySecondStory.slice(0, 120)}…"</div>
          </div>
        </div>
      </div>
    </div>
  );
}
