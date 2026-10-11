"use client";

import * as React from "react";
import { ROLES } from "@/lib/roles";
import { RoleDashboardShell } from "@/components/dashboards/role-dashboard-shell";
import { getHostelRepNav } from "@/components/dashboards/nav-config";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2Icon, XCircleIcon, EyeIcon, MapPinIcon, ClockIcon, AlertTriangleIcon } from "lucide-react";
import { toast } from "sonner";
import { apiListComplaints, apiTransitionComplaint } from "@/lib/api";

export default function HostelRepVerificationsPage() {
  const role = ROLES.find((r) => r.id === "hostel_rep") || ROLES[2];
  const navItems = getHostelRepNav();

  const [complaints, setComplaints] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  const loadData = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiListComplaints({ hostel_code: "HB-3" });
      const items = Array.isArray(res) ? res : res?.items || [];
      // Filter those in open or pending verification states
      setComplaints(items);
    } catch {
      toast.error("Failed to load verification list");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleVerify = async (idOrTicket: string, isPhysicalPass: boolean) => {
    try {
      if (isPhysicalPass) {
        await apiTransitionComplaint(idOrTicket, {
          to_status: "ASSIGNED",
          note: "Physically verified by Hostel Representative Rohan Mehta.",
        });
        toast.success(`Complaint ${idOrTicket} physically verified & assigned!`);
      } else {
        await apiTransitionComplaint(idOrTicket, {
          to_status: "REJECTED",
          reason: "Frivolous or inaccurate location on physical inspection",
        });
        toast.info(`Complaint ${idOrTicket} rejected after spot check.`);
      }
      loadData();
    } catch (e: any) {
      toast.error(e?.message || "Action failed");
    }
  };

  return (
    <RoleDashboardShell role={role} navItems={navItems}>
      <div className="space-y-6 max-w-6xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Physical Spot-Check & Verifications
            </h1>
            <p className="text-sm text-slate-500">
              Conduct on-site inspections for reported hostel complaints before dispatching tradesmen.
            </p>
          </div>
          <Badge className="bg-slate-900 text-white px-3 py-1 text-sm font-medium">
            Hall 14 (HB-3) Protocol
          </Badge>
        </div>

        {/* Info card */}
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4 text-xs text-emerald-950 flex items-start gap-3">
          <CheckCircle2Icon className="size-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold text-emerald-900">FSM State Machine Handshake (§3.1)</span>
            <p className="text-emerald-800">
              Hostel Rep physical sign-off prevents duplicate tradesmen dispatch and protects Caretakers from spurious complaints. Verifying immediately updates the SLA timer.
            </p>
          </div>
        </div>

        {/* Complaints awaiting verification */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {complaints.length === 0 ? (
            <div className="col-span-2 text-center py-12 text-slate-400">
              No pending verifications. All complaints have been inspected.
            </div>
          ) : (
            complaints.map((c) => (
              <Card key={c.id} className="bg-white border-slate-200 hover:shadow-sm transition-all">
                <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-indigo-600">
                        {c.ticket_no || c.id}
                      </span>
                      <Badge
                        variant="outline"
                        className={
                          c.priority === "P1"
                            ? "bg-rose-50 text-rose-700 border-rose-200 text-xs"
                            : c.priority === "P2"
                            ? "bg-amber-50 text-amber-700 border-amber-200 text-xs"
                            : "bg-slate-50 text-slate-700 border-slate-200 text-xs"
                        }
                      >
                        {c.priority || "P3"}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {c.category_code || "GEN"}
                      </Badge>
                    </div>
                    <CardTitle className="text-base font-semibold text-slate-900">
                      {c.title}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-xs text-slate-600 line-clamp-2">
                    {c.description}
                  </p>

                  <div className="rounded-lg bg-slate-50 p-2.5 text-xs text-slate-600 flex items-center justify-between border border-slate-100">
                    <span className="flex items-center gap-1.5">
                      <MapPinIcon className="size-3.5 text-slate-400" />
                      {c.room_no ? `Block ${c.block_name || "A"}, Room ${c.room_no}` : c.location_text || "HB-3"}
                    </span>
                    <span className="flex items-center gap-1.5 text-slate-500">
                      <ClockIcon className="size-3.5 text-slate-400" />
                      Status: {c.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700 border-rose-200 gap-1"
                      onClick={() => handleVerify(c.ticket_no || c.id, false)}
                    >
                      <XCircleIcon className="size-3.5" />
                      Reject (Frivolous)
                    </Button>
                    <Button
                      size="sm"
                      className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                      onClick={() => handleVerify(c.ticket_no || c.id, true)}
                    >
                      <CheckCircle2Icon className="size-3.5" />
                      Confirm & Pass
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </RoleDashboardShell>
  );
}
