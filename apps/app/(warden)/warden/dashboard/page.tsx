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

export default function WardenPage() {
  const role = ROLES.find((r) => r.id === "warden") || ROLES[4];

  const navItems = [
    {
      title: "Hall 14 Command",
      url: "/warden/dashboard",
      icon: <ShieldCheckIcon className="size-4" />,
      isActive: true,
      badge: "Active",
    },
    {
      title: "Assign Tradesmen",
      url: "/warden/dashboard",
      icon: <UserPlusIcon className="size-4" />,
      badge: "1 Pending",
    },
    {
      title: "Resolution Audits",
      url: "/warden/dashboard",
      icon: <EyeIcon className="size-4" />,
      badge: "1 To Approve",
    },
    {
      title: "Staff Performance",
      url: "/warden/dashboard",
      icon: <AwardIcon className="size-4" />,
    },
  ];

  return (
    <RoleDashboardShell role={role} navItems={navItems}>
      <WardenDashboard />
    </RoleDashboardShell>
  );
}
