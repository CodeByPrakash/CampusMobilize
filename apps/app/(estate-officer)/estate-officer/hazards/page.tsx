"use client";

import * as React from "react";
import { ROLES } from "@/lib/roles";
import { RoleDashboardShell } from "@/components/dashboards/role-dashboard-shell";
import { getEstateOfficerNav } from "@/components/dashboards/nav-config";
import { SafetyHazardDashboard } from "@/components/safety/safety-hazard-dashboard";

export default function EstateOfficerHazardsPage() {
  const role = ROLES.find((r) => r.id === "estate_officer") || ROLES[6];
  const navItems = getEstateOfficerNav();

  return (
    <RoleDashboardShell role={role} navItems={navItems}>
      <SafetyHazardDashboard
        roleTitle="Estate Office Infrastructure & Safety Ops"
        roleCode="ESTATE_OFFICER"
      />
    </RoleDashboardShell>
  );
}
