"use client";

import * as React from "react";
import { ROLES } from "@/lib/roles";
import { RoleDashboardShell } from "@/components/dashboards/role-dashboard-shell";
import { EstateOfficerDashboard } from "./_components/estate-officer-dashboard";
import {
  ZapIcon,
  TrendingUpIcon,
  UploadCloudIcon,
  AlertTriangleIcon,
} from "lucide-react";

import { getEstateOfficerNav } from "@/components/dashboards/nav-config";

export default function EstateOfficerPage() {
  const role = ROLES.find((r) => r.id === "estate_officer") || ROLES[6];
  const navItems = getEstateOfficerNav();

  return (
    <RoleDashboardShell role={role} navItems={navItems}>
      <EstateOfficerDashboard />
    </RoleDashboardShell>
  );
}

