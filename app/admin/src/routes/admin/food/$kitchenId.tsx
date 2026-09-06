// Kitchen Detail
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getKitchen, getShortages, updateKitchenStock, verifyShortage } from "@/services";
import { PageHeader, MapPanel, LoadingState } from "@/components/admin";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Bell, Package, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/admin/food/$kitchenId")({
  component: KitchenDetail,
});

function KitchenDetail() {
  const { kitchenId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [stockInput, setStockInput] = useState("");

  const kitchen = useQuery({ queryKey: ["kitchen", kitchenId], queryFn: () => getKitchen(kitchenId) });
  const shortages = useQuery({ queryKey: ["shortages"], queryFn: getShortages });

  const updateStock = useMutation({
    mutationFn: (meals: number) => updateKitchenStock(kitchenId, meals),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kitchen", kitchenId] });
      queryClient.invalidateQueries({ queryKey: ["kitchens"] });
      toast.success("Kitchen stock updated");
      setStockInput("");
    },
  });

  const verify = useMutation({
    mutationFn: (id: string) => verifyShortage(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shortages"] });
      toast.success("Shortage verified");
    },
  });

  if (kitchen.isLoading) return <LoadingState />;
  const k = kitchen.data;
  if (!k) return <div className="py-16 text-center text-muted-foreground">Kitchen not found</div>;

  const deficit = k.estimatedDemand - k.mealsAvailable;
  const kitchenShortages = (shortages.data ?? []).filter((s) => s.kitchenId === kitchenId);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate({ to: "/admin/food" })}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader title={k.name} subtitle={`${k.operator} · Zone ${k.zoneId} · Updated ${k.updatedMinutesAgo}m ago`} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-lg border bg-card p-3">
          <span className="text-[10px] font-medium uppercase text-muted-foreground">Status</span>
          <div className="mt-1"><StatusBadge value={k.status} kind="status" size="md" /></div>
        </div>
        <div className="rounded-lg border bg-card p-3">
          <span className="text-[10px] font-medium uppercase text-muted-foreground">Meals Available</span>
          <div className="mt-1 text-lg font-semibold">{k.mealsAvailable.toLocaleString()}</div>
        </div>
        <div className="rounded-lg border bg-card p-3">
          <span className="text-[10px] font-medium uppercase text-muted-foreground">Estimated Demand</span>
          <div className="mt-1 text-lg font-semibold">{k.estimatedDemand.toLocaleString()}</div>
        </div>
        <div className="rounded-lg border bg-card p-3">
          <span className="text-[10px] font-medium uppercase text-muted-foreground">Deficit</span>
          <div className="mt-1 text-lg font-semibold">{deficit > 0 ? <span className="text-ops-critical">{deficit.toLocaleString()}</span> : <span className="text-ops-stable">0</span>}</div>
        </div>
        <div className="rounded-lg border bg-card p-3">
          <span className="text-[10px] font-medium uppercase text-muted-foreground">Data Quality</span>
          <div className="mt-1"><StatusBadge value={k.quality} dot /></div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <MapPanel
            filterCategory="food"
            showMovementControl={false}
            allowedLayers={["food", "crowd", "parking", "facilities"]}
            markers={[
              {
                id: k.id,
                point: k.point,
                label: `${k.name} (${k.id})`,
                color: k.status === "CRITICAL" ? "#ef4444" : k.status === "WARNING" ? "#f59e0b" : k.status === "CLOSED" ? "#64748b" : "#10b981",
                badge: k.status === "CRITICAL" ? "SHORTAGE" : k.status === "WARNING" ? "LOW STOCK" : k.status === "CLOSED" ? "CLOSED" : "OPEN",
                badgeBg: k.status === "CRITICAL" ? "#ef4444" : k.status === "WARNING" ? "#f59e0b" : k.status === "CLOSED" ? "#64748b" : "#10b981",
                size: "lg",
                category: "food",
              },
            ]}
            height="340px"
            initialLayers={{ food: true, crowd: false, routes: false, parking: false, facilities: false, places: false }}
          />
        </div>

        <div className="space-y-4">
          {/* Update stock */}
          <div className="rounded-lg border bg-card p-4">
            <span className="text-[13px] font-semibold mb-3 block">Update Stock</span>
            <div className="flex gap-2">
              <Input type="number" placeholder="Meals count" value={stockInput} onChange={(e) => setStockInput(e.target.value)} className="h-8 text-[12px]" />
              <Button size="sm" className="h-8" disabled={!stockInput} onClick={() => updateStock.mutate(Number(stockInput))}>
                <Package className="mr-1 h-3.5 w-3.5" /> Update
              </Button>
            </div>
          </div>

          {/* Actions */}
          <div className="rounded-lg border bg-card p-4">
            <span className="text-[13px] font-semibold mb-3 block">Actions</span>
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start text-[12px]"
                onClick={() =>
                  navigate({
                    to: "/admin/alerts/create",
                    search: {
                      zoneId: k.zoneId,
                      severity: k.status === "CRITICAL" ? "CRITICAL" : "WARNING",
                      title: `Meal Supply Shortage Alert: ${k.name} (${k.id})`,
                    },
                  })
                }
              >
                <Bell className="mr-2 h-3.5 w-3.5" /> Create Alert
              </Button>
            </div>
          </div>

          {/* Shortages */}
          {kitchenShortages.length > 0 && (
            <div className="rounded-lg border bg-card p-4">
              <span className="text-[13px] font-semibold mb-3 block">Shortage Reports</span>
              <div className="space-y-2">
                {kitchenShortages.map((s) => (
                  <div key={s.id} className="flex items-center justify-between rounded-md border p-2">
                    <div>
                      <div className="text-[12px] font-medium">{s.mealsRequired} meals · <StatusBadge value={s.severity} kind="status" /></div>
                      <div className="text-[11px] text-muted-foreground"><StatusBadge value={s.verification} dot /> · {s.reportedMinutesAgo}m ago</div>
                    </div>
                    {s.verification === "PENDING" && (
                      <Button variant="outline" size="sm" className="h-7 text-[11px]" onClick={() => verify.mutate(s.id)}>
                        <CheckCircle className="mr-1 h-3 w-3" /> Verify
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
