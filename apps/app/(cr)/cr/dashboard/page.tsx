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

export default function CrPage() {
  const role = ROLES.find((r) => r.id === "cr") || ROLES[1];

  const navItems = [
    {
      title: "Wing Overview",
      url: "/cr/dashboard",
      icon: <LayoutDashboardIcon className="size-4" />,
      isActive: true,
    },
    {
      title: "Wing B Residents",
      url: "/cr/dashboard",
      icon: <UsersIcon className="size-4" />,
      badge: "48",
    },
    {
      title: "Common Amenities",
      url: "/cr/dashboard",
      icon: <BuildingIcon className="size-4" />,
    },
    {
      title: "Endorsement Log",
      url: "/cr/dashboard",
      icon: <FileCheckIcon className="size-4" />,
    },
  ];

  return (
    <RoleDashboardShell role={role} navItems={navItems}>
      <CrDashboard />
    </RoleDashboardShell>
  );
}
