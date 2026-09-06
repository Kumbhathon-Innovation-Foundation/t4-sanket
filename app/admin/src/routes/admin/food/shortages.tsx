// Food Shortages
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getShortages, verifyShortage } from "@/services";
import { PageHeader, LoadingState } from "@/components/admin";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/food/shortages")({
  component: FoodShortages,
});

function FoodShortages() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const shortages = useQuery({ queryKey: ["shortages"], queryFn: getShortages });

  const verify = useMutation({
    mutationFn: (id: string) => verifyShortage(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["shortages"] }); toast.success("Shortage verified"); },
  });

  if (shortages.isLoading) return <LoadingState />;
  const all = shortages.data ?? [];

  const renderTable = (items: typeof all) => (
    <div className="overflow-x-auto">
      <table className="w-full text-[12px]">
        <thead><tr className="border-b text-left">
          <th className="pb-2 pr-4 font-medium text-muted-foreground">Kitchen</th>
          <th className="pb-2 pr-4 font-medium text-muted-foreground">Zone</th>
          <th className="pb-2 pr-4 font-medium text-muted-foreground">Meals Required</th>
          <th className="pb-2 pr-4 font-medium text-muted-foreground">Severity</th>
          <th className="pb-2 pr-4 font-medium text-muted-foreground">Verification</th>
          <th className="pb-2 pr-4 font-medium text-muted-foreground">Reported</th>
          <th className="pb-2 font-medium text-muted-foreground">Action</th>
        </tr></thead>
        <tbody>
          {items.map((s) => (
            <tr key={s.id} className="border-b border-border/50 hover:bg-muted/30">
              <td className="py-2.5 pr-4 font-medium cursor-pointer" onClick={() => navigate({ to: "/admin/food/$kitchenId", params: { kitchenId: s.kitchenId } })}>{s.kitchenId}</td>
              <td className="py-2.5 pr-4 text-muted-foreground">{s.zoneId}</td>
              <td className="py-2.5 pr-4 font-medium">{s.mealsRequired.toLocaleString()}</td>
              <td className="py-2.5 pr-4"><StatusBadge value={s.severity} kind="status" /></td>
              <td className="py-2.5 pr-4"><StatusBadge value={s.verification} dot /></td>
              <td className="py-2.5 pr-4 text-muted-foreground">{s.reportedMinutesAgo}m ago</td>
              <td className="py-2.5">{s.verification === "PENDING" && <Button variant="outline" size="sm" className="h-7 text-[11px]" onClick={() => verify.mutate(s.id)}><CheckCircle className="mr-1 h-3 w-3" /> Verify</Button>}</td>
            </tr>
          ))}
          {items.length === 0 && <tr><td colSpan={7} className="py-8 text-center text-muted-foreground">No shortages in this category</td></tr>}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate({ to: "/admin/food" })}><ArrowLeft className="h-4 w-4" /></Button>
        <PageHeader title="Food Shortages" subtitle="Track and verify food shortages across kitchens" />
      </div>
      <div className="rounded-lg border bg-card p-4">
        <Tabs defaultValue="all">
          <TabsList className="mb-3">
            <TabsTrigger value="all" className="text-[12px]">All ({all.length})</TabsTrigger>
            <TabsTrigger value="critical" className="text-[12px]">Critical ({all.filter((s) => s.severity === "CRITICAL").length})</TabsTrigger>
            <TabsTrigger value="pending" className="text-[12px]">Pending ({all.filter((s) => s.verification === "PENDING").length})</TabsTrigger>
            <TabsTrigger value="verified" className="text-[12px]">Verified ({all.filter((s) => s.verification === "VERIFIED").length})</TabsTrigger>
            <TabsTrigger value="fulfilled" className="text-[12px]">Fulfilled ({all.filter((s) => s.verification === "FULFILLED").length})</TabsTrigger>
          </TabsList>
          <TabsContent value="all">{renderTable([...all].sort((a, b) => (a.severity === "CRITICAL" ? -1 : 1)))}</TabsContent>
          <TabsContent value="critical">{renderTable(all.filter((s) => s.severity === "CRITICAL"))}</TabsContent>
          <TabsContent value="pending">{renderTable(all.filter((s) => s.verification === "PENDING"))}</TabsContent>
          <TabsContent value="verified">{renderTable(all.filter((s) => s.verification === "VERIFIED"))}</TabsContent>
          <TabsContent value="fulfilled">{renderTable(all.filter((s) => s.verification === "FULFILLED"))}</TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
