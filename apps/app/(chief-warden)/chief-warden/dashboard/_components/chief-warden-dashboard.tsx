"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  Building2Icon,
  AlertOctagonIcon,
  AwardIcon,
  SparklesIcon,
  TrendingUpIcon,
  CheckCircle2Icon,
  ClockIcon,
  ShieldAlertIcon,
} from "lucide-react";
import { toast } from "sonner";
import { apiTransitionComplaint, apiApproveReward } from "@/lib/api";

interface CrossHostelStat {
  code: string;
  name: string;
  residents: number;
  openIssues: number;
  slaAdherence: string;
  criIndex: number;
  status: "Normal" | "Elevated" | "Attention";
}

interface RewardLedgerItem {
  id: string;
  caretakerName: string;
  hostel: string;
  trade: string;
  resolvedCount: number;
  onTimeRate: string;
  bonusAmount: string;
  status: "PENDING_APPROVAL" | "APPROVED";
}

const CROSS_HOSTEL_DATA: CrossHostelStat[] = [
  {
    code: "HB-3",
    name: "Hostel 14 (Homi Bhabha 3)",
    residents: 620,
    openIssues: 7,
    slaAdherence: "96.8%",
    criIndex: 28,
    status: "Normal",
  },
  {
    code: "KMS",
    name: "Kiran Mazumdar Shaw Hall",
    residents: 480,
    openIssues: 12,
    slaAdherence: "92.1%",
    criIndex: 38,
    status: "Normal",
  },
  {
    code: "CVR",
    name: "C.V. Raman Hall of Residence",
    residents: 750,
    openIssues: 19,
    slaAdherence: "84.5%",
    criIndex: 54,
    status: "Elevated",
  },
  {
    code: "GDB",
    name: "G.D. Birla Hall",
    residents: 560,
    openIssues: 9,
    slaAdherence: "94.2%",
    criIndex: 31,
    status: "Normal",
  },
];

const INITIAL_REWARDS: RewardLedgerItem[] = [
  {
    id: "rew-1",
    caretakerName: "R. Das",
    hostel: "HB-3",
    trade: "Electrical & Plumbing",
    resolvedCount: 38,
    onTimeRate: "100%",
    bonusAmount: "₹4,500",
    status: "PENDING_APPROVAL",
  },
  {
    id: "rew-2",
    caretakerName: "B. Mahapatra",
    hostel: "CVR",
    trade: "Civil & Sanitation",
    resolvedCount: 42,
    onTimeRate: "97.5%",
    bonusAmount: "₹4,000",
    status: "PENDING_APPROVAL",
  },
  {
    id: "rew-3",
    caretakerName: "A. Behera",
    hostel: "KMS",
    trade: "Electrical Maintenance",
    resolvedCount: 31,
    onTimeRate: "95.0%",
    bonusAmount: "₹3,200",
    status: "APPROVED",
  },
];

