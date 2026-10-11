"use client";

import * as React from "react";
import { ROLES } from "@/lib/roles";
import { RoleDashboardShell } from "@/components/dashboards/role-dashboard-shell";
import { getEstateOfficerNav } from "@/components/dashboards/nav-config";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ZapIcon, ActivityIcon, ShieldCheckIcon, AlertTriangleIcon, RefreshCwIcon, GaugeIcon } from "lucide-react";
import { toast } from "sonner";

export default function EstateOfficerGridPage() {
  const role = ROLES.find((r) => r.id === "estate_officer") || ROLES[6];
  const navItems = getEstateOfficerNav();

  const [telemetry, setTelemetry] = React.useState({
    substation1Voltage: "418.4 V",
    powerFactor: "0.985 Lag",
    frequency: "50.02 Hz",
    transformerTemp: "54.2 °C",
    loadCurrent: "680 A",
    dgStatus: "Standby (Ready)",
    fuelLevel: "94% (752 L)",
    lastSync: "Just now",
  });

  const handleRefresh = () => {
    setTelemetry((prev) => ({
      ...prev,
      substation1Voltage: `${(418.0 + Math.random() * 0.8).toFixed(1)} V`,
      loadCurrent: `${Math.round(675 + Math.random() * 15)} A`,
      lastSync: "Just now",
    }));
    toast.success("Substation SCADA telemetry refreshed!");
  };

  return (
    <RoleDashboardShell role={role} navItems={navItems}>
      <div className="space-y-6 max-w-6xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              11kV Substation & Campus Grid Telemetry
            </h1>
            <p className="text-sm text-slate-500">
              Real-time SCADA monitoring for main step-down transformers, APFC capacitor banks, and DG automation.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="text-xs gap-1.5 border-slate-200"
            onClick={handleRefresh}
          >
            <RefreshCwIcon className="size-3.5" />
            Refresh SCADA Bus
          </Button>
        </div>

        {/* Live Gauges */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-white border-slate-200">
            <CardHeader className="pb-2">
              <CardDescription>Busbar Voltage (Phase L-L)</CardDescription>
              <CardTitle className="text-2xl font-mono font-bold text-slate-900">
                {telemetry.substation1Voltage}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">
                Nominal 415V ±1%
              </Badge>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200">
            <CardHeader className="pb-2">
              <CardDescription>Power Factor (APFC)</CardDescription>
              <CardTitle className="text-2xl font-mono font-bold text-emerald-600">
                {telemetry.powerFactor}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-500">Zero penalty rebate zone (&gt;0.95)</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200">
            <CardHeader className="pb-2">
              <CardDescription>Grid Frequency</CardDescription>
              <CardTitle className="text-2xl font-mono font-bold text-indigo-600">
                {telemetry.frequency}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-500">Synchronized with Eastern Regional Grid</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200">
            <CardHeader className="pb-2">
              <CardDescription>Transformer Oil Temp</CardDescription>
              <CardTitle className="text-2xl font-mono font-bold text-slate-900">
                {telemetry.transformerTemp}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-500">Cooling fans status: Auto-idle</p>
            </CardContent>
          </Card>
        </div>

        {/* Feeders & Ring Main Units */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-white border-slate-200">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <ZapIcon className="size-4 text-amber-500" />
                11kV Feeder Breakers (Ring Main Unit)
              </CardTitle>
              <CardDescription className="text-xs">
                Vacuum Circuit Breaker (VCB) states across residential sectors
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-lg bg-slate-50 p-3 border border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <div className="font-semibold text-slate-900">Feeder 1: North Hostels (HB-1 to HB-4)</div>
                  <div className="text-slate-500">Current: 242 A • Breaker: CLOSED (Healthy)</div>
                </div>
                <Badge className="bg-emerald-600 text-white text-xs">Energized</Badge>
              </div>

              <div className="rounded-lg bg-slate-50 p-3 border border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <div className="font-semibold text-slate-900">Feeder 2: South Hostels (Hall 14 Complex)</div>
                  <div className="text-slate-500">Current: 310 A • Breaker: CLOSED (Healthy)</div>
                </div>
                <Badge className="bg-emerald-600 text-white text-xs">Energized</Badge>
              </div>

              <div className="rounded-lg bg-slate-50 p-3 border border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <div className="font-semibold text-slate-900">Feeder 3: Central Water Works & Pumping Station</div>
                  <div className="text-slate-500">Current: 128 A • Breaker: CLOSED (Healthy)</div>
                </div>
                <Badge className="bg-emerald-600 text-white text-xs">Energized</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <ShieldCheckIcon className="size-4 text-emerald-600" />
                Diesel Generator (DG) Automation & AMF
              </CardTitle>
              <CardDescription className="text-xs">
                500 kVA Cummins Auto-Mains-Failure backup for essential loads
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">AMF Panel Status:</span>
                  <span className="font-semibold text-emerald-700">Auto-Armed (12s switchover)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Fuel Tank Level:</span>
                  <span className="font-semibold text-slate-800">{telemetry.fuelLevel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Battery Starting Voltage:</span>
                  <span className="font-semibold text-slate-800">26.4 V DC (Trickle charged)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Last Routine Run Test:</span>
                  <span className="font-medium text-slate-700">Saturday, Oct 10 (Passed)</span>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  size="sm"
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs"
                  onClick={() => toast.success("Self-diagnostic test cycle initiated on AMF panel.")}
                >
                  Initiate AMF Breaker Health Diagnostic
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </RoleDashboardShell>
  );
}
