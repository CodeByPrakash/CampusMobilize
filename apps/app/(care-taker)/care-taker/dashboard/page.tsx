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

import { getCaretakerNav } from "@/components/dashboards/nav-config";

export default function CaretakerPage() {
  const role = ROLES.find((r) => r.id === "caretaker") || ROLES[3];
  const navItems = getCaretakerNav();

  return (
    <RoleDashboardShell role={role} navItems={navItems}>
      <CaretakerDashboard />
    </RoleDashboardShell>
  );
}

