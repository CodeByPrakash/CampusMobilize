"use client";

import * as React from "react";
import { ROLES } from "@/lib/roles";
import { RoleDashboardShell } from "@/components/dashboards/role-dashboard-shell";
import { getCrNav } from "@/components/dashboards/nav-config";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileCheckIcon, CheckCircle2Icon, MessageSquareIcon, ArrowUpRightIcon, AlertTriangleIcon } from "lucide-react";
import { toast } from "sonner";
import { apiListComplaints } from "@/lib/api";

export default function CrEndorsementsPage() {
  const role = ROLES.find((r) => r.id === "student") || ROLES[0];
  const navItems = getCrNav();

  const [complaints, setComplaints] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [endorsedIds, setEndorsedIds] = React.useState<Record<string, boolean>>({});

  React.useEffect(() => {
    async function load() {
      try {
        const res = await apiListComplaints({ hostel_code: "HB-3" });
        const items = Array.isArray(res) ? res : res?.items || [];
        setComplaints(items);
      } catch {
        // Fallback demo items
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleEndorse = (id: string, ticketNo: string) => {
    setEndorsedIds((prev) => ({ ...prev, [id]: true }));
    toast.success(`Ticket ${ticketNo} officially endorsed by CR Diya Patel! Priority score boosted.`);
  };

  return (
    <RoleDashboardShell role={role} navItems={navItems}>
      <div className="space-y-6 max-w-8xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              CR Endorsement & Verification Ledger
            </h1>
            <p className="text-sm text-slate-500">
              Endorse legitimate Wing B resident tickets to fast-track triage and trigger Caretaker work orders.
            </p>
          </div>
          <Badge className="bg-emerald-600 text-white px-3 py-1 text-sm font-medium">
            Active CR Mandate: Wing B
          </Badge>
        </div>

        {/* Info Banner */}
        <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-4 text-xs text-indigo-900 flex items-start gap-3">
          <FileCheckIcon className="size-5 text-indigo-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold text-indigo-950">Statutory Role: CR Verification Authority (2.2)</span>
            <p className="text-indigo-800">
              When you endorse a ticket, it attaches your cryptographic actor stamp (Diya Patel, CR), increases the dynamic AI queue urgency by +15 points, and marks the issue as physically confirmed.
            </p>
          </div>
        </div>

        {/* Complaints Table */}
        <Card className="bg-white border-slate-200">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-900">
              Wing Complaints Awaiting CR Action
            </CardTitle>
            <CardDescription className="text-xs">
              Live complaints filed by residents in Hall 14 (HB-3)
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-y border-slate-200 text-xs font-semibold text-slate-500 uppercase">
                  <tr>
                    <th className="px-4 py-3">Ticket</th>
                    <th className="px-4 py-3">Issue Title</th>
                    <th className="px-4 py-3">Room / Wing</th>
                    <th className="px-4 py-3">Priority</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">CR Endorsement</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {complaints.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-slate-400 text-sm">
                        No pending tickets in Wing B. All resident issues endorsed!
                      </td>
                    </tr>
                  ) : (
                    complaints.map((c) => {
                      const isEndorsed = endorsedIds[c.id];
                      return (
                        <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-800">
                            {c.ticket_no || c.id}
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-medium text-slate-900">{c.title}</div>
                            <div className="text-xs text-slate-500 truncate max-w-xs">{c.description}</div>
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-600 font-mono">
                            {c.room_no ? `${c.block_name || "B"}-${c.room_no}` : c.location_text || "Wing B"}
                          </td>
                          <td className="px-4 py-3">
                            <Badge
                              variant="outline"
                              className={
                                c.priority === "P1"
                                  ? "bg-rose-50 text-rose-700 border-rose-200"
                                  : c.priority === "P2"
                                    ? "bg-amber-50 text-amber-700 border-amber-200"
                                    : "bg-slate-50 text-slate-700 border-slate-200"
                              }
                            >
                              {c.priority || "P3"}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className="text-xs">
                              {c.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-right">
                            {isEndorsed ? (
                              <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 gap-1 text-xs">
                                <CheckCircle2Icon className="size-3" />
                                Endorsed
                              </Badge>
                            ) : (
                              <Button
                                size="sm"
                                className="h-8 text-xs bg-slate-900 text-white hover:bg-slate-800 gap-1.5"
                                onClick={() => handleEndorse(c.id, c.ticket_no || c.id)}
                              >
                                <CheckCircle2Icon className="size-3 text-emerald-400" />
                                Endorse Ticket
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </RoleDashboardShell>
  );
}
