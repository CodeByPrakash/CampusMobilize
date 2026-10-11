"use client";

import * as React from "react";
import { ROLES, DEFAULT_ROLE } from "@/lib/roles";
import { RoleDashboardShell } from "@/components/dashboards/role-dashboard-shell";
import { getDirectorNav } from "@/components/dashboards/nav-config";
import { AiInsightsView } from "@/components/ai/ai-insights-view";
import { Badge } from "@/components/ui/badge";
import { SparklesIcon, BotIcon, ShieldCheckIcon } from "lucide-react";

export default function AiInsightsPage() {
  const [currentRole, setCurrentRole] = React.useState(
    ROLES.find((r) => r.id === "director") || DEFAULT_ROLE
  );

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("current_role_id");
      const matched = ROLES.find((r) => r.id === saved);
      if (matched) setCurrentRole(matched);
    }
  }, []);

  const navItems = getDirectorNav();

  return (
    <RoleDashboardShell role={currentRole} navItems={navItems}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b pb-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <SparklesIcon className="size-5 text-primary" />
              <span>Campus AI Insights & Automated Diagnostics</span>
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Live intelligence powered by DeepBot Ollama backend, synthesized with Neon PostgreSQL telemetry.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs gap-1.5 py-1 px-2.5 font-mono">
              <BotIcon className="size-3.5 text-primary" />
              <span>Model: DeepBot v1</span>
            </Badge>
            <Badge variant="secondary" className="text-xs gap-1.5 py-1 px-2.5">
              <ShieldCheckIcon className="size-3.5 text-primary" />
              <span>Live Neon Grounding</span>
            </Badge>
          </div>
        </div>

        <AiInsightsView />
      </div>
    </RoleDashboardShell>
  );
}
