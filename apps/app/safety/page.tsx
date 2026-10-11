"use client";

import * as React from "react";
import { ROLES } from "@/lib/roles";
import { RoleDashboardShell } from "@/components/dashboards/role-dashboard-shell";
import { getChiefWardenNav } from "@/components/dashboards/nav-config";
import { SafetyHazardDashboard } from "@/components/safety/safety-hazard-dashboard";

export default function StandaloneSafetyPage() {
  const role = ROLES.find((r) => r.id === "chief_warden") || ROLES[5];
  const navItems = getChiefWardenNav();

  return (
    <RoleDashboardShell role={role} navItems={navItems}>
      <SafetyHazardDashboard
        roleTitle="Campus-Wide Safety & Hazard Hotspot Analysis"
        roleCode="CHIEF_WARDEN"
      />
    </RoleDashboardShell>
  );
}
