"use client";

import * as React from "react";
import { ROLES } from "@/lib/roles";
import { RoleDashboardShell } from "@/components/dashboards/role-dashboard-shell";
import { getWardenNav } from "@/components/dashboards/nav-config";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserPlusIcon, WrenchIcon, CheckCircle2Icon, ShieldCheckIcon, ClockIcon } from "lucide-react";
import { toast } from "sonner";
import { apiListComplaints, apiTransitionComplaint } from "@/lib/api";

export default function WardenAssignPage() {
  const role = ROLES.find((r) => r.id === "warden") || ROLES[4];
  const navItems = getWardenNav();

  const [pendingTickets, setPendingTickets] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  const tradesmen = [
    { id: "tm-1", name: "Suresh Babu", trade: "Senior Electrician", workload: "2 Active Jobs", rating: "4.9★" },
    { id: "tm-2", name: "Maheswar Nayak", trade: "Head Plumber", workload: "1 Active Job", rating: "4.8★" },
    { id: "tm-3", name: "Bijay Carpenter", trade: "Carpentry & Locks", workload: "0 Active Jobs", rating: "4.7★" },
    { id: "tm-4", name: "R. Das", trade: "Caretaker / General", workload: "3 Active Jobs", rating: "4.8★" },
  ];

  const loadData = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiListComplaints({ hostel_code: "HB-3" });
      const items = Array.isArray(res) ? res : res?.items || [];
      setPendingTickets(items);
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAssign = async (ticketId: string, tradesmanName: string) => {
    try {
      await apiTransitionComplaint(ticketId, {
        to_status: "ASSIGNED",
        note: `Assigned to ${tradesmanName} by Warden Dr. S. Nanda.`,
      });
      toast.success(`Assigned ${ticketId} to ${tradesmanName}! Technician notified via SMS/email.`);
      loadData();
    } catch (e: any) {
      toast.error(e?.message || "Failed to assign tradesman");
    }
  };

  return (
    <RoleDashboardShell role={role} navItems={navItems}>
      <div className="space-y-6 max-w-6xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Assign Tradesmen & Resource Dispatch
            </h1>
            <p className="text-sm text-slate-500">
              Match verified resident complaints with skilled institute technicians and monitor active workloads.
            </p>
          </div>
          <Badge className="bg-slate-900 text-white px-3 py-1 text-sm font-medium">
            Hall of Residence 14 Roster
          </Badge>
        </div>

        {/* Technician Workload Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {tradesmen.map((tm) => (
            <Card key={tm.id} className="bg-white border-slate-200">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs font-normal">
                    {tm.trade}
                  </Badge>
                  <span className="text-xs font-semibold text-amber-600">{tm.rating}</span>
                </div>
                <CardTitle className="text-sm font-bold text-slate-900 mt-1">
                  {tm.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-slate-500">{tm.workload}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Ticket Assignment Queue */}
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <UserPlusIcon className="size-4 text-indigo-600" />
            Tickets Awaiting Technician Assignment
          </h2>

          {pendingTickets.length === 0 ? (
            <Card className="bg-white border-slate-200 p-8 text-center text-slate-400">
              No unassigned tickets! All open work orders have tradesmen assigned.
            </Card>
          ) : (
            pendingTickets.map((t) => (
              <Card key={t.id} className="bg-white border-slate-200">
                <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-800">
                        {t.ticket_no || t.id}
                      </span>
                      <Badge
                        variant="outline"
                        className={
                          t.priority === "P1"
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }
                      >
                        {t.priority || "P3"}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {t.category_code || "GEN"}
                      </Badge>
                    </div>
                    <CardTitle className="text-base font-semibold text-slate-900 mt-1">
                      {t.title}
                    </CardTitle>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    Current: {t.status}
                  </Badge>
                </CardHeader>
                <CardContent className="pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <p className="text-xs text-slate-600 max-w-xl">{t.description}</p>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs"
                      onClick={() => handleAssign(t.ticket_no || t.id, "Suresh Babu (Electrician)")}
                    >
                      Assign Electrician
                    </Button>
                    <Button
                      size="sm"
                      className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
                      onClick={() => handleAssign(t.ticket_no || t.id, "Maheswar Nayak (Plumber)")}
                    >
                      Assign Plumber
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
