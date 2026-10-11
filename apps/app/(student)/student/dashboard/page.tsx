"use client";

import * as React from "react";
import { ROLES } from "@/lib/roles";
import { RoleDashboardShell } from "@/components/dashboards/role-dashboard-shell";
import { getStudentNav } from "@/components/dashboards/nav-config";
import { StudentDashboard } from "./_components/student-dashboard";

export default function StudentPage() {
  const role = ROLES.find((r) => r.id === "student") || ROLES[0];
  const navItems = getStudentNav();

  return (
    <RoleDashboardShell role={role} navItems={navItems}>
      <StudentDashboard />
    </RoleDashboardShell>
  );
}
