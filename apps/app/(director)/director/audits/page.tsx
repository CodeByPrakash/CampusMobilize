"use client";

import * as React from "react";
import { ROLES } from "@/lib/roles";
import { RoleDashboardShell } from "@/components/dashboards/role-dashboard-shell";
import { getDirectorNav } from "@/components/dashboards/nav-config";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShieldCheckIcon, DownloadIcon, FileTextIcon, CheckCircle2Icon, AlertCircleIcon, CalendarIcon } from "lucide-react";
import { toast } from "sonner";

export default function DirectorAuditsPage() {
  const role = ROLES.find((r) => r.id === "director") || ROLES[7];
  const navItems = getDirectorNav();

  const auditReports = [
    {
      id: "REP-2026-Q3",
      title: "Quarterly Comprehensive Campus Facility & Safety Audit",
      period: "July - September 2026",
      generatedAt: "Oct 01, 2026",
      complianceScore: "98.4%",
      auditor: "Internal Quality Assurance Cell (IQAC)",
      status: "Ratified by Director",
    },
    {
      id: "REP-2026-AUG",
      title: "Statutory Electrical & Transformer Oil Dissolved Gas Analysis (DGA)",
      period: "August 2026",
      generatedAt: "Aug 28, 2026",
      complianceScore: "100%",
      auditor: "CPWD Electrical Inspection Division",
      status: "Compliant",
    },
    {
      id: "REP-2026-JUL",
      title: "Hostel Drinking Water Microbiological & Heavy Metals Certificate",
      period: "July 2026",
      generatedAt: "Jul 15, 2026",
      complianceScore: "100%",
      auditor: "State Public Health Engineering Laboratory",
      status: "Potable Grade A",
    },
  ];

  const handleExportPack = (id: string) => {
    toast.success(`Executive pack for ${id} compiled and downloaded for Board of Governors review.`);
  };

  return (
    <RoleDashboardShell role={role} navItems={navItems}>
      <div className="space-y-6 max-w-6xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Institutional Governance & Statutory Audits
            </h1>
            <p className="text-sm text-slate-500">
              Executive compliance archives, IQAC quality certifications, and board reporting exports (§7.9).
            </p>
          </div>
          <Button
            className="bg-slate-900 hover:bg-slate-800 text-white gap-2 shadow-sm"
            onClick={() => handleExportPack("CURRENT-TERM")}
          >
            <DownloadIcon className="size-4" />
            Export Monthly Executive Pack (CSV/PDF)
          </Button>
        </div>

        {/* Audit Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-white border-slate-200">
            <CardHeader className="pb-2">
              <CardDescription>IQAC Compliance Score</CardDescription>
              <CardTitle className="text-2xl font-bold text-emerald-600 flex items-center gap-2">
                <CheckCircle2Icon className="size-6" />
                98.4% Compliant
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-500">Zero non-conformance notices active</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200">
            <CardHeader className="pb-2">
              <CardDescription>Fire Safety Certification</CardDescription>
              <CardTitle className="text-2xl font-bold text-slate-900">
                Valid till 2027
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-500">State Fire Officer NOC ratified across all halls</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200">
            <CardHeader className="pb-2">
              <CardDescription>AI Fairness & Guardrails</CardDescription>
              <CardTitle className="text-2xl font-bold text-indigo-600">
                100% Deterministic
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-500">SLA state machine conforms to rulebook §3.1</p>
            </CardContent>
          </Card>
        </div>

        {/* Audit Archive Table */}
        <Card className="bg-white border-slate-200">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-900">
              Official Institutional Compliance Reports
            </CardTitle>
            <CardDescription className="text-xs">
              Cryptographically signed and archived under NIT Rourkela statute §15
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-y border-slate-200 text-xs font-semibold text-slate-500 uppercase">
                  <tr>
                    <th className="px-4 py-3">Audit Report</th>
                    <th className="px-4 py-3">Reporting Period</th>
                    <th className="px-4 py-3">Auditing Authority</th>
                    <th className="px-4 py-3">Score</th>
                    <th className="px-4 py-3">Legal Status</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {auditReports.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        <div className="flex items-center gap-2">
                          <FileTextIcon className="size-4 text-slate-400" />
                          <div>
                            <div>{r.title}</div>
                            <span className="font-mono text-xs text-indigo-600 font-normal">{r.id}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        <div className="flex items-center gap-1 font-mono">
                          <CalendarIcon className="size-3 text-slate-400" />
                          {r.period}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        {r.auditor}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs font-bold text-emerald-600">
                        {r.complianceScore}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="text-xs text-slate-700 bg-slate-50">
                          {r.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 gap-1"
                          onClick={() => handleExportPack(r.id)}
                        >
                          <DownloadIcon className="size-3.5" />
                          Export Pack
                        </Button>
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
