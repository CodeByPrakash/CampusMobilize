"use client";

import * as React from "react";
import { ROLES } from "@/lib/roles";
import { RoleDashboardShell } from "@/components/dashboards/role-dashboard-shell";
import { getDirectorNav } from "@/components/dashboards/nav-config";
import { SafetyHazardDashboard } from "@/components/safety/safety-hazard-dashboard";

export default function DirectorHazardsPage() {
  const role = ROLES.find((r) => r.id === "director") || ROLES[7];
  const navItems = getDirectorNav();

  return (
    <RoleDashboardShell role={role} navItems={navItems}>
      <SafetyHazardDashboard
        roleTitle="Director Executive Campus Safety & Risk Command"
        roleCode="DIRECTOR"
      />
    </RoleDashboardShell>
  );
}
