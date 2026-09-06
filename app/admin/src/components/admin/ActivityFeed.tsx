import { cn } from "@/lib/utils";
import type { ActivityEntry } from "@/types";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "./StatusBadge";

interface ActivityFeedProps {
  entries: ActivityEntry[];
  limit?: number;
  className?: string;
  showCard?: boolean;
}

export function ActivityFeed({
  entries,
  limit = 10,
  className,
  showCard = true,
}: ActivityFeedProps) {
  const items = entries.slice(0, limit);

  const table = (
    <div className="overflow-x-auto">
      <table className="w-full text-[12px] text-left">
        <thead className="border-b border-border/70 text-muted-foreground font-medium">
          <tr>
            <th className="pb-2 pr-4 font-semibold">Time</th>
            <th className="pb-2 pr-4 font-semibold">Actor</th>
            <th className="pb-2 pr-4 font-semibold">Module</th>
            <th className="pb-2 pr-4 font-semibold">Action</th>
            <th className="pb-2 font-semibold">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/40">
          {items.map((entry) => (
            <tr key={entry.id} className="hover:bg-muted/30 transition-colors">
              <td className="py-2.5 pr-4 font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                {entry.time}
              </td>
              <td className="py-2.5 pr-4 font-medium text-foreground whitespace-nowrap">
                {entry.actor}
              </td>
              <td className="py-2.5 pr-4">
                <Badge variant="outline" className="text-[10px] font-normal py-0">
                  {entry.module}
                </Badge>
              </td>
              <td className="py-2.5 pr-4 text-foreground/90 max-w-xs truncate" title={entry.action}>
                {entry.action}
              </td>
              <td className="py-2.5 whitespace-nowrap">
                <StatusBadge value={entry.status} size="sm" dot />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  if (!showCard) return <div className={className}>{table}</div>;

  return (
    <div className={cn("rounded-lg border border-border bg-card p-4 shadow-xs", className)}>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-xs font-semibold text-foreground tracking-tight uppercase text-muted-foreground">
          Recent Operational Activity
        </h3>
        <span className="text-[10px] text-muted-foreground">Live Telemetry Stream</span>
      </div>
      {table}
    </div>
  );
}
