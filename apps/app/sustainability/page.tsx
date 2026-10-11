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
      title: "AI Insights",
      url: "/ai-insights",
      icon: <SparklesIcon className="size-4" />,
      badge: "DeepBot",
    },
    {
      title: "Campus Simulation",
      url: "/simulation",
      icon: <ShieldCheckIcon className="size-4" />,
      badge: "What-If",
    },
    {
      title: "Asset Management",
      url: "/assets",
      icon: <LineChartIcon className="size-4" />,
      badge: "Fleet",
    },
  ];

  return (
    <RoleDashboardShell role={currentRole} navItems={navItems}>
      <SustainabilityDashboard />
    </RoleDashboardShell>
  );
}