export function ChiefWardenDashboard() {
  const [rewards, setRewards] = React.useState<RewardLedgerItem[]>(INITIAL_REWARDS);
  const [escalatingTicket, setEscalatingTicket] = React.useState<string | null>(null);

  // Approve Caretaker Reward (§2.6)
  const handleApproveBonus = async (item: RewardLedgerItem) => {
    try {
      await apiApproveReward(item.id).catch(() => {});
      setRewards((prev) =>
        prev.map((r) =>
          r.id === item.id ? { ...r, status: "APPROVED" } : r
        )
      );
      toast.success(`Bonus reward for ${item.caretakerName} approved by Chief Warden!`);
    } catch {
      toast.error("Failed to approve reward");
    }
  };

  // Force Escalate ticket
  const handleForceEscalate = async (ticketNo: string) => {
    setEscalatingTicket(ticketNo);
    try {
      await apiTransitionComplaint(ticketNo, {
        to_status: "ESCALATED",
        note: "Force escalated campus-wide by Chief Warden Prof. M. Mishra due to critical threshold breach.",
      }).catch(() => {});
      toast.success(`Emergency ticket ${ticketNo} FORCE ESCALATED to Campus Works!`);
    } catch {
      toast.error("Failed to force escalate");
    } finally {
      setEscalatingTicket(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Campus Residents</CardDescription>
            <CardTitle className="text-2xl font-bold tabular-nums">
              2,410
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Building2Icon className="size-3.5" />
            <span>Across all 4 halls</span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Open Complaints</CardDescription>
            <CardTitle className="text-2xl font-bold tabular-nums">
              47 Active
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground flex items-center gap-1.5">
            <ClockIcon className="size-3.5" />
            <span>Average turnaround: 3.4 hrs</span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Campus SLA Compliance</CardDescription>
            <CardTitle className="text-2xl font-bold tabular-nums">
              92.3%
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground flex items-center gap-1.5">
            <TrendingUpIcon className="size-3.5" />
            <span>+2.4% vs last month</span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Monthly Rewards Ledger</CardDescription>
            <CardTitle className="text-2xl font-bold tabular-nums">
              ₹11,700
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground flex items-center gap-1.5">
            <AwardIcon className="size-3.5" />
            <span>2 approvals pending</span>
          </CardContent>
        </Card>
      </div>

      {/* Emergency Escalate Quick Alert */}
      <div className="flex items-center justify-between rounded-lg border border-destructive/40 bg-destructive/5 p-4">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-destructive text-destructive-foreground">
            <AlertOctagonIcon className="size-5" />
          </div>
          <div>
            <div className="text-sm font-semibold text-foreground">
              Critical Watch: CVR Hall 3rd Floor Water Main Pressure Surge
            </div>
            <div className="text-xs text-muted-foreground">
              Overdue by 1.5 hrs. Chief Warden force-escalate authority available (§2.6).
            </div>
          </div>
        </div>
        <Button
          variant="destructive"
          size="sm"
          disabled={escalatingTicket === "CMP-CVR-0042"}
          onClick={() => handleForceEscalate("CMP-CVR-0042")}
          className="text-xs gap-1.5"
        >
          <ShieldAlertIcon className="size-3.5" />
          <span>{escalatingTicket === "CMP-CVR-0042" ? "Escalating..." : "Force Escalate"}</span>
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="halls" className="space-y-4">
        <TabsList>
          <TabsTrigger value="halls">Cross-Hostel Comparison</TabsTrigger>
          <TabsTrigger value="rewards">Caretaker Rewards Approval ({rewards.filter(r => r.status === "PENDING_APPROVAL").length})</TabsTrigger>
          <TabsTrigger value="festival">Festival & Surge Demand Pre-Brief</TabsTrigger>
        </TabsList>

        <TabsContent value="halls" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Campus Command Matrix (All 4 Halls)</CardTitle>
              <CardDescription className="text-xs">
                Real-time operational indicators, student load, open complaints and Risk Index scores.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Hostel Code</TableHead>
                    <TableHead>Hall Name</TableHead>
                    <TableHead>Residents</TableHead>
                    <TableHead>Open Tickets</TableHead>
                    <TableHead>SLA Adherence</TableHead>
                    <TableHead>Risk Index (CRI)</TableHead>
                    <TableHead className="text-right">Condition</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {CROSS_HOSTEL_DATA.map((h) => (
                    <TableRow key={h.code}>
                      <TableCell className="font-mono text-xs font-semibold">
                        {h.code}
                      </TableCell>
                      <TableCell className="text-xs font-medium">
                        {h.name}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono">
                        {h.residents}
                      </TableCell>
                      <TableCell className="text-xs font-mono font-medium">
                        {h.openIssues}
                      </TableCell>
                      <TableCell className="text-xs font-mono">
                        {h.slaAdherence}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={h.criIndex > 50 ? "destructive" : "outline"}
                          className="text-[10px] font-mono"
                        >
                          {h.criIndex} / 100
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant={h.status === "Elevated" ? "destructive" : "secondary"}
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

        <TabsContent value="rewards" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Caretaker Performance Bonus Ledger (§2.6)</CardTitle>
              <CardDescription className="text-xs">
                Chief Warden authority to approve monthly rewards based on zero-SLA breach performance.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Caretaker</TableHead>
                    <TableHead>Hostel & Trade</TableHead>
                    <TableHead>Resolved</TableHead>
                    <TableHead>On-Time SLA</TableHead>
                    <TableHead>Proposed Bonus</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Decision</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rewards.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium text-xs">
                        {r.caretakerName}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {r.hostel} • {r.trade}
                      </TableCell>
                      <TableCell className="font-mono text-xs font-semibold">
                        {r.resolvedCount}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {r.onTimeRate}
                      </TableCell>
                      <TableCell className="font-mono text-xs font-semibold">
                        {r.bonusAmount}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={r.status === "APPROVED" ? "secondary" : "default"}
                          className="text-[10px]"
                        >
                          {r.status === "APPROVED" ? "Approved" : "Pending"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {r.status === "PENDING_APPROVAL" ? (
                          <Button
                            size="sm"
                            className="h-7 text-xs px-2 gap-1"
                            onClick={() => handleApproveBonus(r)}
                          >
                            <CheckCircle2Icon className="size-3" />
                            <span>Approve</span>
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">Disbursed</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="festival" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <SparklesIcon className="size-4" />
                  <span>Innovision 2026 Surge</span>
                </CardTitle>
                <CardDescription className="text-xs">Technical Festival (3 Days)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Expected Guests:</span>
                  <span className="font-mono font-medium">+1,200</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Extra Water Demand:</span>
                  <span className="font-mono">+35,000 L / day</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Standby Tradesmen:</span>
                  <Badge variant="secondary" className="text-[10px]">8 Assigned</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <SparklesIcon className="size-4" />
                  <span>Nitrutsav 2026</span>
                </CardTitle>
                <CardDescription className="text-xs">Cultural Festival (Weekend)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Peak Power Surge:</span>
                  <span className="font-mono">+180 kVA</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">DG Backup:</span>
                  <Badge variant="outline" className="text-[10px]">Ready</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Hall 14 Prep:</span>
                  <span>100% Inspected</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <SparklesIcon className="size-4" />
                  <span>Monsoon Contingency</span>
                </CardTitle>
                <CardDescription className="text-xs">Seasonal Drainage Audit</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Basement Pumps:</span>
                  <Badge variant="secondary" className="text-[10px]">Tested OK</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Roof Drains:</span>
                  <span>Cleared</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Risk Rating:</span>
                  <span className="font-mono">Low (P4)</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
