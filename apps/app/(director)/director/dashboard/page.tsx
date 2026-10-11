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

export default function DirectorPage() {
  const role = ROLES.find((r) => r.id === "director") || ROLES[7];

  const navItems = [
    {
      title: "Risk Index (CRI)",
      url: "/director/dashboard",
      icon: <ActivityIcon className="size-4" />,
      isActive: true,
      badge: "31 / 100",
    },
    {
      title: "Living Standards",
      url: "/director/dashboard",
      icon: <TrophyIcon className="size-4" />,
    },
    {
      title: "Governance Audits",
      url: "/director/dashboard",
      icon: <ShieldCheckIcon className="size-4" />,
    },
    {
      title: "Halls of Residence",
      url: "/director/dashboard",
      icon: <Building2Icon className="size-4" />,
      badge: "4 Halls",
    },
  ];

  return (
    <RoleDashboardShell role={role} navItems={navItems}>
      <DirectorDashboard />
    </RoleDashboardShell>
  );
}
