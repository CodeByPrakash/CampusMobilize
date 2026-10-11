"use client";

import * as React from "react";
import { ROLES } from "@/lib/roles";
import { RoleDashboardShell } from "@/components/dashboards/role-dashboard-shell";
import { getStudentNav } from "@/components/dashboards/nav-config";
import { NitRourkelaMap } from "@/components/sustainability/nit-rourkela-map";
import { Badge } from "@/components/ui/badge";
import { MapPinIcon, FlameIcon, ShieldCheckIcon } from "lucide-react";

export default function StudentMapPage() {
  const role = ROLES.find((r) => r.id === "student") || ROLES[0];
  const navItems = getStudentNav();

  return (
    <RoleDashboardShell role={role} navItems={navItems}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <MapPinIcon className="size-5 text-primary" />
              <span>Campus Facility & Risk Heatmap</span>
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Live spatial view of NIT Rourkela buildings, active maintenance squads, and category-filtered risk density.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs gap-1.5 py-1 px-2.5">
              <FlameIcon className="size-3.5 text-primary" />
              <span>Dynamic Heatmap</span>
            </Badge>
            <Badge variant="secondary" className="text-xs gap-1.5 py-1 px-2.5">
              <ShieldCheckIcon className="size-3.5 text-primary" />
              <span>Live Sensor Sync</span>
            </Badge>
          </div>
        </div>

        <NitRourkelaMap />
      </div>
    </RoleDashboardShell>
  );
}
