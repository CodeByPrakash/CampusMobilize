"use client";

import * as React from "react";
import { ROLES } from "@/lib/roles";
import { RoleDashboardShell } from "@/components/dashboards/role-dashboard-shell";
import { StudentDashboard } from "./_components/student-dashboard";
import {
  LayoutDashboardIcon,
  PlusCircleIcon,
  ThumbsUpIcon,
  AwardIcon,
} from "lucide-react";

export default function StudentPage() {
  const role = ROLES.find((r) => r.id === "student") || ROLES[0];

  const navItems = [
    {
      title: "My Dashboard",
      url: "/student/dashboard",
      icon: <LayoutDashboardIcon className="size-4" />,
      isActive: true,
    },
    {
      title: "Lodge Complaint",
      url: "/student/dashboard",
      icon: <PlusCircleIcon className="size-4" />,
    },
    {
      title: "Community Upvotes",
      url: "/student/dashboard",
      icon: <ThumbsUpIcon className="size-4" />,
      badge: "8 Active",
    },
    {
      title: "Reward Points",
      url: "/student/dashboard",
      icon: <AwardIcon className="size-4" />,
      badge: "340 pts",
    },
  ];

  return (
    <RoleDashboardShell role={role} navItems={navItems}>
      <StudentDashboard />
    </RoleDashboardShell>
  );
}
