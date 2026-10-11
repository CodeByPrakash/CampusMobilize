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

export default function HostelRepPage() {
  const role = ROLES.find((r) => r.id === "hostel_rep") || ROLES[2];

  const navItems = [
    {
      title: "Triage Inbox",
      url: "/hostel-rep/dashboard",
      icon: <InboxIcon className="size-4" />,
      isActive: true,
      badge: "3 Open",
    },
    {
      title: "Physical Verifications",
      url: "/hostel-rep/dashboard",
      icon: <CheckCircle2Icon className="size-4" />,
    },
    {
      title: "Deduplication Ledger",
      url: "/hostel-rep/dashboard",
      icon: <GitMergeIcon className="size-4" />,
      badge: "14 Merged",
    },
    {
      title: "Hazard Alerts",
      url: "/hostel-rep/dashboard",
      icon: <AlertTriangleIcon className="size-4" />,
    },
  ];

  return (
    <RoleDashboardShell role={role} navItems={navItems}>
      <HostelRepDashboard />
    </RoleDashboardShell>
  );
}
