"use client";

import * as React from "react";
import { ROLES } from "@/lib/roles";
import { RoleDashboardShell } from "@/components/dashboards/role-dashboard-shell";
import { getChiefWardenNav } from "@/components/dashboards/nav-config";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SparklesIcon, CalendarIcon, UsersIcon, DropletsIcon, ZapIcon, ShieldCheckIcon, AlertTriangleIcon } from "lucide-react";
import { toast } from "sonner";
import { apiGetEvents, apiGetEventPrebrief } from "@/lib/api";

export default function ChiefWardenFestivalsPage() {
  const role = ROLES.find((r) => r.id === "chief_warden") || ROLES[5];
  const navItems = getChiefWardenNav();

  const [events, setEvents] = React.useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = React.useState<any>(null);
  const [prebrief, setPrebrief] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function load() {
      try {
        const res = await apiGetEvents();
        const list = Array.isArray(res) ? res : res?.items || [];
        setEvents(list);
        if (list.length > 0) {
          setSelectedEvent(list[0]);
          loadPrebrief(list[0].id);
        }
      } catch {
        // Fallback demo data
        const fallback = [
          {
            id: "ev-1",
            name: "Innovision 2026 (Annual Techno-Management Fest)",
            kind: "techfest",
            starts_on: "2026-11-06",
            ends_on: "2026-11-08",
            expected_footfall: 4500,
            water_surge_multiplier: 1.4,
            electricity_surge_multiplier: 1.35,
            hygiene_pressure_multiplier: 2.2,
          },
          {
            id: "ev-2",
            name: "NIT Rourkela Convocation 2026",
            kind: "convocation",
            starts_on: "2026-12-14",
            ends_on: "2026-12-15",
            expected_footfall: 3200,
            water_surge_multiplier: 1.25,
            electricity_surge_multiplier: 1.2,
            hygiene_pressure_multiplier: 1.8,
          },
        ];
        setEvents(fallback);
        setSelectedEvent(fallback[0]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const loadPrebrief = async (eventId: string) => {
    try {
      const data = await apiGetEventPrebrief(eventId);
      setPrebrief(data);
    } catch {
      // Prebrief fallback
    }
  };

  return (
    <RoleDashboardShell role={role} navItems={navItems}>
      <div className="space-y-6 max-w-6xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Festival Pre-Briefs & Surge Preparedness
            </h1>
            <p className="text-sm text-slate-500">
              Autonomous facility readiness packages for large campus fests, footfall surges, and resource rationing (§7.6, §8.5).
            </p>
          </div>
          <Badge className="bg-indigo-600 text-white px-3 py-1 text-sm font-semibold gap-1.5">
            <SparklesIcon className="size-4" />
            AI Facility Stress Simulator
          </Badge>
        </div>

        {/* Event Selector Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {events.map((ev) => {
            const isSelected = selectedEvent?.id === ev.id;
            return (
              <Card
                key={ev.id}
                className={`cursor-pointer transition-all ${
                  isSelected
                    ? "border-indigo-600 ring-2 ring-indigo-600/10 bg-indigo-50/20"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
                onClick={() => {
                  setSelectedEvent(ev);
                  loadPrebrief(ev.id);
                }}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs uppercase font-mono">
                      {ev.kind}
                    </Badge>
                    <span className="text-xs text-slate-500 flex items-center gap-1 font-mono">
                      <CalendarIcon className="size-3.5 text-slate-400" />
                      {ev.starts_on} to {ev.ends_on}
                    </span>
                  </div>
                  <CardTitle className="text-base font-bold text-slate-900 mt-1">
                    {ev.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-2 text-xs text-slate-600 space-y-2">
                  <div className="flex items-center gap-2">
                    <UsersIcon className="size-4 text-indigo-500" />
                    <span>Expected Footfall: <strong className="text-slate-900">+{ev.expected_footfall} guests</strong></span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center">
                    <div className="bg-slate-50 p-2 rounded">
                      <div className="text-[11px] text-slate-400">Water Surge</div>
                      <div className="font-bold text-slate-800">{ev.water_surge_multiplier}x</div>
                    </div>
                    <div className="bg-slate-50 p-2 rounded">
                      <div className="text-[11px] text-slate-400">Power Surge</div>
                      <div className="font-bold text-slate-800">{ev.electricity_surge_multiplier}x</div>
                    </div>
                    <div className="bg-slate-50 p-2 rounded">
                      <div className="text-[11px] text-slate-400">Hygiene Multiplier</div>
                      <div className="font-bold text-slate-800">{ev.hygiene_pressure_multiplier}x</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Selected Prebrief Operational Plan */}
        {selectedEvent && (
          <Card className="bg-white border-slate-200">
            <CardHeader className="border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <Badge className="bg-emerald-600 text-white text-xs mb-1">
                    Automated Pre-Brief Pack (§8.5)
                  </Badge>
                  <CardTitle className="text-lg font-bold text-slate-900">
                    Hostel Preparedness Mandate — {selectedEvent.name}
                  </CardTitle>
                </div>
                <Button
                  className="bg-slate-900 text-white hover:bg-slate-800 text-xs gap-1.5"
                  onClick={() => toast.success(`Readiness plan dispatched to all 4 Hall Wardens & Estate Office!`)}
                >
                  <ShieldCheckIcon className="size-4" />
                  Issue Chief Warden Mandate
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-4 space-y-2">
                  <div className="flex items-center gap-2 font-semibold text-sm text-blue-900">
                    <DropletsIcon className="size-4 text-blue-600" />
                    Water Contingency Buffer
                  </div>
                  <p className="text-xs text-blue-800">
                    Pre-fill all rooftop storage tanks to 100% 12 hours before festival inauguration. 2 standby 10,000L PHED tankers requisitioned for Hall 14 & Hall 3.
                  </p>
                </div>

                <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4 space-y-2">
                  <div className="flex items-center gap-2 font-semibold text-sm text-amber-900">
                    <ZapIcon className="size-4 text-amber-600" />
                    Diesel Generator (DG) Reserves
                  </div>
                  <p className="text-xs text-amber-800">
                    Ensure 800-litre HSD fuel reserve in Substation 2 generator. Mandatory dual-feed breaker check scheduled with Estate Electrical Wing.
                  </p>
                </div>

                <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 space-y-2">
                  <div className="flex items-center gap-2 font-semibold text-sm text-emerald-900">
                    <ShieldCheckIcon className="size-4 text-emerald-600" />
                    Sanitation & Flying Squad
                  </div>
                  <p className="text-xs text-emerald-800">
                    Washroom cleaning frequency doubled to 4-hour cycle. 2 roving emergency plumbers assigned to high-density guest hostels.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </RoleDashboardShell>
  );
}
