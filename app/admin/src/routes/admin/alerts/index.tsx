// Alerts & Broadcasts — Backward Compatibility Redirect
// Seamlessly forwards /admin/alerts to /admin/guidance?tab=advisories
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/admin/alerts/")(
  {
    component: AlertsRedirect,
  }
);

function AlertsRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate({ to: "/admin/guidance", search: { tab: "advisories" } as any, replace: true });
  }, [navigate]);

  return (
    <div className="flex items-center justify-center h-64 text-muted-foreground text-[13px]">
      Redirecting to Guidance Engine…
    </div>
  );
}
