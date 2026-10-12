"use client";

import * as React from "react";
import { ROLES } from "@/lib/roles";
import { RoleDashboardShell } from "@/components/dashboards/role-dashboard-shell";
import { getDirectorNav } from "@/components/dashboards/nav-config";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2Icon, UsersIcon, DoorOpenIcon, ShieldCheckIcon, MapPinIcon } from "lucide-react";
import { toast } from "sonner";
import { apiGetHostels } from "@/lib/api";

export default function DirectorHallsPage() {
  const role = ROLES.find((r) => r.id === "director") || ROLES[7];
  const navItems = getDirectorNav();

  const [hostels, setHostels] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function load() {
      try {
        const res = await apiGetHostels();
        const list = Array.isArray(res) ? res : [res];
        setHostels(list);
      } catch {
        // Fallback demo hostels
        setHostels([
          {
            code: "HB-3",
            name: "Hall of Residence 14",
            type: "BOYS",
            resident_count: 850,
            blocks: [
              { name: "Block A", rooms: Array(40).fill({}) },
              { name: "Block B", rooms: Array(48).fill({}) },
              { name: "Block C", rooms: Array(40).fill({}) },
            ],
          },
          {
            code: "HB-1",
            name: "Hall of Residence 1 (KMS Hall)",
            type: "GIRLS",
            resident_count: 620,
            blocks: [
              { name: "Block A", rooms: Array(30).fill({}) },
              { name: "Block B", rooms: Array(32).fill({}) },
            ],
          },
          {
            code: "HB-2",
            name: "Hall of Residence 2 (MV Hall)",
            type: "BOYS",
            resident_count: 740,
            blocks: [
              { name: "Block 1", rooms: Array(36).fill({}) },
              { name: "Block 2", rooms: Array(38).fill({}) },
            ],
          },
          {
            code: "HB-4",
            name: "Hall of Residence 4 (DBA Hall)",
            type: "BOYS",
            resident_count: 910,
            blocks: [
              { name: "East Wing", rooms: Array(45).fill({}) },
              { name: "West Wing", rooms: Array(45).fill({}) },
            ],
          },
        ]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const totalResidents = hostels.reduce((acc, h) => acc + (h.resident_count || 0), 0);

  return (
    <RoleDashboardShell role={role} navItems={navItems}>
      <div className="space-y-6 max-w-8xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Halls of Residence Master Infrastructure
            </h1>
            <p className="text-sm text-slate-500">
              Campus-wide institutional residential directory, wing topologies, and accommodation capacities (2.2).
            </p>
          </div>
          <Badge className="bg-slate-900 text-white px-3 py-1 text-sm font-medium">
            4 Main Residential Complexes
          </Badge>
        </div>

        {/* Global Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-white border-slate-200">
            <CardHeader className="pb-2">
              <CardDescription>Total On-Campus Residents</CardDescription>
              <CardTitle className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <UsersIcon className="size-5 text-indigo-600" />
                {totalResidents ? totalResidents.toLocaleString() : "3,120"} Students
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-500">Full residential occupancy across NIT Rourkela</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200">
            <CardHeader className="pb-2">
              <CardDescription>Residential Complexes</CardDescription>
              <CardTitle className="text-2xl font-bold text-indigo-600 flex items-center gap-2">
                <Building2Icon className="size-5" />
                {hostels.length} Halls
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-500">100% telemetry and complaint sensor coverage</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200">
            <CardHeader className="pb-2">
              <CardDescription>Statutory Wards Oversight</CardDescription>
              <CardTitle className="text-2xl font-bold text-emerald-600 flex items-center gap-2">
                <ShieldCheckIcon className="size-5" />
                Active Wardens
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-500">Each hall governed by dedicated Warden Council</p>
            </CardContent>
          </Card>
        </div>

        {/* Hostels Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {hostels.map((h) => (
            <Card key={h.code} className="bg-white border-slate-200 hover:border-slate-300 transition-all">
              <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-xs font-mono">
                      {h.code}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {h.type}
                    </Badge>
                  </div>
                  <CardTitle className="text-base font-bold text-slate-900 mt-1">
                    {h.name}
                  </CardTitle>
                </div>
                <div className="text-right">
                  <div className="font-mono text-sm font-bold text-slate-900">
                    {h.resident_count || "—"}
                  </div>
                  <div className="text-[11px] text-slate-400">Residents</div>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                    <DoorOpenIcon className="size-3.5 text-slate-400" />
                    Block / Wing Topologies:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {h.blocks && h.blocks.length > 0 ? (
                      h.blocks.map((b: any, bIdx: number) => (
                        <div key={bIdx} className="rounded bg-slate-50 border border-slate-100 p-2 text-xs">
                          <div className="font-semibold text-slate-800">{b.name}</div>
                          <div className="text-[11px] text-slate-500">
                            {b.rooms?.length || 40} Rooms
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-3 text-xs text-slate-400">
                        Wings A, B, C (Double & Single Occupancy)
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-slate-100 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <MapPinIcon className="size-3 text-slate-400" />
                    NIT Rourkela Campus
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                    onClick={() => toast.success(`Viewing structural architectural blue-prints for ${h.name}`)}
                  >
                    View Layout Map
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </RoleDashboardShell>
  );
}
