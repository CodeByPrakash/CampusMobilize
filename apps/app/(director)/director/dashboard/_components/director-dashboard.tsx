"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ActivityIcon,
  ShieldCheckIcon,
  TrendingUpIcon,
  TrophyIcon,
  CheckCircle2Icon,
  AlertTriangleIcon,
  Building2Icon,
} from "lucide-react";

import { NitRourkelaMap } from "@/components/sustainability/nit-rourkela-map";
import { SustainabilityScoreCharts } from "@/components/sustainability/sustainability-score-charts";

interface HallRanking {
  rank: number;
  hallName: string;
  code: string;
  dignityScore: number;
  openIssues: number;
  avgResolutionHours: number;
  slaCompliance: string;
  status: "Optimal" | "Good" | "Needs Review";
}

const HALL_RANKINGS: HallRanking[] = [
  {
    rank: 1,
    hallName: "Hostel 14 (Homi Bhabha 3)",
    code: "HB-3",
    dignityScore: 94.6,
    openIssues: 7,
    avgResolutionHours: 2.1,
    slaCompliance: "96.8%",
    status: "Optimal",
  },
  {
    rank: 2,
    hallName: "G.D. Birla Hall",
    code: "GDB",
    dignityScore: 89.2,
    openIssues: 9,
    avgResolutionHours: 2.8,
    slaCompliance: "94.2%",
    status: "Optimal",
  },
  {
    rank: 3,
    hallName: "Kiran Mazumdar Shaw Hall",
    code: "KMS",
    dignityScore: 84.5,
    openIssues: 12,
    avgResolutionHours: 3.4,
    slaCompliance: "92.1%",
    status: "Good",
  },
  {
    rank: 4,
    hallName: "C.V. Raman Hall of Residence",
    code: "CVR",
    dignityScore: 78.1,
    openIssues: 19,
    avgResolutionHours: 4.8,
    slaCompliance: "84.5%",
    status: "Needs Review",
  },
];

export function DirectorDashboard() {
  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Campus Risk Index (CRI)</CardDescription>
            <CardTitle className="text-2xl font-bold tabular-nums">
              31 / 100
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground flex items-center gap-1.5">
            <ActivityIcon className="size-3.5" />
            <span>Low Risk • All Systems Guarded</span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Overall Campus Dignity Score</CardDescription>
            <CardTitle className="text-2xl font-bold tabular-nums">
              86.6%
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground flex items-center gap-1.5">
            <TrophyIcon className="size-3.5" />
            <span>Living standard baseline met</span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Institution SLA Benchmark</CardDescription>
            <CardTitle className="text-2xl font-bold tabular-nums">
              92.3%
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground flex items-center gap-1.5">
            <CheckCircle2Icon className="size-3.5" />
            <span>Target: &gt; 90.0%</span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Enrolled Residents</CardDescription>
            <CardTitle className="text-2xl font-bold tabular-nums">
              2,410
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Building2Icon className="size-3.5" />
            <span>4 Halls of Residence</span>
          </CardContent>
        </Card>
      </div>

      {/* CRI Scorecard & Sub-indices */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <ShieldCheckIcon className="size-4" />
              <span>Campus Risk Gauge (2.8)</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Composite risk formulation across electrical hazards, sanitation, and pending complaints.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center p-6 space-y-4">
            <div className="flex flex-col items-center justify-center size-36 rounded-full border-4 border-muted p-4 text-center">
              <span className="text-3xl font-extrabold tabular-nums tracking-tight">31</span>
              <span className="text-[11px] text-muted-foreground uppercase font-semibold">CRI Rating</span>
            </div>
            <Badge variant="secondary" className="text-xs px-3 py-1">
              LOW RISK (STABLE)
            </Badge>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">CRI Factor Breakdown</CardTitle>
            <CardDescription className="text-xs">
              Underlying factors determining safety and student quality of life.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span>Electrical Safety & Fire Prevention:</span>
                <span className="font-semibold">18 / 100 (Safe)</span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-primary" style={{ width: "18%" }} />
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span>Water Purity & Sanitation Index:</span>
                <span className="font-semibold">24 / 100 (Safe)</span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-primary" style={{ width: "24%" }} />
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span>Infrastructure & Structural Integrity:</span>
                <span className="font-semibold">29 / 100 (Safe)</span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-primary" style={{ width: "29%" }} />
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span>SLA Delay & Backlog Penalty:</span>
                <span className="font-semibold">42 / 100 (Moderate)</span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-primary" style={{ width: "42%" }} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="heatmap" className="space-y-4">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="heatmap" className="text-xs">Spatial Risk Heatmap (NIT Rourkela)</TabsTrigger>
          <TabsTrigger value="sustainability" className="text-xs">Sustainability AI Score Graphs</TabsTrigger>
          <TabsTrigger value="rankings" className="text-xs">Hall Living Standards</TabsTrigger>
          <TabsTrigger value="governance" className="text-xs">Governance Audits</TabsTrigger>
        </TabsList>

        <TabsContent value="heatmap" className="space-y-4">
          <NitRourkelaMap />
        </TabsContent>

        <TabsContent value="sustainability" className="space-y-4">
          <SustainabilityScoreCharts />
        </TabsContent>

        <TabsContent value="rankings" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Hall Dignity & Living Standard Ranking (2.8)</CardTitle>
              <CardDescription className="text-xs">
                Performance across student satisfaction, cleanliness, and maintenance turnaround.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rank</TableHead>
                    <TableHead>Hostel Name</TableHead>
                    <TableHead>Dignity Index</TableHead>
                    <TableHead>Open Issues</TableHead>
                    <TableHead>Avg Resolution</TableHead>
                    <TableHead>SLA Compliance</TableHead>
                    <TableHead className="text-right">Governance Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {HALL_RANKINGS.map((h) => (
                    <TableRow key={h.code}>
                      <TableCell className="font-semibold text-xs tabular-nums">
                        #{h.rank}
                      </TableCell>
                      <TableCell className="text-xs font-medium">
                        {h.hallName} ({h.code})
                      </TableCell>
                      <TableCell className="font-mono text-xs font-semibold">
                        {h.dignityScore}%
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {h.openIssues}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {h.avgResolutionHours} hrs
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {h.slaCompliance}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant={h.status === "Needs Review" ? "destructive" : "secondary"}
                          className="text-[10px]"
                        >
                          {h.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="governance" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <CheckCircle2Icon className="size-4" />
                  <span>Annual Hostel Budget Allocation</span>
                </CardTitle>
                <CardDescription className="text-xs">FY 2026-27 Maintenance Grants</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Capital Works Grant:</span>
                  <span className="font-mono font-semibold">₹1.20 Crore</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Disbursed to Date:</span>
                  <span className="font-mono">₹64.5 Lakh (53.7%)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Audit Clearance:</span>
                  <Badge variant="secondary" className="text-[10px]">Unqualified (Clean)</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <AlertTriangleIcon className="size-4" />
                  <span>CVR Hall Remediation Action</span>
                </CardTitle>
                <CardDescription className="text-xs">Underperforming SLA Response</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Directive Issued:</span>
                  <span>Additional Plumber Deputed</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Review Milestone:</span>
                  <span>15 Nov 2026</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Oversight:</span>
                  <Badge variant="outline" className="text-[10px]">Chief Warden Assigned</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
