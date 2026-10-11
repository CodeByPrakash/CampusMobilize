"use client";

import * as React from "react";
import { ROLES } from "@/lib/roles";
import { RoleDashboardShell } from "@/components/dashboards/role-dashboard-shell";
import { ChiefWardenDashboard } from "./_components/chief-warden-dashboard";
import {
  Building2Icon,
  AwardIcon,
  ShieldAlertIcon,
  SparklesIcon,
} from "lucide-react";

import { getChiefWardenNav } from "@/components/dashboards/nav-config";

export default function ChiefWardenPage() {
  const role = ROLES.find((r) => r.id === "chief_warden") || ROLES[5];
  const navItems = getChiefWardenNav();

  return (
    <RoleDashboardShell role={role} navItems={navItems}>
      <ChiefWardenDashboard />
    </RoleDashboardShell>
  );
}

