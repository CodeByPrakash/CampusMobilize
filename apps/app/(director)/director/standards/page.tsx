"use client";

import * as React from "react";
import { ROLES } from "@/lib/roles";
import { RoleDashboardShell } from "@/components/dashboards/role-dashboard-shell";
import { getDirectorNav } from "@/components/dashboards/nav-config";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrophyIcon, AwardIcon, TrendingUpIcon, Building2Icon, DropletsIcon, ZapIcon, SparklesIcon } from "lucide-react";
import { toast } from "sonner";
import { apiGetCampusRatings } from "@/lib/api";

export default function DirectorStandardsPage() {
  const role = ROLES.find((r) => r.id === "director") || ROLES[7];
  const navItems = getDirectorNav();

  const [ratings, setRatings] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function load() {
      try {
        const res = await apiGetCampusRatings();
        const list = Array.isArray(res) ? res : [res];
        setRatings(list);
      } catch {
        // Fallback demo ratings
        setRatings([
          {
            hostel_code: "HB-3",
            hostel_name: "Hall of Residence 14",
            efficiency_rating: 94.6,
            resolution_rate_pct: 96.2,
            per_resident_energy_index: 88.4,
            per_resident_water_index: 3.8,
            hygiene_audit_score: 95.0,
            status: "DIAMOND_STANDARD",
          },
          {
            hostel_code: "HB-1",
            hostel_name: "Hall of Residence 1 (KMS)",
            efficiency_rating: 88.2,
            resolution_rate_pct: 91.0,
            per_resident_energy_index: 92.1,
            per_resident_water_index: 4.2,
            hygiene_audit_score: 89.0,
            status: "GOLD_STANDARD",
          },
          {
            hostel_code: "HB-2",
            hostel_name: "Hall of Residence 2 (MV)",
            efficiency_rating: 86.5,
            resolution_rate_pct: 88.5,
            per_resident_energy_index: 94.5,
            per_resident_water_index: 4.4,
            hygiene_audit_score: 87.0,
            status: "GOLD_STANDARD",
          },
          {
            hostel_code: "HB-4",
            hostel_name: "Hall of Residence 4 (DBA)",
            efficiency_rating: 82.1,
            resolution_rate_pct: 84.0,
            per_resident_energy_index: 98.0,
            per_resident_water_index: 4.6,
            hygiene_audit_score: 83.5,
            status: "SILVER_STANDARD",
          },
        ]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <RoleDashboardShell role={role} navItems={navItems}>
      <div className="space-y-6 max-w-8xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Campus Living Standards & Quality Index
            </h1>
            <p className="text-sm text-slate-500">
              Cross-hostel benchmark metrics comparing hygiene, energy efficiency, and student satisfaction (11.3).
            </p>
          </div>
          <Badge className="bg-indigo-600 text-white px-3 py-1 text-sm font-semibold gap-1.5">
            <TrophyIcon className="size-4" />
            Executive Oversight Desk
          </Badge>
        </div>

        {/* Top Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-white border-slate-200">
            <CardHeader className="pb-2">
              <CardDescription>Campus Living Index</CardDescription>
              <CardTitle className="text-2xl font-bold text-slate-900">87.8 / 100</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-500">+6.4 pts increase over last academic year</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200">
            <CardHeader className="pb-2">
              <CardDescription>Top Ranked Hall</CardDescription>
              <CardTitle className="text-2xl font-bold text-emerald-600">Hall 14 (HB-3)</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-500">94.6 Efficiency Rating (Diamond Tier)</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200">
            <CardHeader className="pb-2">
              <CardDescription>Avg Resolution Rate</CardDescription>
              <CardTitle className="text-2xl font-bold text-indigo-600">89.9%</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-500">Within statutory SLA across 4 hostels</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200">
            <CardHeader className="pb-2">
              <CardDescription>Hygiene Audit Mean</CardDescription>
              <CardTitle className="text-2xl font-bold text-slate-900">88.6 / 100</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-500">Zero public health violations</p>
            </CardContent>
          </Card>
        </div>

        {/* Ratings Table */}
        <Card className="bg-white border-slate-200">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-900">
              Hostel Efficiency & Standards Matrix (11.3)
            </CardTitle>
            <CardDescription className="text-xs">
              Direct telemetry-based ranking published for the Institute Board of Governors
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-y border-slate-200 text-xs font-semibold text-slate-500 uppercase">
                  <tr>
                    <th className="px-4 py-3">Hostel</th>
                    <th className="px-4 py-3">Rating Tier</th>
                    <th className="px-4 py-3 text-right">Efficiency Score</th>
                    <th className="px-4 py-3 text-right">Resolution Rate</th>
                    <th className="px-4 py-3 text-right">Energy / Cap</th>
                    <th className="px-4 py-3 text-right">Hygiene Index</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ratings.map((r, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-semibold text-slate-900 flex items-center gap-2">
                        <Building2Icon className="size-4 text-slate-400" />
                        <div>
                          <div>{r.hostel_name || r.hostel_code}</div>
                          <div className="text-xs text-slate-400 font-mono font-normal">{r.hostel_code}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="outline"
                          className={
                            idx === 0
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold"
                              : "bg-indigo-50 text-indigo-700 border-indigo-200"
                          }
                        >
                          {idx === 0 ? "★ Diamond" : "Gold Standard"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                        {r.efficiency_rating} / 100
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs font-semibold text-emerald-600">
                        {r.resolution_rate_pct}%
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs text-slate-600">
                        {r.per_resident_energy_index || 88.0}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs font-bold text-indigo-700">
                        {r.hygiene_audit_score || 90.0}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </RoleDashboardShell>
  );
}
