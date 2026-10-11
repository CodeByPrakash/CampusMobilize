"use client";

import * as React from "react";
import { ROLES } from "@/lib/roles";
import { RoleDashboardShell } from "@/components/dashboards/role-dashboard-shell";
import { DirectorDashboard } from "./_components/director-dashboard";
import {
  ActivityIcon,
  TrophyIcon,
  ShieldCheckIcon,
  Building2Icon,
} from "lucide-react";

import { getDirectorNav } from "@/components/dashboards/nav-config";

export default function DirectorPage() {
  const role = ROLES.find((r) => r.id === "director") || ROLES[7];
  const navItems = getDirectorNav();

  return (
    <RoleDashboardShell role={role} navItems={navItems}>
      <DirectorDashboard />
    </RoleDashboardShell>
  );
}

