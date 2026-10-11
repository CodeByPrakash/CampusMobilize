"use client";

import * as React from "react";
import { ROLES } from "@/lib/roles";
import { RoleDashboardShell } from "@/components/dashboards/role-dashboard-shell";
import { CrDashboard } from "./_components/cr-dashboard";
import {
  LayoutDashboardIcon,
  UsersIcon,
  BuildingIcon,
  FileCheckIcon,
} from "lucide-react";

import { getCrNav } from "@/components/dashboards/nav-config";

export default function CrPage() {
  const role = ROLES.find((r) => r.id === "cr") || ROLES[1];
  const navItems = getCrNav();

  return (
    <RoleDashboardShell role={role} navItems={navItems}>
      <CrDashboard />
    </RoleDashboardShell>
  );
}

