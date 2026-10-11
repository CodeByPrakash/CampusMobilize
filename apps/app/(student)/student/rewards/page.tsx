"use client";

import * as React from "react";
import { ROLES } from "@/lib/roles";
import { RoleDashboardShell } from "@/components/dashboards/role-dashboard-shell";
import { getStudentNav } from "@/components/dashboards/nav-config";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AwardIcon, SparklesIcon, TrophyIcon, ShieldCheckIcon, GiftIcon, CheckCircle2Icon } from "lucide-react";
import { toast } from "sonner";
import { apiListRewards } from "@/lib/api";

export default function StudentRewardsPage() {
  const role = ROLES.find((r) => r.id === "student") || ROLES[0];
  const navItems = getStudentNav();

  const [rewards, setRewards] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [points, setPoints] = React.useState(340);

  React.useEffect(() => {
    async function loadRewards() {
      try {
        const res = await apiListRewards();
        const items = Array.isArray(res) ? res : res?.items || [];
        setRewards(items);
      } catch {
        // Fallback or demo state
      } finally {
        setLoading(false);
      }
    }
    loadRewards();
  }, []);

  const perks = [
    {
      id: "p1",
      title: "Priority Washing Machine Slot",
      cost: 150,
      description: "Skip weekend laundry queues with guaranteed 2-hour reserved slot.",
      icon: <SparklesIcon className="size-5 text-indigo-500" />,
    },
    {
      id: "p2",
      title: "Common Room Gym Locker Pass",
      cost: 250,
      description: "Dedicated high-security locker in Hostel 14 sports complex for 1 month.",
      icon: <AwardIcon className="size-5 text-amber-500" />,
    },
    {
      id: "p3",
      title: "Central Library 24x7 Night Pass",
      cost: 300,
      description: "Access overnight study cubicles during mid-semester examination week.",
      icon: <ShieldCheckIcon className="size-5 text-emerald-500" />,
    },
    {
      id: "p4",
      title: "Chief Warden Civic Commendation",
      cost: 500,
      description: "Formal letter of civic contribution endorsed by Chief Warden for CV.",
      icon: <TrophyIcon className="size-5 text-purple-500" />,
    },
  ];

  const handleRedeem = (cost: number, title: string) => {
    if (points < cost) {
      toast.error(`Insufficient points! You need ${cost - points} more pts.`);
      return;
    }
    setPoints((p) => p - cost);
    toast.success(`Redeemed "${title}"! Voucher sent to your campus email.`);
  };

  return (
    <RoleDashboardShell role={role} navItems={navItems}>
      <div className="space-y-6 max-w-5xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Civic Rewards & Dignity Ledger
            </h1>
            <p className="text-sm text-slate-500">
              Earn community points for reporting genuine hostel issues, upvoting hazards, and maintaining Wing standards.
            </p>
          </div>
          <Badge className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 text-sm font-semibold gap-1.5">
            <TrophyIcon className="size-4" />
            Tier: Silver Resident
          </Badge>
        </div>

        {/* Balance Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-indigo-50 to-white border-indigo-100">
            <CardHeader className="pb-2">
              <CardDescription className="text-indigo-600 font-medium">Available Balance</CardDescription>
              <CardTitle className="text-3xl font-extrabold text-slate-900 flex items-baseline gap-2">
                {points}
                <span className="text-sm font-normal text-slate-500">pts</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-600">
                160 pts until <span className="font-semibold text-indigo-700">Gold Champion</span> status.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200">
            <CardHeader className="pb-2">
              <CardDescription>Verified Resolutions</CardDescription>
              <CardTitle className="text-3xl font-bold text-emerald-600">
                4 / 4
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-500">
                100% genuine validation rate (Zero false reports).
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200">
            <CardHeader className="pb-2">
              <CardDescription>Community Impact</CardDescription>
              <CardTitle className="text-3xl font-bold text-slate-900">
                +42 Upvotes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-500">
                Helped escalate 3 high-severity water leakages in Wing B.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Redeem Perks */}
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <GiftIcon className="size-5 text-indigo-600" />
            Campus Privilege Store
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {perks.map((p) => (
              <Card key={p.id} className="bg-white border-slate-200 hover:border-slate-300 transition-shadow">
                <CardHeader className="pb-2 flex flex-row items-start justify-between space-y-0">
                  <div className="space-y-1">
                    <CardTitle className="text-base font-semibold text-slate-900">
                      {p.title}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {p.description}
                    </CardDescription>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                    {p.icon}
                  </div>
                </CardHeader>
                <CardContent className="pt-2 flex items-center justify-between">
                  <span className="text-sm font-bold text-indigo-600">
                    {p.cost} pts
                  </span>
                  <Button
                    size="sm"
                    variant={points >= p.cost ? "default" : "outline"}
                    className={points >= p.cost ? "bg-slate-900 text-white hover:bg-slate-800" : "text-slate-400"}
                    disabled={points < p.cost}
                    onClick={() => handleRedeem(p.cost, p.title)}
                  >
                    {points >= p.cost ? "Redeem" : "Locked"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Ledger Activity */}
        <Card className="bg-white border-slate-200">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-900">
              Recent Points Activity
            </CardTitle>
            <CardDescription className="text-xs">
              Autonomous points ledger synced with facility resolution lifecycle (§11)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-slate-100">
              <div className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle2Icon className="size-4 text-emerald-500" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">Verified Resolution — TI-HB3-0104</p>
                    <p className="text-xs text-slate-500">Water Cooler Filter Replacement verified by Hostel Rep</p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-emerald-600">+50 pts</span>
              </div>
              <div className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <SparklesIcon className="size-4 text-indigo-500" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">Civic Upvote Milestone</p>
                    <p className="text-xs text-slate-500">Upvoted 5 confirmed corridor hazards before warden inspection</p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-emerald-600">+25 pts</span>
              </div>
              <div className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle2Icon className="size-4 text-emerald-500" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">First-Time Resolution Feedback</p>
                    <p className="text-xs text-slate-500">Rated Caretaker repair with 5-star photographic proof</p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-emerald-600">+15 pts</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </RoleDashboardShell>
  );
}
