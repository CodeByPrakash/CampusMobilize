"use client";

import * as React from "react";
import { ROLES } from "@/lib/roles";
import { RoleDashboardShell } from "@/components/dashboards/role-dashboard-shell";
import { CaretakerDashboard } from "./_components/caretaker-dashboard";
import {
  WrenchIcon,
  PlayCircleIcon,
  RotateCcwIcon,
  CheckCircle2Icon,
} from "lucide-react";

export default function CaretakerPage() {
  const role = ROLES.find((r) => r.id === "caretaker") || ROLES[3];

  const navItems = [
    {
      title: "Work Orders",
      url: "/care-taker/dashboard",
      icon: <WrenchIcon className="size-4" />,
      isActive: true,
      badge: "4 Orders",
    },
    {
      title: "In Progress",
      url: "/care-taker/dashboard",
      icon: <PlayCircleIcon className="size-4" />,
      badge: "1",
    },
    {
      title: "Re-Work Queue",
      url: "/care-taker/dashboard",
      icon: <RotateCcwIcon className="size-4" />,
      badge: "1",
    },
    {
      title: "Resolution Proofs",
      url: "/care-taker/dashboard",
      icon: <CheckCircle2Icon className="size-4" />,
    },
  ];

  return (
    <RoleDashboardShell role={role} navItems={navItems}>
      <CaretakerDashboard />
    </RoleDashboardShell>
  );
}
