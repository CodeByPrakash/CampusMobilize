"use client";

import * as React from "react";
import { ROLES } from "@/lib/roles";
import { RoleDashboardShell } from "@/components/dashboards/role-dashboard-shell";
import { getEstateOfficerNav } from "@/components/dashboards/nav-config";
import { SimulationDashboard } from "@/components/simulation/simulation-dashboard";
import { Badge } from "@/components/ui/badge";
import { ActivityIcon, SparklesIcon, ShieldCheckIcon } from "lucide-react";

export default function EstateOfficerSimulationPage() {
  const role = ROLES.find((r) => r.id === "estate-officer") || ROLES[0];
  const navItems = getEstateOfficerNav();

  return (
    <RoleDashboardShell role={role} navItems={navItems}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b pb-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <ActivityIcon className="size-5 text-primary" />
              <span>Campus Utility & Resilience Simulation</span>
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Interactive What-If digital twin for water stress, energy peak grid demand, and campus festival surge scenarios.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs gap-1.5 py-1 px-2.5">
              <SparklesIcon className="size-3.5 text-primary" />
              <span>DeepBot AI Powered</span>
            </Badge>
            <Badge variant="secondary" className="text-xs gap-1.5 py-1 px-2.5">
              <ShieldCheckIcon className="size-3.5 text-primary" />
              <span>Physics Digital Twin</span>
            </Badge>
          </div>
        </div>

        <SimulationDashboard />
      </div>
    </RoleDashboardShell>
  );
}
