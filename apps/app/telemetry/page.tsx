"use client";

import * as React from "react";
import { ROLES, DEFAULT_ROLE } from "@/lib/roles";
import { RoleDashboardShell } from "@/components/dashboards/role-dashboard-shell";
import { getNavForRoleId } from "@/components/dashboards/nav-config";
import { IoTSensorDashboard } from "@/components/telemetry/iot-sensor-dashboard";
import { Badge } from "@/components/ui/badge";
import { RadioIcon, SparklesIcon, ShieldCheckIcon } from "lucide-react";

export default function StandaloneTelemetryPage() {
  const [currentRole, setCurrentRole] = React.useState(
    ROLES.find((r) => r.id === "director") || DEFAULT_ROLE
  );

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("current_role_id");
      const matched = ROLES.find(
        (r) => r.id === saved || r.id === saved?.replace("-", "_")
      );
      if (matched) setCurrentRole(matched);
    }
  }, []);

  const navItems = getNavForRoleId(currentRole.id);

  return (
    <RoleDashboardShell role={currentRole} navItems={navItems}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b pb-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <RadioIcon className="size-5 text-primary" />
              <span>Campus IoT Sensor Telemetry & Anomaly Intelligence</span>
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Live ingestion of open, synthetic, and edge sensors. Short-term predictive forecasting, anomaly detection & plain-language recommendations.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs gap-1.5 py-1 px-2.5">
              <SparklesIcon className="size-3.5 text-primary" />
              <span>Prescriptive AI</span>
            </Badge>
            <Badge variant="secondary" className="text-xs gap-1.5 py-1 px-2.5">
              <ShieldCheckIcon className="size-3.5 text-primary" />
              <span>148 Nodes Active</span>
            </Badge>
          </div>
        </div>

        <IoTSensorDashboard />
      </div>
    </RoleDashboardShell>
  );
}
