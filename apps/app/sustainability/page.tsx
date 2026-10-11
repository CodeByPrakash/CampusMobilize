"use client";

import * as React from "react";
import { ROLES, DEFAULT_ROLE } from "@/lib/roles";
import { RoleDashboardShell } from "@/components/dashboards/role-dashboard-shell";
import { SustainabilityDashboard } from "@/components/sustainability/sustainability-dashboard";
import {
  MapPinIcon,
  LineChartIcon,
  SparklesIcon,
  ShieldCheckIcon,
} from "lucide-react";

export default function SustainabilityPage() {
  const [currentRole, setCurrentRole] = React.useState(DEFAULT_ROLE);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("current_role_id");
      const matched = ROLES.find((r) => r.id === saved);
      if (matched) setCurrentRole(matched);
    }
  }, []);

  const navItems = [
    {
      title: "Interactive Heatmap",
      url: "/sustainability",
      icon: <MapPinIcon className="size-4" />,
      isActive: true,
      badge: "NIT RKL",
    },
    {
      title: "Sustainability AI",
      url: "/sustainability",
      icon: <SparklesIcon className="size-4" />,
      badge: "86.4",
    },
    {
      title: "Risk Index",
      url: "/sustainability",
      icon: <ShieldCheckIcon className="size-4" />,
      badge: "31",
    },
  ];

  return (
    <RoleDashboardShell role={currentRole} navItems={navItems}>
      <SustainabilityDashboard />
    </RoleDashboardShell>
  );
}
