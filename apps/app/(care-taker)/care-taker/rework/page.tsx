"use client";

import * as React from "react";
import { ROLES } from "@/lib/roles";
import { RoleDashboardShell } from "@/components/dashboards/role-dashboard-shell";
import { getCaretakerNav } from "@/components/dashboards/nav-config";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RotateCcwIcon, AlertCircleIcon, WrenchIcon, ArrowRightIcon, CheckCircle2Icon } from "lucide-react";
import { toast } from "sonner";
import { apiTransitionComplaint } from "@/lib/api";

export default function CaretakerReworkPage() {
  const role = ROLES.find((r) => r.id === "caretaker") || ROLES[3];
  const navItems = getCaretakerNav();

  const [reworkItems, setReworkItems] = React.useState([
    {
      id: "TI-HB3-0095",
      title: "Geyser Thermostat Trips Repeatedly after Element Replacement",
      room: "Washroom 204-206",
      reworkReason: "Resident reported water became boiling hot and then MCB tripped within 10 minutes.",
      rejectedBy: "Dr. S. Nanda (Warden Audit)",
      penaltyPct: "-5.0% PI Impact",
      tradesman: "Suresh Electrician",
    },
  ]);

  const handleRestart = async (id: string) => {
    try {
      await apiTransitionComplaint(id, {
        to_status: "IN_PROGRESS",
        note: "Senior technician re-assigned with new heavy-duty thermostat unit.",
      });
      toast.success(`Ticket ${id} moved to IN_PROGRESS with priority re-inspection!`);
      setReworkItems((prev) => prev.filter((i) => i.id !== id));
    } catch {
      toast.success(`Ticket ${id} dispatched for immediate re-work (offline simulation).`);
      setReworkItems((prev) => prev.filter((i) => i.id !== id));
    }
  };

  return (
    <RoleDashboardShell role={role} navItems={navItems}>
      <div className="space-y-6 max-w-6xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Re-Work Queue & Quality Audits
            </h1>
            <p className="text-sm text-slate-500">
              Complaints returned by Residents or Warden audit due to incomplete or defective resolution.
            </p>
          </div>
          <Badge className="bg-rose-600 text-white px-3 py-1 text-sm font-semibold gap-1.5">
            <RotateCcwIcon className="size-4" />
            1 High-Priority Re-Work
          </Badge>
        </div>

        {/* PI Warning */}
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-950 flex items-start gap-3">
          <AlertCircleIcon className="size-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold text-amber-900">Performance Index (PI) Governance (§11.1)</span>
            <p className="text-amber-800">
              Formula: <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">PI = 100 * (0.45*SLA + 0.30*FTR + 0.15*Rating + 0.10*Throughput) - 5*ReworkRate</code>. Resolving rework tickets with verified photographic proof restores your First-Time-Resolution metrics.
            </p>
          </div>
        </div>

        {/* List of rework tickets */}
        <div className="space-y-4">
          {reworkItems.length === 0 ? (
            <Card className="bg-white border-slate-200 p-8 text-center text-slate-400">
              Zero pending rework tickets! Your first-time resolution rate is 100%.
            </Card>
          ) : (
            reworkItems.map((item) => (
              <Card key={item.id} className="bg-white border-rose-200 shadow-sm">
                <CardHeader className="pb-3 border-b border-rose-100 flex flex-row items-center justify-between bg-rose-50/30">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-rose-700">
                        {item.id}
                      </span>
                      <Badge className="bg-rose-100 text-rose-800 border-rose-200 text-xs">
                        Audit Rejected
                      </Badge>
                      <Badge variant="outline" className="text-xs text-slate-600">
                        {item.room}
                      </Badge>
                    </div>
                    <CardTitle className="text-base font-semibold text-slate-900 mt-1">
                      {item.title}
                    </CardTitle>
                  </div>
                  <Badge variant="outline" className="font-mono text-rose-600 border-rose-200">
                    {item.penaltyPct}
                  </Badge>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <div className="rounded-lg bg-rose-50 border border-rose-100 p-3 text-xs space-y-1">
                    <span className="font-semibold text-rose-900">Auditor Rejection Reason:</span>
                    <p className="text-rose-800">{item.reworkReason}</p>
                    <div className="text-[11px] text-rose-600 font-medium pt-1">
                      Audited by: {item.rejectedBy}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <div>
                      Previous Tradesman: <span className="font-semibold text-slate-800">{item.tradesman}</span>
                    </div>
                    <Button
                      size="sm"
                      className="bg-slate-900 hover:bg-slate-800 text-white gap-1.5 shadow-sm"
                      onClick={() => handleRestart(item.id)}
                    >
                      <WrenchIcon className="size-3.5" />
                      Re-Dispatch Senior Tradesman
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
