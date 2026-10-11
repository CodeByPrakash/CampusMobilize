"use client";

import * as React from "react";
import { ROLES } from "@/lib/roles";
import { RoleDashboardShell } from "@/components/dashboards/role-dashboard-shell";
import { getChiefWardenNav } from "@/components/dashboards/nav-config";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  SparklesIcon,
  CalendarIcon,
  UsersIcon,
  DropletsIcon,
  ZapIcon,
  ShieldCheckIcon,
  ActivityIcon,
  LayersIcon,
} from "lucide-react";
import { toast } from "sonner";
import { apiGetEvents, apiGetEventPrebrief } from "@/lib/api";
import { FestivalPreBriefPack } from "@/components/festivals/festival-prebrief-pack";
import { FacilityStressSimulator } from "@/components/festivals/facility-stress-simulator";

export default function ChiefWardenFestivalsPage() {
  const role = ROLES.find((r) => r.id === "chief_warden") || ROLES[5];
  const navItems = getChiefWardenNav();

  const [activeTab, setActiveTab] = React.useState<"prebriefs" | "simulator">("prebriefs");
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
            id: "evt-innovision-2026",
            name: "Innovision 2026 (All-India Techno-Management Fest)",
            kind: "techfest",
            starts_on: "2026-11-06",
            ends_on: "2026-11-08",
            expected_footfall: 4500,
            water_surge_multiplier: 1.38,
            electricity_surge_multiplier: 1.22,
            hygiene_pressure_multiplier: 3.1,
          },
          {
            id: "evt-endsem-autumn-2026",
            name: "Autumn Semester End-Term Examinations",
            kind: "exam",
            starts_on: "2026-11-23",
            ends_on: "2026-12-04",
            expected_footfall: 0,
            water_surge_multiplier: 1.05,
            electricity_surge_multiplier: 1.15,
            hygiene_pressure_multiplier: 1.4,
          },
          {
            id: "evt-nitrutsav-2027",
            name: "Nitrutsav 2027 (Annual Cultural Festival)",
            kind: "festival",
            starts_on: "2027-02-12",
            ends_on: "2027-02-14",
            expected_footfall: 3800,
            water_surge_multiplier: 1.3,
            electricity_surge_multiplier: 1.25,
            hygiene_pressure_multiplier: 2.8,
          },
        ];
        setEvents(fallback);
        setSelectedEvent(fallback[0]);
        loadPrebrief(fallback[0].id);
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
      // Fallback prebrief if offline
      setPrebrief({
        event_name: selectedEvent?.name || "Campus Event",
        days_until: 25,
        predicted_surges: {
          water_surge_pct: Math.round(((selectedEvent?.water_surge_multiplier || 1.38) - 1) * 100),
          electricity_surge_pct: Math.round(((selectedEvent?.electricity_surge_multiplier || 1.22) - 1) * 100),
          hygiene_pressure_multiplier: selectedEvent?.hygiene_pressure_multiplier || 3.1,
        },
        critical_hostels: ["HB-3", "CVR", "KMS", "Hall 14"],
        budget_inr: 52000,
        estimated_budget_inr: 52000,
        recommendations: [
          "Pre-inspect pumps and overhead tanks in HB-3, CVR, KMS 48h prior",
          "Schedule 4 additional sweepers per residential block during peak meal hours",
          "Stage emergency electrical repair kits with on-call technicians",
          "Reserve provisional emergency contingency budget of ₹52,000",
        ],
        summary_text: `${selectedEvent?.name || "Innovision 2026"} in 25 days — predicted water demand +38%, electricity +22%, hygiene complaints ×3.1. Recommended: pre-inspect pumps in HB-3, CVR, KMS; schedule extra sanitation staff; budget ≈ ₹52,000.`,
        staffing_plan: {
          extra_sanitation_workers: 4,
          on_call_electricians: 2,
          pump_operators: 2,
        },
      });
    }
  };

  const handleApplySimulatedPlan = (simData: any) => {
    setActiveTab("prebriefs");
    toast.success("Applied simulated stress projections to Festival Preparedness Mandate!");
  };

  return (
    <RoleDashboardShell role={role} navItems={navItems}>
      <div className="space-y-6 max-w-6xl pb-10">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Festival Pre-Briefs & Surge Preparedness
            </h1>
            <p className="text-sm text-slate-500">
              Autonomous facility readiness packages for large campus fests, footfall surges, and resource rationing (§7.6, §8.5).
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="flex items-center bg-slate-100/90 p-1 rounded-xl border border-slate-200 shadow-2xs">
              <button
                type="button"
                onClick={() => setActiveTab("prebriefs")}
                className={`text-xs font-bold px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  activeTab === "prebriefs"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <LayersIcon className="size-3.5 text-indigo-600" />
                <span>Pre-Briefs & Mandates</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("simulator")}
                className={`text-xs font-bold px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  activeTab === "simulator"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-indigo-700 hover:text-indigo-950"
                }`}
              >
                <SparklesIcon className="size-3.5 animate-pulse" />
                <span>AI Stress Simulator</span>
                <span className={`ml-1 text-[9px] font-mono py-0.5 px-1.5 rounded ${
                  activeTab === "simulator" ? "bg-white/20 text-white" : "bg-indigo-100 text-indigo-700"
                }`}>
                  Digital Twin
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Tab 1: Festival Pre-Briefs View */}
        {activeTab === "prebriefs" && (
          <div className="space-y-6">
            {/* Event Selector Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {events.map((ev) => {
                const isSelected = selectedEvent?.id === ev.id;
                return (
                  <Card
                    key={ev.id}
                    className={`cursor-pointer transition-all ${
                      isSelected
                        ? "border-indigo-600 ring-2 ring-indigo-600/15 bg-indigo-50/20 shadow-xs"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                    onClick={() => {
                      setSelectedEvent(ev);
                      loadPrebrief(ev.id);
                    }}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <Badge
                          variant="outline"
                          className={`text-xs uppercase font-mono ${
                            isSelected ? "border-indigo-300 text-indigo-700 bg-white" : ""
                          }`}
                        >
                          {ev.kind}
                        </Badge>
                        <span className="text-[11px] text-slate-500 flex items-center gap-1 font-mono">
                          <CalendarIcon className="size-3 text-slate-400" />
                          {ev.starts_on} to {ev.ends_on}
                        </span>
                      </div>
                      <CardTitle className="text-sm font-bold text-slate-900 mt-1 line-clamp-1">
                        {ev.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-1 text-xs text-slate-600 space-y-2">
                      <div className="flex items-center gap-1.5">
                        <UsersIcon className="size-3.5 text-indigo-500" />
                        <span>
                          Expected Footfall:{" "}
                          <strong className="text-slate-900 font-mono">
                            +{ev.expected_footfall} guests
                          </strong>
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-slate-100 text-center">
                        <div className="bg-slate-50 p-1.5 rounded">
                          <div className="text-[10px] text-slate-400">Water Surge</div>
                          <div className="font-bold text-slate-800 text-xs">
                            {ev.water_surge_multiplier}x
                          </div>
                        </div>
                        <div className="bg-slate-50 p-1.5 rounded">
                          <div className="text-[10px] text-slate-400">Power Surge</div>
                          <div className="font-bold text-slate-800 text-xs">
                            {ev.electricity_surge_multiplier}x
                          </div>
                        </div>
                        <div className="bg-slate-50 p-1.5 rounded">
                          <div className="text-[10px] text-slate-400">Hygiene Multiplier</div>
                          <div className="font-bold text-slate-800 text-xs">
                            {ev.hygiene_pressure_multiplier}x
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Selected Prebrief Operational Plan Component */}
            {selectedEvent && (
              <FestivalPreBriefPack
                selectedEvent={selectedEvent}
                prebrief={prebrief}
                onOpenSimulator={() => setActiveTab("simulator")}
              />
            )}
          </div>
        )}

        {/* Tab 2: AI Facility Stress Simulator View */}
        {activeTab === "simulator" && (
          <FacilityStressSimulator
            initialEvent={selectedEvent}
            allEvents={events}
            onApplyAsMandate={handleApplySimulatedPlan}
            onClose={() => setActiveTab("prebriefs")}
          />
        )}
      </div>
    </RoleDashboardShell>
  );
}
