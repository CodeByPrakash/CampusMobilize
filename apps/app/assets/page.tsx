"use client";

import * as React from "react";
import { ROLES, DEFAULT_ROLE } from "@/lib/roles";
import { RoleDashboardShell } from "@/components/dashboards/role-dashboard-shell";
import { getNavForRoleId } from "@/components/dashboards/nav-config";
import { AssetManager } from "@/components/assets/asset-manager";
import { Badge } from "@/components/ui/badge";
import { WrenchIcon, SparklesIcon, ShieldCheckIcon } from "lucide-react";

export default function AssetsPage() {
  const [currentRole, setCurrentRole] = React.useState(
    ROLES.find((r) => r.id === "estate_officer") || DEFAULT_ROLE
  );

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("current_role_id");
      const matched = ROLES.find((r) => r.id === saved || r.id === saved?.replace("-", "_"));
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
              <WrenchIcon className="size-5 text-primary" />
              <span>Campus Asset Management</span>
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Drag-and-drop lifecycle management for transformers, water booster pumps, solar arrays, and campus facilities.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs gap-1.5 py-1 px-2.5">
              <SparklesIcon className="size-3.5 text-primary" />
              <span>Drag & Drop Enabled</span>
            </Badge>
            <Badge variant="secondary" className="text-xs gap-1.5 py-1 px-2.5">
              <ShieldCheckIcon className="size-3.5 text-primary" />
              <span>NIT RKL Fleet Registry</span>
            </Badge>
          </div>
        </div>

        <AssetManager />
      </div>
    </RoleDashboardShell>
  );
}
