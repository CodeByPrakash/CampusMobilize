"use client";

import * as React from "react";
import { ROLES } from "@/lib/roles";
import { RoleDashboardShell } from "@/components/dashboards/role-dashboard-shell";
import { getWardenNav } from "@/components/dashboards/nav-config";
import { SafetyHazardDashboard } from "@/components/safety/safety-hazard-dashboard";

export default function WardenHazardsPage() {
  const role = ROLES.find((r) => r.id === "warden") || ROLES[4];
  const navItems = getWardenNav();

  return (
    <RoleDashboardShell role={role} navItems={navItems}>
      <SafetyHazardDashboard
        roleTitle="Hall 14 Warden Safety Command"
        roleCode="WARDEN"
      />
    </RoleDashboardShell>
  );
}
