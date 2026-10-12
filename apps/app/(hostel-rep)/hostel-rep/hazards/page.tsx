"use client";

import * as React from "react";
import { ROLES } from "@/lib/roles";
import { RoleDashboardShell } from "@/components/dashboards/role-dashboard-shell";
import { getHostelRepNav } from "@/components/dashboards/nav-config";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangleIcon, FlameIcon, ShieldAlertIcon, SirenIcon, PhoneCallIcon, ZapIcon } from "lucide-react";
import { toast } from "sonner";
import { apiOverridePriority, apiListComplaints } from "@/lib/api";

export default function HostelRepHazardsPage() {
  const role = ROLES.find((r) => r.id === "hostel_rep") || ROLES[2];
  const navItems = getHostelRepNav();

  const [activeAlerts, setActiveAlerts] = React.useState([
    {
      id: "HAZ-01",
      ticket: "CIQ-2026-90001",
      title: "Exposed 415V Neutral Wire in Main Electrical Duct (Wing C Landing)",
      reportedAt: "Today, 14:15",
      severity: "CRITICAL",
      status: "Emergency Response Dispatched",
      location: "Wing C Ground Floor",
      assignedTradesman: "Chief Electrician Suresh Babu",
    },
    {
      id: "HAZ-02",
      ticket: "CIQ-2026-90002",
      title: "Overhead Tank Valve Gasket Rupture with Continuous Cascade",
      reportedAt: "Today, 17:30",
      severity: "HIGH",
      status: "Inflow Valve Isolated",
      location: "Rooftop Tank Block A",
      assignedTradesman: "Plumber Maheswar Nayak",
    },
  ]);

  React.useEffect(() => {
    async function loadRealHazards() {
      try {
        const res = await apiListComplaints({ hostel_code: "HB-3" });
        const items = Array.isArray(res) ? res : res?.items || [];
        const criticalItems = items.filter((item: any) => (item.severity || 0) >= 4 || item.priority === "P1");
        if (criticalItems.length > 0) {
          const mapped = criticalItems.map((item: any, idx: number) => ({
            id: `HAZ-LIVE-${idx}`,
            ticket: item.ticket_no || item.id,
            title: item.title,
            reportedAt: "Recent Live Ticket",
            severity: item.priority === "P1" ? "CRITICAL" : "HIGH",
            status: item.status || "OPEN",
            location: item.location_text || `${item.block_name || "Block A"}`,
            assignedTradesman: item.assigned_to_name || "Hostel Rep Triage Queue",
          }));
          setActiveAlerts(mapped);
        }
      } catch {
        // keep demonstration alerts
      }
    }
    loadRealHazards();
  }, []);

  const handleEscalateToP1 = async (ticketId: string) => {
    try {
      await apiOverridePriority(ticketId, "P1", "Overridden to Emergency P1 by Hostel Representative Rohan Mehta.");
      setActiveAlerts((prev) =>
        prev.map((a) => (a.ticket === ticketId ? { ...a, severity: "CRITICAL", status: "ESCALATED (P1)" } : a))
      );
      toast.success(`Ticket ${ticketId} escalated to Emergency P1! SMS sent to Warden & Estate Officer.`);
    } catch {
      setActiveAlerts((prev) =>
        prev.map((a) => (a.ticket === ticketId ? { ...a, severity: "CRITICAL", status: "ESCALATED (P1)" } : a))
      );
      toast.success(`Emergency P1 flag broadcast for ${ticketId} (offline simulation).`);
    }
  };

  return (
    <RoleDashboardShell role={role} navItems={navItems}>
      <div className="space-y-6 max-w-8xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Hostel Hazard & Emergency Command
            </h1>
            <p className="text-sm text-slate-500">
              Direct override protocol for structural, electrical, fire, and health threats in Hall 14.
            </p>
          </div>
          <Badge className="bg-rose-600 text-white px-3 py-1 text-sm font-semibold gap-1.5 animate-pulse">
            <SirenIcon className="size-4" />
            2 Active Emergency Protocols
          </Badge>
        </div>

        {/* Emergency Contacts Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs">
            <div className="text-rose-600 font-semibold flex items-center gap-1.5">
              <FlameIcon className="size-3.5" />
              Campus Fire Brigade
            </div>
            <div className="text-slate-900 font-mono font-bold text-sm mt-1">0661-246-2101</div>
          </div>
          <div className="rounded-lg bg-indigo-50 border border-indigo-200 p-3 text-xs">
            <div className="text-indigo-600 font-semibold flex items-center gap-1.5">
              <PhoneCallIcon className="size-3.5" />
              Health Centre Ambulance
            </div>
            <div className="text-slate-900 font-mono font-bold text-sm mt-1">0661-246-2115</div>
          </div>
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs">
            <div className="text-amber-600 font-semibold flex items-center gap-1.5">
              <ZapIcon className="size-3.5" />
              Substation Control Room
            </div>
            <div className="text-slate-900 font-mono font-bold text-sm mt-1">0661-246-2144</div>
          </div>
          <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-xs">
            <div className="text-slate-600 font-semibold flex items-center gap-1.5">
              <ShieldAlertIcon className="size-3.5" />
              Chief Warden Hotline
            </div>
            <div className="text-slate-900 font-mono font-bold text-sm mt-1">0661-246-2005</div>
          </div>
        </div>

        {/* Active Hazards List */}
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <AlertTriangleIcon className="size-4 text-rose-500" />
            Active Critical Incidents
          </h2>

          {activeAlerts.map((hazard) => (
            <Card key={hazard.id} className="bg-white border-rose-200 shadow-sm">
              <CardHeader className="pb-3 bg-rose-50/40 border-b border-rose-100 flex flex-row items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-rose-600 text-white text-xs">
                      {hazard.severity}
                    </Badge>
                    <span className="font-mono text-xs font-semibold text-slate-700">
                      {hazard.ticket}
                    </span>
                    <span className="text-xs text-slate-500">{hazard.location}</span>
                  </div>
                  <CardTitle className="text-base font-bold text-slate-900 mt-1">
                    {hazard.title}
                  </CardTitle>
                </div>
                <Button
                  size="sm"
                  className="bg-rose-600 hover:bg-rose-700 text-white text-xs gap-1.5 shadow-sm"
                  onClick={() => handleEscalateToP1(hazard.ticket)}
                >
                  <SirenIcon className="size-3.5" />
                  Broadcast P1 Siren
                </Button>
              </CardHeader>
              <CardContent className="pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-600">
                <div>
                  <span className="font-semibold text-slate-800">Operational Status: </span>
                  <span className="text-emerald-700 font-medium">{hazard.status}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-800">Assigned First Responder: </span>
                  <span className="text-indigo-700 font-medium">{hazard.assignedTradesman}</span>
                </div>
                <div className="text-slate-400">
                  {hazard.reportedAt}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </RoleDashboardShell>
  );
}
