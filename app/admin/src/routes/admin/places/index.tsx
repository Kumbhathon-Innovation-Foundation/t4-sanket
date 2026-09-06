// Places & Discover
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPlaces, setPlacePublished } from "@/services";
import { PageHeader, LoadingState } from "@/components/admin";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { FilterBar, SearchInput, FilterSelect } from "@/components/admin/FilterBar";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Plus, ArrowRight, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/places/")({ component: PlacesPage });

function PlacesPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const places = useQuery({ queryKey: ["places"], queryFn: getPlaces });
  const togglePublish = useMutation({ mutationFn: ({ id, pub }: { id: string; pub: boolean }) => setPlacePublished(id, pub), onSuccess: () => { qc.invalidateQueries({ queryKey: ["places"] }); toast.success("Place updated"); } });

  if (places.isLoading) return <LoadingState />;
  const all = places.data ?? [];
  const filtered = all.filter((p) => catFilter === "all" || p.category === catFilter).filter((p) => !search || p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-5">
      <PageHeader title="Places & Discover" subtitle="Manage Ghats, temples, historic and cultural places" actions={<Button size="sm" className="bg-saffron hover:bg-saffron/90 text-saffron-foreground"><Plus className="mr-1.5 h-3.5 w-3.5" /> Add Place</Button>} />
      <div className="rounded-lg border bg-card p-4">
        <FilterBar className="mb-3">
          <SearchInput value={search} onChange={setSearch} placeholder="Search places…" className="w-56" />
          <FilterSelect label="Category" value={catFilter} options={[{ value: "all", label: "All" }, { value: "GHAT", label: "Ghat" }, { value: "TEMPLE", label: "Temple" }, { value: "HISTORIC", label: "Historic" }, { value: "AKHARA", label: "Akhara" }, { value: "CULTURAL", label: "Cultural" }]} onChange={setCatFilter} />
        </FilterBar>
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead><tr className="border-b text-left"><th className="pb-2 pr-4 font-medium text-muted-foreground">Place</th><th className="pb-2 pr-4 font-medium text-muted-foreground">Category</th><th className="pb-2 pr-4 font-medium text-muted-foreground">Zone</th><th className="pb-2 pr-4 font-medium text-muted-foreground">Published</th><th className="pb-2 pr-4 font-medium text-muted-foreground">Verification</th><th className="pb-2 pr-4 font-medium text-muted-foreground">Updated</th><th className="pb-2"></th></tr></thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-b border-border/50 hover:bg-muted/30 cursor-pointer" onClick={() => navigate({ to: "/admin/places/$placeId", params: { placeId: p.id } })}>
                  <td className="py-2.5 pr-4"><div className="font-medium">{p.name}</div><div className="text-[11px] text-muted-foreground line-clamp-1">{p.shortDescription}</div></td>
                  <td className="py-2.5 pr-4"><StatusBadge value={p.category} /></td>
                  <td className="py-2.5 pr-4 text-muted-foreground">{p.zoneId}</td>
                  <td className="py-2.5 pr-4">
                    <button onClick={(e) => { e.stopPropagation(); togglePublish.mutate({ id: p.id, pub: !p.published }); }} className="flex items-center gap-1 text-[11px]">
                      {p.published ? <><Eye className="h-3 w-3 text-ops-stable" /> Published</> : <><EyeOff className="h-3 w-3 text-muted-foreground" /> Draft</>}
                    </button>
                  </td>
                  <td className="py-2.5 pr-4"><StatusBadge value={p.verification} dot /></td>
                  <td className="py-2.5 pr-4 text-muted-foreground">{p.updatedMinutesAgo}m</td>
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
