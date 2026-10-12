"use client";

import * as React from "react";
import { ROLES } from "@/lib/roles";
import { RoleDashboardShell } from "@/components/dashboards/role-dashboard-shell";
import { getDirectorNav } from "@/components/dashboards/nav-config";
import { SimulationDashboard } from "@/components/simulation/simulation-dashboard";
import { Badge } from "@/components/ui/badge";
import { ActivityIcon, SparklesIcon, ShieldCheckIcon, LandmarkIcon } from "lucide-react";

export default function DirectorSimulationPage() {
  const role = ROLES.find((r) => r.id === "director") || ROLES[7];
  const navItems = getDirectorNav();

  return (
    <RoleDashboardShell role={role} navItems={navItems}>
      <div className="space-y-6 max-w-8xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge className="bg-emerald-600 text-white text-[11px] font-semibold gap-1 py-0.5 px-2">
                <LandmarkIcon className="size-3" />
                <span>Director Executive Suite</span>
              </Badge>
              <span className="text-xs text-slate-500 font-mono">
                NIT Rourkela Campus Digital Twin (8, 13)
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <ActivityIcon className="size-6 text-emerald-600" />
              <span>Campus Utility & Resilience Simulation</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Executive What-If simulation engine modeling institute-wide water stress, 33kV substation peak loads, and mega-event surges.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs gap-1.5 py-1 px-2.5 border-emerald-200 text-emerald-800 bg-emerald-50">
              <SparklesIcon className="size-3.5 text-emerald-600" />
              <span>DeepBot AI Synthesis</span>
            </Badge>
            <Badge variant="secondary" className="text-xs gap-1.5 py-1 px-2.5">
              <ShieldCheckIcon className="size-3.5 text-slate-600" />
              <span>Executive Scope</span>
            </Badge>
          </div>
        </div>

        <SimulationDashboard />
      </div>
    </RoleDashboardShell>
  );
}
