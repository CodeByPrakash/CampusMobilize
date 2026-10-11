"use client";

import * as React from "react";
import { ROLES } from "@/lib/roles";
import { RoleDashboardShell } from "@/components/dashboards/role-dashboard-shell";
import { HostelRepDashboard } from "./_components/hostel-rep-dashboard";
import {
  InboxIcon,
  CheckCircle2Icon,
  GitMergeIcon,
  AlertTriangleIcon,
} from "lucide-react";

import { getHostelRepNav } from "@/components/dashboards/nav-config";

export default function HostelRepPage() {
  const role = ROLES.find((r) => r.id === "hostel_rep") || ROLES[2];
  const navItems = getHostelRepNav();

  return (
    <RoleDashboardShell role={role} navItems={navItems}>
      <HostelRepDashboard />
    </RoleDashboardShell>
  );
}

