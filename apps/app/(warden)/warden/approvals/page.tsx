"use client";

import * as React from "react";
import { ROLES } from "@/lib/roles";
import { RoleDashboardShell } from "@/components/dashboards/role-dashboard-shell";
import { getWardenNav } from "@/components/dashboards/nav-config";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EyeIcon, CheckCircle2Icon, XCircleIcon, CameraIcon, ShieldCheckIcon, ClockIcon } from "lucide-react";
import { toast } from "sonner";
import { apiListComplaints, apiTransitionComplaint } from "@/lib/api";

export default function WardenApprovalsPage() {
  const role = ROLES.find((r) => r.id === "warden") || ROLES[4];
  const navItems = getWardenNav();

  const [auditTickets, setAuditTickets] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  const loadData = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiListComplaints({ status: "RESOLVED", hostel_code: "HB-3" });
      const items = Array.isArray(res) ? res : res?.items || [];
      setAuditTickets(items);
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAuditDecision = async (ticketId: string, isApproved: boolean) => {
    try {
      if (isApproved) {
        await apiTransitionComplaint(ticketId, {
          to_status: "CLOSED",
          note: "Resolution inspected and approved by Warden Dr. S. Nanda.",
        });
        toast.success(`Complaint ${ticketId} approved & CLOSED! Student notified to rate resolution.`);
      } else {
        await apiTransitionComplaint(ticketId, {
          to_status: "IN_PROGRESS",
          reason: "Warden audit failed: Workmanship does not meet standards. Re-work required.",
        });
        toast.info(`Complaint ${ticketId} returned to Caretaker for mandatory re-work.`);
      }
      loadData();
    } catch (e: any) {
      toast.error(e?.message || "Audit decision failed");
    }
  };

  return (
    <RoleDashboardShell role={role} navItems={navItems}>
      <div className="space-y-6 max-w-6xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Resolution Audits & Closure Sign-Off
            </h1>
            <p className="text-sm text-slate-500">
              Statutory Warden review of completed tradesman jobs before official ticket closure (§3.1).
            </p>
          </div>
          <Badge className="bg-indigo-600 text-white px-3 py-1 text-sm font-semibold gap-1.5">
            <EyeIcon className="size-4" />
            {auditTickets.length} Jobs Awaiting Final Sign-Off
          </Badge>
        </div>

        {/* Audit Queue */}
        <div className="space-y-4">
          {auditTickets.length === 0 ? (
            <Card className="bg-white border-slate-200 p-8 text-center text-slate-400">
              All resolved complaints have been audited and closed! Zero pending sign-offs.
            </Card>
          ) : (
            auditTickets.map((ticket) => (
              <Card key={ticket.id} className="bg-white border-slate-200">
                <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-800">
                        {ticket.ticket_no || ticket.id}
                      </span>
                      <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200 text-xs">
                        Awaiting Audit
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {ticket.category_code || "MAINT"}
                      </Badge>
                    </div>
                    <CardTitle className="text-base font-semibold text-slate-900">
                      {ticket.title}
                    </CardTitle>
                  </div>
                  <Badge variant="outline" className="text-xs text-emerald-700 bg-emerald-50 border-emerald-200">
                    Resolved by Caretaker
                  </Badge>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <p className="text-xs text-slate-600">{ticket.description}</p>

                  <div className="rounded-lg bg-slate-50 border border-slate-100 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <CameraIcon className="size-4 text-indigo-600" />
                      <span className="font-medium text-slate-700">Resolution Proof:</span>
                      <a
                        href={ticket.resolution_photo_url || "#"}
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-600 underline hover:text-indigo-800"
                      >
                        Inspect Photographic Evidence
                      </a>
                    </div>
                    <div className="text-slate-500">
                      Location: <span className="font-medium text-slate-700">{ticket.room_no ? `Room ${ticket.room_no}` : ticket.location_text || "HB-3"}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs text-rose-600 border-rose-200 hover:bg-rose-50 gap-1.5"
                      onClick={() => handleAuditDecision(ticket.ticket_no || ticket.id, false)}
                    >
                      <XCircleIcon className="size-4" />
                      Reject & Demand Re-Work
                    </Button>
                    <Button
                      size="sm"
                      className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-sm"
                      onClick={() => handleAuditDecision(ticket.ticket_no || ticket.id, true)}
                    >
                      <CheckCircle2Icon className="size-4" />
                      Approve & Officially Close Ticket
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
