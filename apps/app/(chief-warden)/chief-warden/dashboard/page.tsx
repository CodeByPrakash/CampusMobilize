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

export default function ChiefWardenPage() {
  const role = ROLES.find((r) => r.id === "chief_warden") || ROLES[5];

  const navItems = [
    {
      title: "Campus Command",
      url: "/chief-warden/dashboard",
      icon: <Building2Icon className="size-4" />,
      isActive: true,
      badge: "4 Halls",
    },
    {
      title: "Rewards Ledger",
      url: "/chief-warden/dashboard",
      icon: <AwardIcon className="size-4" />,
      badge: "2 Pending",
    },
    {
      title: "Force Escalations",
      url: "/chief-warden/dashboard",
      icon: <ShieldAlertIcon className="size-4" />,
    },
    {
      title: "Festival Pre-Briefs",
      url: "/chief-warden/dashboard",
      icon: <SparklesIcon className="size-4" />,
    },
  ];

  return (
    <RoleDashboardShell role={role} navItems={navItems}>
      <ChiefWardenDashboard />
    </RoleDashboardShell>
  );
}
