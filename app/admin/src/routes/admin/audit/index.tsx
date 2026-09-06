// Audit Logs & Governance
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getAuditEntries } from "@/services";
import { PageHeader, MetricCard, MetricStrip, LoadingState } from "@/components/admin";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { FilterBar, SearchInput, SelectFilter } from "@/components/admin/FilterBar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { ShieldCheck, Download, History, AlertTriangle, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/audit/")({
  component: AuditLogsPage,
});

function AuditLogsPage() {
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("ALL");
  const [severityFilter, setSeverityFilter] = useState("ALL");

  const auditQuery = useQuery({
    queryKey: ["audit-entries"],
    queryFn: getAuditEntries,
  });

  if (auditQuery.isLoading) return <LoadingState />;
  const all = auditQuery.data ?? [];

  const filtered = all.filter((entry) => {
    if (
      search &&
      !entry.actor.toLowerCase().includes(search.toLowerCase()) &&
      !entry.action.toLowerCase().includes(search.toLowerCase()) &&
      !entry.object.toLowerCase().includes(search.toLowerCase()) &&
      !entry.reason.toLowerCase().includes(search.toLowerCase())
    ) {
      return false;
    }
    if (moduleFilter !== "ALL" && entry.module !== moduleFilter) return false;
    if (severityFilter !== "ALL" && entry.severity !== severityFilter) return false;
    return true;
  });

  const criticalCount = all.filter((e) => e.severity === "CRITICAL").length;
  const warningCount = all.filter((e) => e.severity === "WARNING").length;

  const modules = Array.from(new Set(all.map((e) => e.module))).sort();

  return (
    <div className="space-y-5">
      <PageHeader
        title="Audit Logs & Governance"
        subtitle="Immutable audit trail of operator overrides, emergency declarations, and system modifications"
        actions={
          <Button
            variant="outline"
            size="sm"
            className="gap-2 text-xs"
            onClick={() => toast.success("Exporting compliance audit log (CSV)...")}
          >
            <Download className="h-3.5 w-3.5" /> Export Compliance Log
          </Button>
        }
      />

      <MetricStrip>
        <MetricCard label="Total Audit Events" value={all.length} icon={<History className="h-4 w-4" />} />
        <MetricCard
          label="Critical Overrides"
          value={criticalCount}
          variant={criticalCount > 0 ? "critical" : "default"}
          icon={<ShieldCheck className="h-4 w-4 text-red-500" />}
          sublabel="High-impact actions"
        />
        <MetricCard
          label="Warning Events"
          value={warningCount}
          variant={warningCount > 0 ? "warning" : "default"}
          icon={<AlertTriangle className="h-4 w-4 text-amber-500" />}
          sublabel="Threshold adjustments"
        />
        <MetricCard
          label="Tamper Verification"
          value="100% Valid"
          variant="success"
          sublabel="Cryptographic signature OK"
        />
      </MetricStrip>

      <div className="rounded-lg border bg-card p-4">
        <FilterBar className="mb-4">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search actor, action, object or reason…"
            className="w-72"
          />
          <SelectFilter
            value={moduleFilter}
            onChange={setModuleFilter}
            options={[
              { value: "ALL", label: "All Modules" },
              ...modules.map((m) => ({ value: m, label: m })),
            ]}
          />
          <SelectFilter
            value={severityFilter}
            onChange={setSeverityFilter}
            options={[
              { value: "ALL", label: "All Severities" },
              { value: "CRITICAL", label: "Critical" },
              { value: "WARNING", label: "Warning" },
              { value: "INFO", label: "Info" },
            ]}
          />
        </FilterBar>

        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-2 pr-4 font-medium text-muted-foreground">Timestamp</th>
                <th className="pb-2 pr-4 font-medium text-muted-foreground">Operator</th>
                <th className="pb-2 pr-4 font-medium text-muted-foreground">Module</th>
                <th className="pb-2 pr-4 font-medium text-muted-foreground">Action & Target</th>
                <th className="pb-2 pr-4 font-medium text-muted-foreground">Delta (Old → New)</th>
                <th className="pb-2 pr-4 font-medium text-muted-foreground">Severity</th>
                <th className="pb-2 font-medium text-muted-foreground">Reason / Note</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr key={e.id} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="py-2.5 pr-4 text-muted-foreground whitespace-nowrap font-mono text-[11px]">
                    {e.time}
                  </td>
                  <td className="py-2.5 pr-4">
                    <div className="font-semibold text-foreground">{e.actor}</div>
                    <div className="text-[10px] text-muted-foreground">{e.role}</div>
                  </td>
                  <td className="py-2.5 pr-4">
                    <Badge variant="outline" className="text-[10px] font-medium">
                      {e.module}
                    </Badge>
                  </td>
                  <td className="py-2.5 pr-4">
                    <div className="font-medium text-foreground">{e.action}</div>
                    <div className="text-[11px] text-muted-foreground font-mono">{e.object}</div>
                  </td>
                  <td className="py-2.5 pr-4">
                    <div className="flex items-center gap-1.5 font-mono text-[11px]">
                      <span className="rounded bg-muted px-1.5 py-0.5 text-muted-foreground">{e.previousState}</span>
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      <span className="rounded bg-primary/10 px-1.5 py-0.5 text-primary font-medium">{e.newState}</span>
                    </div>
                  </td>
                  <td className="py-2.5 pr-4">
                    <StatusBadge value={e.severity} kind="severity" dot />
                  </td>
                  <td className="py-2.5 text-muted-foreground max-w-[260px] truncate" title={e.reason}>
                    {e.reason}
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
