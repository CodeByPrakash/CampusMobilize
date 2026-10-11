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

export default function EstateOfficerPage() {
  const role = ROLES.find((r) => r.id === "estate_officer") || ROLES[6];

  const navItems = [
    {
      title: "Utility Forecasts",
      url: "/estate-officer/dashboard",
      icon: <ZapIcon className="size-4" />,
      isActive: true,
      badge: "P10/50/90",
    },
    {
      title: "36-Mo Baseline",
      url: "/estate-officer/dashboard",
      icon: <TrendingUpIcon className="size-4" />,
    },
    {
      title: "Bill Reconciliation",
      url: "/estate-officer/dashboard",
      icon: <UploadCloudIcon className="size-4" />,
    },
    {
      title: "Grid & Substation",
      url: "/estate-officer/dashboard",
      icon: <AlertTriangleIcon className="size-4" />,
    },
  ];

  return (
    <RoleDashboardShell role={role} navItems={navItems}>
      <EstateOfficerDashboard />
    </RoleDashboardShell>
  );
}
