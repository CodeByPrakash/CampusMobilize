"use client";

import * as React from "react";
import { ROLES } from "@/lib/roles";
import { RoleDashboardShell } from "@/components/dashboards/role-dashboard-shell";
import { WardenDashboard } from "./_components/warden-dashboard";
import {
  ShieldCheckIcon,
  UserPlusIcon,
  EyeIcon,
  AwardIcon,
} from "lucide-react";

import { getWardenNav } from "@/components/dashboards/nav-config";

export default function WardenPage() {
  const role = ROLES.find((r) => r.id === "warden") || ROLES[4];
  const navItems = getWardenNav();

  return (
    <RoleDashboardShell role={role} navItems={navItems}>
      <WardenDashboard />
    </RoleDashboardShell>
  );
}

