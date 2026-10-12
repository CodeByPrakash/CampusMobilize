"use client";

import * as React from "react";
import { ROLES } from "@/lib/roles";
import { RoleDashboardShell } from "@/components/dashboards/role-dashboard-shell";
import { getCrNav } from "@/components/dashboards/nav-config";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BuildingIcon, DropletsIcon, WifiIcon, FlameIcon, ShieldCheckIcon, AlertTriangleIcon, WrenchIcon, CheckCircle2Icon, XIcon } from "lucide-react";
import { toast } from "sonner";

export default function CrAmenitiesPage() {
  const role = ROLES.find((r) => r.id === "student") || ROLES[0];
  const navItems = getCrNav();

  const [amenities, setAmenities] = React.useState([
    {
      id: "a1",
      name: "Water Cooler & RO System (Floor 2)",
      category: "Drinking Water",
      location: "Wing B, Central Lobby",
      status: "Operational",
      tds: "84 PPM (Optimal)",
      lastService: "Oct 04, 2026",
      condition: "Good",
    },
    {
      id: "a2",
      name: "Geyser Unit 2B (East Washroom)",
      category: "Sanitary / Heating",
      location: "Wing B, Restroom 201-206",
      status: "Degraded",
      tds: "Coil scale accumulation",
      lastService: "Sep 18, 2026",
      condition: "Needs Descaling",
    },
    {
      id: "a3",
      name: "Aruba Campus Wi-Fi AP-04",
      category: "Network Infrastructure",
      location: "Wing B Corridor Ceiling",
      status: "Operational",
      tds: "142 Mbps (28 connected)",
      lastService: "Auto-synced",
      condition: "Healthy",
    },
    {
      id: "a4",
      name: "Wing Fire Extinguisher (CO2 4.5kg)",
      category: "Safety & Fire",
      location: "Staircase Landing B-2",
      status: "Inspected",
      tds: "Pressure in Green Zone",
      lastService: "Sep 01, 2026",
      condition: "Valid till Jan 2027",
    },
    {
      id: "a5",
      name: "Common Room Ceiling Fan & Regulator #3",
      category: "Electrical",
      location: "Wing B Common Hall",
      status: "Pending Repair",
      tds: "Regulator knob broken",
      lastService: "Ticket Logged",
      condition: "Speed stuck on High",
    },
  ]);

  const [confirmingAmenity, setConfirmingAmenity] = React.useState<{ id: string; name: string; location: string; category: string } | null>(null);

  const handleRequestServicing = (item: { id: string; name: string; location: string; category: string }) => {
    setConfirmingAmenity(item);
  };

  const handleConfirmServicing = () => {
    if (confirmingAmenity) {
      toast.success(`Priority maintenance endorsement dispatched to Caretaker for ${confirmingAmenity.name}!`);
      setConfirmingAmenity(null);
    }
  };

  const handleCancelServicing = () => {
    setConfirmingAmenity(null);
  };

  return (
    <RoleDashboardShell role={role} navItems={navItems}>
      <div className="space-y-6 max-w-8xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Wing B Common Amenities
            </h1>
            <p className="text-sm text-slate-500">
              Real-time operational health of shared assets, washrooms, RO systems, and connectivity.
            </p>
          </div>
          <Button
            className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 shadow-sm"
            onClick={() => toast.success("Amenity routine audit logged for Wing B!")}
          >
            <ShieldCheckIcon className="size-4" />
            Log CR Weekly Audit
          </Button>
        </div>

        {/* Status Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-white border-slate-200">
            <CardHeader className="pb-2">
              <CardDescription>Drinking Water Health</CardDescription>
              <CardTitle className="text-2xl font-bold text-emerald-600 flex items-center gap-2">
                <DropletsIcon className="size-5" />
                98.4% Uptime
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-500">Daily TDS 84 PPM • Filter replaced 7 days ago</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200">
            <CardHeader className="pb-2">
              <CardDescription>Corridor Wi-Fi Signal</CardDescription>
              <CardTitle className="text-2xl font-bold text-indigo-600 flex items-center gap-2">
                <WifiIcon className="size-5" />
                -48 dBm
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-500">Zero packet drops reported by Wing residents</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200">
            <CardHeader className="pb-2">
              <CardDescription>Fire & Safety Audit</CardDescription>
              <CardTitle className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <FlameIcon className="size-5 text-rose-500" />
                Compliant
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-500">Next statutory inspection scheduled in 84 days</p>
            </CardContent>
          </Card>
        </div>

        {/* Amenity Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {amenities.map((item) => (
            <Card key={item.id} className="bg-white border-slate-200 hover:border-slate-300 transition-all">
              <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base font-semibold text-slate-900">
                      {item.name}
                    </CardTitle>
                    <Badge
                      variant="outline"
                      className={
                        item.status === "Operational" || item.status === "Inspected"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 text-xs"
                          : item.status === "Degraded"
                            ? "bg-amber-50 text-amber-700 border-amber-200 text-xs"
                            : "bg-rose-50 text-rose-700 border-rose-200 text-xs"
                      }
                    >
                      {item.status}
                    </Badge>
                  </div>
                  <CardDescription className="text-xs text-slate-500">
                    {item.location} • {item.category}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-lg bg-slate-50 p-3 text-xs space-y-1.5 border border-slate-100">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Telemetry / Reading:</span>
                    <span className="font-semibold text-slate-800">{item.tds}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Last Serviced:</span>
                    <span className="font-medium text-slate-700">{item.lastService}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Physical Condition:</span>
                    <span className="font-medium text-slate-700">{item.condition}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-slate-400">Wing B Verified</span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs border-slate-200 text-slate-700 hover:bg-slate-50 gap-1.5"
                    onClick={() => handleRequestServicing(item)}
                  >
                    <WrenchIcon className="size-3 text-slate-500" />
                    Request Servicing
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Confirmation Modal */}
        {confirmingAmenity && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
              onClick={handleCancelServicing}
            />
            {/* Dialog */}
            <div className="relative bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md mx-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between p-5 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center justify-center size-9 rounded-lg bg-amber-50 border border-amber-200">
                    <WrenchIcon className="size-4 text-amber-600" />
                  </div>
                  <h3 className="text-base font-semibold text-slate-900">Confirm Service Request</h3>
                </div>
                <button
                  onClick={handleCancelServicing}
                  className="size-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <XIcon className="size-4" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <p className="text-sm text-slate-600">
                  You are about to dispatch a priority maintenance endorsement to the Caretaker for the following amenity:
                </p>
                <div className="rounded-lg bg-slate-50 border border-slate-100 p-3.5 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Amenity</span>
                    <span className="font-semibold text-slate-800 text-right max-w-[60%]">{confirmingAmenity.name}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Location</span>
                    <span className="font-medium text-slate-700">{confirmingAmenity.location}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Category</span>
                    <span className="font-medium text-slate-700">{confirmingAmenity.category}</span>
                  </div>
                </div>
                <p className="text-xs text-slate-400">
                  This action will notify the assigned Caretaker and log the request in the maintenance queue.
                </p>
              </div>
              <div className="flex items-center justify-end gap-2.5 p-5 pt-3 border-t border-slate-100">
                <Button
                  variant="outline"
                  className="h-9 px-4 text-sm border-slate-200 text-slate-600 hover:bg-slate-50"
                  onClick={handleCancelServicing}
                >
                  Cancel
                </Button>
                <Button
                  className="h-9 px-4 text-sm bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm gap-1.5"
                  onClick={handleConfirmServicing}
                >
                  <CheckCircle2Icon className="size-3.5" />
                  Confirm Request
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleDashboardShell>
  );
}
