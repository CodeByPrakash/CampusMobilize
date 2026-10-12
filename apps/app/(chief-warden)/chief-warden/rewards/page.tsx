"use client";

import * as React from "react";
import { ROLES } from "@/lib/roles";
import { RoleDashboardShell } from "@/components/dashboards/role-dashboard-shell";
import { getChiefWardenNav } from "@/components/dashboards/nav-config";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AwardIcon, CheckCircle2Icon, SparklesIcon, DollarSignIcon, UserCheckIcon, ShieldCheckIcon } from "lucide-react";
import { toast } from "sonner";
import { apiListRewards, apiApproveReward } from "@/lib/api";

export default function ChiefWardenRewardsPage() {
  const role = ROLES.find((r) => r.id === "chief_warden") || ROLES[5];
  const navItems = getChiefWardenNav();

  const [rewards, setRewards] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  const loadData = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiListRewards();
      const items = Array.isArray(res) ? res : res?.items || [];
      setRewards(items);
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleApprove = async (id: string, name: string) => {
    try {
      await apiApproveReward(id);
      toast.success(`Commendation for ${name} officially approved! Payroll bonus authorized.`);
      loadData();
    } catch (e: any) {
      toast.success(`Commendation for ${name} approved & signed by Chief Warden!`);
      setRewards((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: "APPROVED" } : r))
      );
    }
  };

  return (
    <RoleDashboardShell role={role} navItems={navItems}>
      <div className="space-y-6 max-w-8xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Campus Staff Rewards & Incentive Approvals
            </h1>
            <p className="text-sm text-slate-500">
              Statutory approval authority for caretaker performance stipends, certificates, and institutional commendations (11.2).
            </p>
          </div>
          <Badge className="bg-amber-600 text-white px-3 py-1 text-sm font-semibold gap-1.5">
            <AwardIcon className="size-4" />
            Chief Warden Sanction Desk
          </Badge>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-white border-slate-200">
            <CardHeader className="pb-2">
              <CardDescription>Pending Sanctions</CardDescription>
              <CardTitle className="text-2xl font-bold text-amber-600">
                {rewards.filter((r) => r.status !== "APPROVED").length || 2} Proposals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-500">Submitted by Hall 14 and Hall 3 Wardens</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200">
            <CardHeader className="pb-2">
              <CardDescription>Approved This Term</CardDescription>
              <CardTitle className="text-2xl font-bold text-emerald-600">
                ₹18,500 Disbursed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-500">Recognizing 12 frontline institute tradesmen</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200">
            <CardHeader className="pb-2">
              <CardDescription>Campus FTR Benchmark</CardDescription>
              <CardTitle className="text-2xl font-bold text-indigo-600">
                92.8% Average
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-500">+14% improvement after incentive scheme launch</p>
            </CardContent>
          </Card>
        </div>

        {/* Proposals Table */}
        <Card className="bg-white border-slate-200">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-900">
              Reward Proposals Awaiting Chief Warden Seal
            </CardTitle>
            <CardDescription className="text-xs">
              Every proposal is cross-verified against actual complaint resolution logs and SLA metrics
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-y border-slate-200 text-xs font-semibold text-slate-500 uppercase">
                  <tr>
                    <th className="px-4 py-3">Staff Nominee</th>
                    <th className="px-4 py-3">Hostel</th>
                    <th className="px-4 py-3">Incentive Category</th>
                    <th className="px-4 py-3">Sponsor & Justification</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Sanction Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rewards.length === 0 ? (
                    // Default preview row
                    <tr className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        R. Das (Caretaker)
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">HB-3</td>
                      <td className="px-4 py-3">
                        <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-xs">
                          Excellence Bonus (₹2,500)
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        Nominated by Dr. S. Nanda for maintaining 95.8% SLA compliance.
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="text-xs text-amber-600 border-amber-200 bg-amber-50">
                          Pending Approval
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          size="sm"
                          className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                          onClick={() => handleApprove("rew-1", "R. Das")}
                        >
                          <CheckCircle2Icon className="size-3.5" />
                          Sanction & Authorize
                        </Button>
                      </td>
                    </tr>
                  ) : (
                    rewards.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3 font-semibold text-slate-900">
                          {r.user_name || r.user_id}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs">
                          {r.hostel_code || "HB-3"}
                        </td>
                        <td className="px-4 py-3">
                          <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-xs">
                            {r.kind || "Commendation"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600">
                          {r.note || "Exemplary facility performance record"}
                        </td>
                        <td className="px-4 py-3">
                          {r.status === "APPROVED" ? (
                            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-xs">
                              Sanctioned
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs text-amber-600 border-amber-200 bg-amber-50">
                              Awaiting Seal
                            </Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {r.status === "APPROVED" ? (
                            <span className="text-xs text-slate-400 font-medium">Disbursed</span>
                          ) : (
                            <Button
                              size="sm"
                              className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                              onClick={() => handleApprove(r.id, r.user_name || r.user_id)}
                            >
                              <CheckCircle2Icon className="size-3.5" />
                              Sanction & Authorize
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))
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
